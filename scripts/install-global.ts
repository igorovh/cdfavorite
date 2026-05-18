import { copyFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { isDirectoryOnPath } from "../src/infrastructure/command-path";
import { buildExecutable, buildTargets, executableExtension } from "./build-shared";

const yes = process.argv.includes("--yes");
const noPath = process.argv.includes("--no-path");
const dryRun = process.argv.includes("--dry-run");

const binDirectory = getGlobalBinDirectory();
const executables = buildTargets.map((target) => ({
  ...target,
  distPath: target.outfile,
  installPath: join(binDirectory, `${target.name}${executableExtension}`),
}));

if (dryRun) {
  console.log("Global install dry run:");
  console.log(`Executable directory: ${binDirectory}`);

  for (const executable of executables) {
    console.log(`- build ${executable.entrypoint} -> ${executable.distPath}`);
    console.log(`- copy ${executable.distPath} -> ${executable.installPath}`);
  }

  const pathValue = process.env.PATH ?? process.env.Path ?? "";
  console.log(
    isDirectoryOnPath(binDirectory, pathValue)
      ? "PATH contains the executable directory."
      : "PATH does not currently contain the executable directory.",
  );
  process.exit(0);
}

await mkdir("dist", { recursive: true });
await mkdir(binDirectory, { recursive: true });

for (const executable of executables) {
  await buildExecutable(executable);
  await mkdir(dirname(executable.installPath), { recursive: true });
  await copyFileWithRetry(executable.distPath, executable.installPath);
  console.log(`Installed ${executable.name} to ${executable.installPath}`);
}

if (noPath) {
  printFinalInstructions(binDirectory, false);
  process.exit(0);
}

if (process.platform !== "win32") {
  const pathValue = process.env.PATH ?? process.env.Path ?? "";

  if (isDirectoryOnPath(binDirectory, pathValue)) {
    printFinalInstructions(binDirectory, true);
    process.exit(0);
  }

  console.log("");
  console.log(`${binDirectory} is not currently on PATH.`);
  console.log(`Add this to your shell config: export PATH="${binDirectory}:$PATH"`);
  printFinalInstructions(binDirectory, false);
  process.exit(0);
}

const shouldUpdatePath =
  yes || (await askYesNo(`Move ${binDirectory} to the front of your user PATH? [Y/n] `));

if (shouldUpdatePath) {
  await addDirectoryToWindowsUserPath(binDirectory);
  printFinalInstructions(binDirectory, true);
} else {
  printFinalInstructions(binDirectory, false);
}

function getGlobalBinDirectory(): string {
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "cdf", "bin");
  }

  return join(homedir(), ".local", "bin");
}

async function askYesNo(question: string): Promise<boolean> {
  const readline = createInterface({ input, output });
  const answer = (await readline.question(question)).trim().toLowerCase();
  readline.close();

  return answer.length === 0 || answer === "y" || answer === "yes";
}

async function copyFileWithRetry(source: string, destination: string): Promise<void> {
  const maxAttempts = 8;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await copyFile(source, destination);
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const isRetryable =
        error instanceof Error &&
        "code" in error &&
        ["EBUSY", "EPERM", "EACCES"].includes(String(error.code));

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      await Bun.sleep(attempt * 250);
    }
  }
}

async function addDirectoryToWindowsUserPath(directory: string): Promise<void> {
  const currentUserPath = getWindowsUserPath();
  const nextUserPath = prependDirectoryToPath(directory, currentUserPath);
  const result = Bun.spawnSync({
    cmd: [
      "powershell.exe",
      "-NoProfile",
      "-Command",
      "[Environment]::SetEnvironmentVariable('Path', $env:CDF_NEW_USER_PATH, 'User')",
    ],
    env: { ...process.env, CDF_NEW_USER_PATH: nextUserPath },
    stdout: "inherit",
    stderr: "inherit",
  });

  if (!result.success) {
    console.error("Failed to update the user PATH.");
    process.exit(result.exitCode ?? 1);
  }
}

function prependDirectoryToPath(directory: string, pathValue: string): string {
  const normalizedDirectory = normalizePathForComparison(directory);
  const existingDirectories = pathValue
    .split(";")
    .map((pathDirectory) => pathDirectory.trim())
    .filter((pathDirectory) => pathDirectory.length > 0)
    .filter((pathDirectory) => normalizePathForComparison(pathDirectory) !== normalizedDirectory);

  return [directory, ...existingDirectories].join(";");
}

function normalizePathForComparison(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function getWindowsUserPath(): string {
  const result = Bun.spawnSync({
    cmd: [
      "powershell.exe",
      "-NoProfile",
      "-Command",
      "[Environment]::GetEnvironmentVariable('Path', 'User')",
    ],
    stdout: "pipe",
    stderr: "inherit",
  });

  if (!result.success) {
    return "";
  }

  return new TextDecoder().decode(result.stdout).trim();
}

function printFinalInstructions(directory: string, pathConfigured: boolean): void {
  console.log("");
  console.log("Global install complete.");
  console.log(`Executable directory: ${directory}`);

  if (pathConfigured) {
    console.log("Open a new terminal session so PATH changes are picked up, then run:");
  } else {
    console.log("Make sure the executable directory is on PATH, then run:");
  }

  console.log("  cdf-setup");
}

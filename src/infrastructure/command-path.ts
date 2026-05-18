import { accessSync, constants, statSync } from "node:fs";
import { join } from "node:path";

export function findCommandOnPath(commandName: string): string | undefined {
  const pathValue = process.env.PATH ?? process.env.Path ?? "";
  const pathDirectories = pathValue.split(process.platform === "win32" ? ";" : ":").filter(Boolean);
  const extensions =
    process.platform === "win32" ? getWindowsExecutableExtensions(commandName) : [""];

  for (const directory of pathDirectories) {
    for (const extension of extensions) {
      const candidate = join(directory, `${commandName}${extension}`);

      if (isRunnableFile(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

function isRunnableFile(path: string): boolean {
  try {
    const stat = statSync(path);

    if (!stat.isFile()) {
      return false;
    }

    if (process.platform === "win32") {
      return true;
    }

    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function isDirectoryOnPath(
  directory: string,
  pathValue = process.env.PATH ?? process.env.Path ?? "",
): boolean {
  const delimiter = process.platform === "win32" ? ";" : ":";
  const normalizedDirectory = normalizePathForComparison(directory);

  return pathValue
    .split(delimiter)
    .filter(Boolean)
    .some((pathDirectory) => normalizePathForComparison(pathDirectory) === normalizedDirectory);
}

function getWindowsExecutableExtensions(commandName: string): string[] {
  if (/\.[a-z0-9]+$/i.test(commandName)) {
    return [""];
  }

  const pathExtensions = process.env.PATHEXT?.split(";").filter(Boolean) ?? [
    ".EXE",
    ".CMD",
    ".BAT",
  ];
  return ["", ...pathExtensions.map((extension) => extension.toLowerCase())];
}

function normalizePathForComparison(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

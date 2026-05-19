import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const startMarker = "# >>> cdf >>>";
const endMarker = "# <<< cdf <<<";

export type SetupResult = {
  shell: "bash" | "zsh" | "nushell" | "powershell";
  path: string;
  status: "installed" | "updated" | "skipped" | "failed";
  error?: string;
};

export type ShellConfigTarget = {
  shell: SetupResult["shell"];
  path: string;
  block: string;
  createIfMissing?: boolean;
};

export async function installShellWrappers(targets: ShellConfigTarget[]): Promise<SetupResult[]> {
  const results: SetupResult[] = [];

  for (const target of targets) {
    results.push(await installShellWrapper(target));
  }

  return results;
}

export function getAvailableShellConfigTargets(): ShellConfigTarget[] {
  const targets = getShellConfigTargets();
  const existingTargets = targets.filter((target) => existsSync(target.path));
  const hasExistingPowerShellProfile = existingTargets.some(
    (target) => target.shell === "powershell",
  );

  return targets.filter(
    (target) =>
      existsSync(target.path) ||
      (target.createIfMissing && !(target.shell === "powershell" && hasExistingPowerShellProfile)),
  );
}

export function getShellConfigTargets(): ShellConfigTarget[] {
  const home = homedir();
  const appData = process.env.APPDATA;
  const nushellConfigPaths = [
    appData ? join(appData, "nushell", "config.nu") : undefined,
    join(home, ".config", "nushell", "config.nu"),
  ].filter((path): path is string => Boolean(path));

  const targets: ShellConfigTarget[] = [
    {
      shell: "bash",
      path: join(home, ".bashrc"),
      block: bashOrZshBlock(),
    },
    {
      shell: "zsh",
      path: join(home, ".zshrc"),
      block: bashOrZshBlock(),
    },
  ];

  for (const path of unique(nushellConfigPaths)) {
    targets.push({
      shell: "nushell",
      path,
      block: nushellBlock(),
    });
  }

  targets.push(...getPowerShellConfigTargets(home));

  return targets;
}

export function bashOrZshBlock(): string {
  return `${startMarker}
cdf() {
  local target
  target="$(command cdf-run "$@")" || return

  if [ -n "$target" ]; then
    cd "$target"
  fi
}
${endMarker}`;
}

export function nushellBlock(): string {
  return `${startMarker}
def --env cdf [...args] {
    let target = (^cdf-run ...$args | str trim)

    if ($target | is-not-empty) {
        cd $target
    }
}
${endMarker}`;
}

export function powershellBlock(): string {
  return `${startMarker}
function cdf {
    $target = & cdf-run @args

    if ($LASTEXITCODE -ne 0) {
        return
    }

    if ($target) {
        Set-Location -LiteralPath ([string]$target).Trim()
    }
}
${endMarker}`;
}

async function installShellWrapper(target: ShellConfigTarget): Promise<SetupResult> {
  const configExists = existsSync(target.path);

  if (!configExists && !target.createIfMissing) {
    return { shell: target.shell, path: target.path, status: "skipped" };
  }

  try {
    const existingContent = configExists ? await readFile(target.path, "utf8") : "";
    const nextContent = upsertMarkedBlock(existingContent, target.block);
    const status = nextContent.replaced ? "updated" : "installed";

    if (configExists) {
      await backupFile(target.path);
    }

    await writeFileAtomically(target.path, nextContent.content);

    return { shell: target.shell, path: target.path, status };
  } catch (error) {
    return {
      shell: target.shell,
      path: target.path,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function getPowerShellConfigTargets(home: string): ShellConfigTarget[] {
  const block = powershellBlock();

  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE ?? home;
    const documentsDirectory = join(userProfile, "Documents");
    const paths = [
      join(documentsDirectory, "PowerShell", "Microsoft.PowerShell_profile.ps1"),
      join(documentsDirectory, "WindowsPowerShell", "Microsoft.PowerShell_profile.ps1"),
    ];

    return unique(paths).map((path, index) => ({
      shell: "powershell",
      path,
      block,
      createIfMissing: index === 0,
    }));
  }

  const configHome = process.env.XDG_CONFIG_HOME ?? join(home, ".config");

  return [
    {
      shell: "powershell",
      path: join(configHome, "powershell", "Microsoft.PowerShell_profile.ps1"),
      block,
    },
  ];
}

function upsertMarkedBlock(content: string, block: string): { content: string; replaced: boolean } {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex >= 0 && endIndex >= 0) {
    const afterEndIndex = endIndex + endMarker.length;
    const contentBefore = content.slice(0, startIndex).replace(/\n*$/, "");
    const contentAfter = content.slice(afterEndIndex).replace(/^\n*/, "");
    const sections = [contentBefore, block, contentAfter].filter((section) => section.length > 0);

    return { content: `${sections.join("\n")}\n`, replaced: true };
  }

  const separator = content.endsWith("\n") || content.length === 0 ? "" : "\n";

  if (content.length === 0) {
    return { content: `${block}\n`, replaced: false };
  }

  return { content: `${content}${separator}\n${block}\n`, replaced: false };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function backupFile(path: string): Promise<void> {
  const backupPath = `${path}.cdf-backup-${Date.now()}`;
  await copyFile(path, backupPath);
}

async function writeFileAtomically(path: string, content: string): Promise<void> {
  const temporaryPath = `${path}.cdf-${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(path), { recursive: true });
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, path);
}

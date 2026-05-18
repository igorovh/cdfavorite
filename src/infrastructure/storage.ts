import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

import { isPathEntry, type PathEntry } from "../domain/path-entry";
import { cdfConfigDirectory, pathsJsonPath } from "./config-paths";

export type LoadResult =
  | {
      ok: true;
      entries: PathEntry[];
      warning?: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function loadPathEntries(): Promise<LoadResult> {
  try {
    await mkdir(cdfConfigDirectory, { recursive: true });
    const content = await readFile(pathsJsonPath, "utf8");

    if (content.trim().length === 0) {
      return { ok: true, entries: [] };
    }

    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed)) {
      return {
        ok: false,
        error: `${pathsJsonPath} does not contain an array. Refusing to overwrite it.`,
      };
    }

    const entries = parsed.filter(isPathEntry);

    return {
      ok: true,
      entries,
      warning:
        entries.length === parsed.length
          ? undefined
          : `Skipped invalid entries from ${pathsJsonPath}.`,
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: true, entries: [] };
    }

    return {
      ok: false,
      error: `Failed to read ${pathsJsonPath}: ${formatError(error)}. Refusing to overwrite it.`,
    };
  }
}

export async function savePathEntries(entries: PathEntry[]): Promise<void> {
  await mkdir(cdfConfigDirectory, { recursive: true });
  const temporaryPath = `${pathsJsonPath}.${process.pid}.${Date.now()}.tmp`;

  await writeFile(temporaryPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  await rename(temporaryPath, pathsJsonPath);
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

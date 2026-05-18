export type PathEntry = {
  name: string;
  path: string;
  isFavorite: boolean;
};

export function isPathEntry(value: unknown): value is PathEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Partial<PathEntry>;

  return (
    typeof entry.name === "string" &&
    entry.name.trim().length > 0 &&
    typeof entry.path === "string" &&
    entry.path.trim().length > 0 &&
    typeof entry.isFavorite === "boolean"
  );
}

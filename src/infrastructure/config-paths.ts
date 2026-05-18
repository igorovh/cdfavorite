import { homedir } from "node:os";
import { join } from "node:path";

export const cdfConfigDirectory = join(homedir(), ".config", "cdf");
export const pathsJsonPath = join(cdfConfigDirectory, "paths.json");

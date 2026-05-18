import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { buildExecutable, buildTargets } from "./build-shared";

const distDirectory = join(import.meta.dir, "..", "dist");

await mkdir(distDirectory, { recursive: true });

for (const target of buildTargets) {
  await buildExecutable(target);
  console.log(`Built ${target.outfile}`);
}

import { writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const shebang = "#!/usr/bin/env bun\n";

const targets = [
  { name: "cdf-run", entrypoint: "src/index.tsx" },
  { name: "cdf-setup", entrypoint: "src/setup.tsx" },
] as const;

const outdir = join(import.meta.dir, "..", "npm-dist");

await mkdir(outdir, { recursive: true });

for (const target of targets) {
  const result = await Bun.build({
    entrypoints: [target.entrypoint],
    target: "bun",
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DEV": '"false"',
    },
    minify: true,
    outdir,
    naming: `[dir]/${target.name}.[ext]`,
    banner: shebang,
    throw: false,
  });

  if (!result.success) {
    console.error(`Failed to build ${target.name}:`);

    for (const log of result.logs) {
      console.error(log.message);
    }

    process.exit(1);
  }

  const output = result.outputs[0];
  if (!output) {
    console.error(`No output for ${target.name}`);
    process.exit(1);
  }

  const text = await output.text();

  // Strip the duplicated shebang Bun adds after its // @bun marker
  const cleaned = text.replace(
    /^#!\/usr\/bin\/env bun\n\/\/ @bun\n#!\/usr\/bin\/env bun\n/,
    "#!/usr/bin/env bun\n",
  );

  const outPath = join(outdir, `${target.name}.js`);
  await writeFile(outPath, cleaned);

  console.log(`Built ${target.name} to npm-dist/${target.name}.js`);
}

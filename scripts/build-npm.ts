import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const shebang = "#!/usr/bin/env node\n";

const targets = [
  { name: "cdf", entrypoint: "src/cdf.ts" },
  { name: "cdf-run", entrypoint: "src/index.tsx" },
  { name: "cdf-setup", entrypoint: "src/setup.tsx" },
] as const;

const outdir = join(import.meta.dir, "..", "npm-dist");

await mkdir(outdir, { recursive: true });

for (const target of targets) {
  const result = await Bun.build({
    entrypoints: [target.entrypoint],
    target: "node",
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

  // Strip a duplicated shebang if the bundler preserves an entrypoint shebang.
  const cleaned = text.replace(
    /^#!\/usr\/bin\/env node\n#!\/usr\/bin\/env (?:node|bun)\n/,
    "#!/usr/bin/env node\n",
  );

  const outPath = join(outdir, `${target.name}.js`);
  await writeFile(outPath, cleaned);
  await chmod(outPath, 0o755);

  console.log(`Built ${target.name} to npm-dist/${target.name}.js`);
}

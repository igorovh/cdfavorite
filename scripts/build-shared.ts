export type BuildTarget = {
  name: string;
  entrypoint: string;
  outfile: string;
};

export const executableExtension = process.platform === "win32" ? ".exe" : "";

export const buildTargets: BuildTarget[] = [
  createBuildTarget("cdf-run", "src/index.tsx"),
  createBuildTarget("cdf-setup", "src/setup.tsx"),
];

export async function buildExecutable(target: BuildTarget): Promise<void> {
  const result = await Bun.build({
    entrypoints: [target.entrypoint],
    target: "bun",
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DEV": '"false"',
    },
    minify: true,
    compile: {
      outfile: target.outfile,
    },
    throw: false,
  });

  if (!result.success) {
    console.error(`Failed to build ${target.name}:`);

    for (const log of result.logs) {
      console.error(log.message);
    }

    process.exit(1);
  }
}

function createBuildTarget(name: string, entrypoint: string): BuildTarget {
  return {
    name,
    entrypoint,
    outfile: `dist/${name}${executableExtension}`,
  };
}

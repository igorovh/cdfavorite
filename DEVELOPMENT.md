# Development

## Local Setup

```bash
bun install
```

Run the app locally:

```bash
bun run cdf-run
```

Run setup locally:

```bash
bun run cdf-setup
```

Typecheck:

```bash
bun run typecheck
```

Lint & format (check only):

```bash
bun run biome:check
```

Lint & format (auto-fix):

```bash
bun run biome:fix
```

## Build

Build the npm distribution:

```bash
bun run build
```

Output:

```text
npm-dist/cdf.js        # setup guidance entrypoint
npm-dist/cdf-run.js    # interactive app entrypoint
npm-dist/cdf-setup.js  # shell setup entrypoint
```

These are compiled JS files with a `#!/usr/bin/env node` shebang. The published package runs on Node.js 22+; Bun is used for development and building.

## Startup Profiling

Profile startup without selecting a path:

```bash
cdf-run --profile-startup --profile-exit
```

Profile a real interactive selection:

```bash
cdf-run --profile-startup
```

Profiler output is written to `stderr`, so selected path output on `stdout` remains safe for shell wrappers.

## npm Package

Dry-run package contents:

```bash
npm pack --dry-run
```

Publishing is automated via `.github/workflows/ci-publish.yml` using npm trusted publishing (OIDC). Push a `v*` tag to trigger it:

```bash
npm version patch
git push --follow-tags
```

The package is installed with:

```bash
npm i -g cdfavorite
# or
bun i -g cdfavorite
cdf-setup
```

Global installation adds `cdf`, `cdf-run`, and `cdf-setup` commands. `cdf-setup` remains a required explicit step because installing a package should not silently edit a user's shell configuration.

## Project Structure

```text
src/domain              Core path entry/search logic
src/infrastructure      Storage, config paths, shell setup, PATH lookup
src/ui                  Ink UI components
src/cdf.ts              cdf setup guidance entrypoint
src/index.tsx           cdf-run entrypoint
src/setup.tsx           cdf-setup entrypoint
scripts/build-npm.ts    NPM distribution build
```

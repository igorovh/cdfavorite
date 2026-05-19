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
npm-dist/index.js      # cdf-run entrypoint
npm-dist/setup.js      # cdf-setup entrypoint
```

These are compiled JS files with a `#!/usr/bin/env bun` shebang, so both `npm i -g cdfavorite` and `bun i -g cdfavorite` work.

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
bun i -g cdfavorite
# or
npm i -g cdfavorite
cdf-setup
```

`bun i -g cdfavorite` installs the `cdf-run` and `cdf-setup` commands. `cdf-setup` remains a required explicit step because installing a package should not silently edit a user's shell configuration.

## Project Structure

```text
src/domain              Core path entry/search logic
src/infrastructure      Storage, config paths, shell setup, PATH lookup
src/ui                  Ink UI components
src/index.tsx           cdf-run entrypoint
src/setup.tsx           cdf-setup entrypoint
scripts/build-npm.ts    NPM distribution build
scripts/postinstall.js  Post-install message
```

#!/usr/bin/env node

const message = `cdf is a shell function, not a standalone executable.

Run this once after installing cdfavorite:

  cdf-setup

Then restart your terminal or reload your shell profile, and run:

  cdf

Why this setup step exists: child processes cannot change the current directory of your existing shell, so cdf-setup installs a small shell wrapper that calls cdf-run and then changes directory in the shell itself.`;

console.error(message);
process.exitCode = 1;

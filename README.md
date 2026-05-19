# cdfavorite

Change Directory Favorites (`cdf`) is an interactive CLI for jumping to saved directories.
  
<img width="1100" height="578" alt="98kGDh" src="https://github.com/user-attachments/assets/b5eeb8e4-8b26-48a6-9c25-83036d61e4c6" />

## Install

```bash
npm i -g cdfavorite
# or
bun i -g cdfavorite

cdf-setup
```

The published CLI runs on Node.js 22+. `cdf-setup` installs a shell wrapper named `cdf` for Bash, Zsh, Nushell, or PowerShell. After setup, restart your terminal or reload your shell configuration.

Then run:

```bash
cdf
```

The extra setup step is required because standalone child processes cannot change the current directory of your existing shell.

## Development

Development, build, profiling, and publishing notes are in [DEVELOPMENT.md](./DEVELOPMENT.md).

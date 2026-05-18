# cdf-cli

Change Directory Favorites (`cdf`) is an interactive Bun CLI for jumping to saved directories.

<!-- GIF preview goes here. -->

## Install

```bash
bun i -g cdf-cli
cdf-setup
```

`cdf-setup` installs a shell wrapper named `cdf`. After setup, restart your terminal or reload your shell configuration.

Then run:

```bash
cdf
```

## Why Setup Is Needed

A CLI process cannot change the current directory of its parent shell. `cdf-run` prints the selected path, and the `cdf` shell wrapper runs `cd` with that path in your current shell.

`cdf-setup` is interactive. It only shows shell configuration files that already exist and asks where to install or update the wrapper.

Supported shells:

```text
Bash
Zsh
Nushell
```

## Usage

```bash
cdf
```

If this is your first run and no paths are saved yet, `cdf` opens directly in add-current-directory mode.

Controls:

```text
Type             Search saved directories
Up/Down          Move selection
Enter            Select a directory
Ctrl+E           Edit selected entry
Esc              Exit
```

Favorite field controls:

```text
y / n            Set favorite status
Left / Right     Toggle favorite status
a / d            Toggle favorite status
Space            Toggle favorite status
```

## Data File

Saved paths are stored at:

```text
~/.config/cdf/paths.json
```

Format:

```json
[
  {
    "name": "project",
    "path": "/home/user/project",
    "isFavorite": true
  }
]
```

## Commands

```bash
cdf           # shell wrapper installed by cdf-setup
cdf-setup     # installs or updates the shell wrapper
cdf-run       # underlying interactive app
```

## Troubleshooting

If `cdf` is not found after setup, restart your terminal or reload your shell configuration.

If `cdf-run` or `cdf-setup` is not found after installation, check that Bun's global bin directory is on your `PATH`.

If colors do not display correctly:

```bash
cdf-run --force-color
```

To disable colors:

```bash
cdf-run --no-color
```

## Development

Development, build, profiling, and publishing notes are in [DEVELOPMENT.md](./DEVELOPMENT.md).

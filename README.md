# lazy-picker

lazy-picker lets you register multiple commands and launch one interactively from the terminal.

## Installation

```bash
pnpm install
pnpm run build
```

## Configuration

Create `~/.config/lazy-picker/settings.json`:

```json
{
  "options": [
    { "name": "claude code", "command": "claude" },
    { "name": "codex", "command": "codex" },
    { "name": "gemini", "command": "gemini" }
  ]
}
```

## Usage

```bash
pick
```

- A list of `options[].name` entries appears (powered by `cac`).
- Select exactly one entry; lazy-picker runs the associated `command`.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm run build` | Bundle with unbuild |
| `pnpm run typecheck` | TypeScript type checking |
| `pnpm run lint` | Biome lint |
| `pnpm run format` | Biome format (writes fixes) |
| `pnpm run check` | Biome check (format + lint) |
| `pnpm test` | Run Biome check and typecheck |

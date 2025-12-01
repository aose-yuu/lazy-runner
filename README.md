# lazy-runner

lazy-runner lets you register multiple commands and launch one interactively from the terminal.

## Installation

```bash
npm install -g lazy-runner
```

## Configuration

Create `~/.config/lazy-runner/settings.json`:

```json
{
  "options": [
    {
      "name": "AI",
      "options": [
        { "name": "claude code", "command": "claude" },
        { "name": "codex", "command": "codex" },
        { "name": "gemini", "command": "gemini" }
      ]
    },
    {
      "name": "upgrade",
      "options": [
        { "name": "claude code", "command": "brew upgrade claude-code" },
        { "name": "codex", "command": "bun install -g @openai/codex@latest" }
      ]
    },
    {
      "name": "config",
      "options": [
        { "name": "lazy-runner", "command": "nvim ~/.config/lazy-runner/settings.json" }
      ]
    }
  ],
  "hideOutputMessages": true
}
```

- Each entry needs a `name` and either a `command` (leaf) or nested `options` (group). Groups must contain at least one runnable command.
- `hideOutputMessages` (optional, default `false`): Set to `true` to suppress the `Running ...` / `Command completed` logs.

## Usage

```bash
lr
```

```bash
❯ Select a command to run
● AI (3 options)
○ upgrade (2 options)
○ config (1 options)

❯ Select a command to run (AI)
● claude code (claude)
○ codex
○ gemini
```

- A consola-powered select prompt lists all `options[].name`.
- Choose an entry; if it is a group, you drill down to its children. Selecting a leaf runs the associated `command`.

## License

MIT

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
    { "name": "claude code", "command": "claude" },
    { "name": "codex", "command": "codex" },
    { "name": "gemini", "command": "gemini" }
  ],
  "hideOutputMessages": true
}
```

- `hideOutputMessages` (optional, default `false`): Set to `true` to suppress the `Running ...` / `Command completed` logs.

## Usage

```bash
lr
```

```bash
❯ Select a command to run
● claude code (claude)
○ codex
○ gemini
```

- A consola-powered select prompt lists all `options[].name`.
- Choose an entry interactively; lazy-runner runs the associated `command`.

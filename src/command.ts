import { spawn } from 'node:child_process';
import { assertCommandSucceeded } from './errors.js';
import type { RunnerOption } from './settings.js';

export type CommandResult = {
  code: number;
  signal: NodeJS.Signals | null;
};

async function spawnCommandProcess(command: string): Promise<CommandResult> {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
    });

    child.on('error', (error) => reject(error));
    child.on('exit', (code, signal) => {
      resolve({ code: code ?? 0, signal });
    });
  });
}

export type CommandHooks = {
  onBeforeStart?: (option: RunnerOption) => void;
  onAfterSuccess?: (option: RunnerOption) => void;
};

export async function runCommand(option: RunnerOption, hooks: CommandHooks): Promise<void> {
  hooks.onBeforeStart?.(option);

  const result = await spawnCommandProcess(option.command);
  assertCommandSucceeded(result, option.name);

  hooks.onAfterSuccess?.(option);
}

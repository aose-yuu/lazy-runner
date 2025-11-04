import { consola } from 'consola';
import { SelectionError } from './errors.js';
import type { RunnerOption } from './settings.js';

export async function prompt(options: RunnerOption[]): Promise<RunnerOption> {
  const optionMap = new Map(options.map((option) => [option.name, option]));

  const answer = await consola.prompt('Select a command to run', {
    type: 'select',
    cancel: 'reject',
    options: options.map((option) => ({
      label: option.name,
      value: option.name,
      hint: option.command,
    })),
  });
  const selected = optionMap.get(answer);
  if (!selected) {
    throw new SelectionError('Invalid selection.');
  }
  return selected;
}

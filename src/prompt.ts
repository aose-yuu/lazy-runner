import { consola } from 'consola';
import { SelectionError } from './errors.js';
import type { RunnerCommandOption, RunnerOption } from './settings.js';
import { isCommandOption } from './settings.js';

export async function prompt(
  options: RunnerOption[],
  path: string[] = [],
): Promise<RunnerCommandOption> {
  const promptMessage = formatPromptMessage(path);
  const answer = (await consola.prompt(promptMessage, {
    type: 'select',
    cancel: 'reject',
    options: buildPromptOptions(options),
  })) as string;

  const selectedIndex = Number.parseInt(answer, 10);
  const selected = Number.isInteger(selectedIndex) ? options[selectedIndex] : undefined;
  if (!selected) {
    throw new SelectionError('Invalid selection.');
  }

  if (isCommandOption(selected)) {
    return selected;
  }

  return prompt(selected.options, [...path, selected.name]);
}

function buildPromptOptions(options: RunnerOption[]) {
  return options.map((option, index) => ({
    label: option.name,
    value: String(index),
    hint: isCommandOption(option) ? option.command : `${option.options.length} options`,
  }));
}

function formatPromptMessage(path: string[]): string {
  if (path.length === 0) {
    return 'Select a command to run';
  }
  return `Select a command to run (${path.join(' > ')})`;
}

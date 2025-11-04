#!/usr/bin/env node
import { cac } from 'cac';
import { consola } from 'consola';
import { type CommandHooks, runCommand } from './command.js';
import { handleFailure } from './errors.js';
import { prompt } from './prompt.js';
import { readPackageJSON, readSettings } from './settings.js';

void main().catch(handleFailure);

async function main(): Promise<void> {
  const { name, version } = await readPackageJSON();
  const cli = cac(name);
  cli.command('[...args]', 'Select and run one of the configured commands').action(execute);
  cli.help();
  cli.version(version);
  cli.parse();
}

async function execute(): Promise<void> {
  const settings = await readSettings();
  const selected = await prompt(settings.options);

  const hooks: CommandHooks = settings.hideOutputMessages
    ? {}
    : {
        onBeforeStart: (option) => {
          consola.start(`Running "${option.name}" (${option.command})...`);
        },
        onAfterSuccess: () => {
          consola.success('Command completed.');
        },
      };

  await runCommand(selected, hooks);
}

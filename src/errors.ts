import { constants } from 'node:os';
import { consola } from 'consola';
import type { CommandResult } from './command.js';

export function assertCommandSucceeded(result: CommandResult, label: string): void {
  if (result.signal) {
    throw new CommandSignalError(label, result.signal);
  }

  if (result.code !== 0) {
    throw new CommandExitError(label, result.code);
  }
}

export function handleFailure(error: unknown): never {
  if (error instanceof CliError) {
    consola.error(error.message);
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    consola.error(error.message);
  } else {
    consola.error(String(error));
  }
  process.exit(1);
}

abstract class CliError extends Error {
  constructor(
    message: string,
    public exitCode: number,
  ) {
    super(message);
  }
}

export class ConfigError extends CliError {
  constructor(message: string) {
    super(message, 1);
  }
}

export class SelectionError extends CliError {
  constructor(message: string) {
    super(message, 1);
  }
}

export class CommandExitError extends CliError {
  constructor(
    public label: string,
    exitCode: number,
  ) {
    super(`${label} failed with exit code ${exitCode}.`, exitCode);
  }
}

export class CommandSignalError extends CliError {
  constructor(
    public label: string,
    public signal: NodeJS.Signals,
  ) {
    super(`${label} was terminated by signal ${signal}.`, getSignalExitCode(signal));
  }
}

function getSignalExitCode(signal: NodeJS.Signals): number {
  const signalNumber = constants.signals?.[signal];
  if (typeof signalNumber === 'number') {
    return 128 + signalNumber;
  }
  return 1;
}

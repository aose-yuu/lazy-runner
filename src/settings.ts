import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackageJSON as _readPackageJSON } from 'pkg-types';
import { ConfigError } from './errors.js';

const DEFAULT_CONFIG_PATH = join(homedir(), '.config', 'lazy-runner', 'settings.json');
const PACKAGE_DIR = fileURLToPath(new URL('..', import.meta.url));

export async function readPackageJSON() {
  const pkg = await _readPackageJSON(PACKAGE_DIR);
  // biome-ignore lint/style/noNonNullAssertion: name is guaranteed in package.json
  const name = pkg.name!;
  // biome-ignore lint/style/noNonNullAssertion: version is guaranteed in package.json
  const version = pkg.version!;

  return { name, version };
}

export type RunnerCommandOption = {
  name: string;
  command: string;
};

export type RunnerGroupOption = {
  name: string;
  options: RunnerOption[];
};

export type RunnerOption = RunnerCommandOption | RunnerGroupOption;

type SettingsFile = {
  options?: unknown;
  hideOutputMessages?: boolean;
};

type RunnerSettings = {
  options: RunnerOption[];
  hideOutputMessages: boolean;
};

type ReadSettingsOptions = {
  path?: string;
  reader?: typeof readFile;
};

export function parseSettings(raw: string): RunnerSettings {
  let parsed: SettingsFile;
  try {
    parsed = JSON.parse(raw) as SettingsFile;
  } catch {
    throw new ConfigError('Failed to parse settings.json. Ensure it is valid JSON.');
  }

  if (!Array.isArray(parsed.options)) {
    throw new ConfigError('settings.json must contain an "options" array.');
  }

  const normalized = parsed.options
    .map(normalizeOption)
    .filter((result): result is NormalizedOptionResult => result !== null);

  const options = normalized.map((entry) => entry.option);
  const commandCount = normalized.reduce((sum, entry) => sum + entry.commandCount, 0);

  if (options.length === 0 || commandCount === 0) {
    throw new ConfigError(
      'No valid commands found. Each option needs a name and either a command or nested options containing commands.',
    );
  }

  return {
    options,
    hideOutputMessages: parsed.hideOutputMessages ?? false,
  };
}

export async function readSettings(options: ReadSettingsOptions = {}): Promise<RunnerSettings> {
  const filePath = options.path ?? DEFAULT_CONFIG_PATH;
  const read = options.reader ?? readFile;

  let raw: string;
  try {
    raw = await read(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConfigError(`Configuration file not found at ${filePath}. Please create it first.`);
    }
    throw error;
  }

  return parseSettings(raw);
}

type NormalizedOptionResult = {
  option: RunnerOption;
  commandCount: number;
};

function normalizeOption(option: unknown): NormalizedOptionResult | null {
  if (!isNonNullObject(option)) {
    return null;
  }

  const rawName = option.name;
  const rawCommand = option.command;
  const rawOptions = option.options;

  if (typeof rawName !== 'string') {
    return null;
  }

  const name = rawName.trim();
  const hasCommand = typeof rawCommand === 'string' && rawCommand.trim().length > 0;
  const hasOptions = Array.isArray(rawOptions);

  if (name.length === 0 || (hasCommand && hasOptions)) {
    return null;
  }

  if (hasCommand) {
    return {
      option: { name, command: rawCommand.trim() },
      commandCount: 1,
    };
  }

  if (!hasOptions) {
    return null;
  }

  const normalizedChildren = rawOptions
    .map(normalizeOption)
    .filter((child): child is NormalizedOptionResult => child !== null);

  const commandCount = normalizedChildren.reduce((sum, child) => sum + child.commandCount, 0);

  if (normalizedChildren.length === 0 || commandCount === 0) {
    return null;
  }

  return {
    option: {
      name,
      options: normalizedChildren.map((child) => child.option),
    },
    commandCount,
  };
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isCommandOption(option: RunnerOption): option is RunnerCommandOption {
  return 'command' in option;
}

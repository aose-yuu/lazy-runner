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

export type RunnerOption = {
  name: string;
  command: string;
};

type SettingsFile = {
  options?: RunnerOption[];
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
    .filter(
      (option): option is RunnerOption =>
        typeof option?.name === 'string' &&
        option.name.trim().length > 0 &&
        typeof option.command === 'string' &&
        option.command.trim().length > 0,
    )
    .map((option) => ({
      name: option.name.trim(),
      command: option.command.trim(),
    }));

  if (normalized.length === 0) {
    throw new ConfigError('No valid options found. Provide name and command strings.');
  }

  return {
    options: normalized,
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

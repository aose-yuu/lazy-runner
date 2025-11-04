import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ConfigError } from '../errors.js';
import { parseSettings, readSettings } from '../settings.js';

describe('parseSettings', () => {
  it('returns normalized options and defaults hideOutputMessages to false', () => {
    const raw = JSON.stringify({
      options: [
        { name: '  alpha ', command: ' foo ' },
        { name: 'beta', command: 'bar' },
      ],
    });

    const result = parseSettings(raw);

    expect(result.hideOutputMessages).toBe(false);
    expect(result.options).toEqual([
      { name: 'alpha', command: 'foo' },
      { name: 'beta', command: 'bar' },
    ]);
  });

  it('honors hideOutputMessages override', () => {
    const raw = JSON.stringify({
      options: [{ name: 'alpha', command: 'foo' }],
      hideOutputMessages: true,
    });

    const result = parseSettings(raw);

    expect(result.hideOutputMessages).toBe(true);
  });

  it('fails when options array is missing', () => {
    const raw = JSON.stringify({});
    expect(() => parseSettings(raw)).toThrowError(ConfigError);
  });

  it('fails when no valid option entries remain after filtering', () => {
    const raw = JSON.stringify({
      options: [{ name: '', command: 'foo' }],
    });

    expect(() => parseSettings(raw)).toThrowError(ConfigError);
  });

  it('drops invalid entries while preserving valid ones', () => {
    const raw = JSON.stringify({
      options: [
        { name: '', command: 'foo' },
        { name: ' gamma ', command: '  uptick ' },
      ],
      hideOutputMessages: false,
    });

    const result = parseSettings(raw);

    expect(result.options).toEqual([{ name: 'gamma', command: 'uptick' }]);
    expect(result.hideOutputMessages).toBe(false);
  });

  it('fails when JSON cannot be parsed', () => {
    expect(() => parseSettings('{ invalid json')).toThrowError(ConfigError);
  });
});

describe('readSettings', () => {
  async function createTempConfig(data: unknown) {
    const dir = await mkdtemp(join(tmpdir(), 'lazy-runner-test-'));
    const filePath = join(dir, 'settings.json');
    await writeFile(filePath, JSON.stringify(data));
    return {
      dir,
      filePath,
    };
  }

  it('loads and parses the config from disk', async () => {
    const temp = await createTempConfig({
      options: [{ name: 'cli', command: 'echo hi' }],
      hideOutputMessages: true,
    });

    try {
      await expect(readSettings({ path: temp.filePath })).resolves.toEqual({
        hideOutputMessages: true,
        options: [{ name: 'cli', command: 'echo hi' }],
      });
    } finally {
      await rm(temp.dir, { recursive: true, force: true });
    }
  });

  it('throws ConfigError when the file does not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lazy-runner-test-'));
    const missingPath = join(dir, 'missing.json');

    try {
      await expect(readSettings({ path: missingPath })).rejects.toBeInstanceOf(ConfigError);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('supports a custom reader implementation', async () => {
    const reader = vi.fn().mockResolvedValue(
      JSON.stringify({
        options: [{ name: 'custom', command: 'doit' }],
        hideOutputMessages: true,
      }),
    );

    await expect(readSettings({ path: 'virtual', reader })).resolves.toEqual({
      hideOutputMessages: true,
      options: [{ name: 'custom', command: 'doit' }],
    });
    expect(reader).toHaveBeenCalledWith('virtual', 'utf8');
  });

  it('rethrows unexpected read errors', async () => {
    const readerError = Object.assign(new Error('boom'), { code: 'EACCES' });
    const reader = vi.fn().mockRejectedValue(readerError);

    await expect(readSettings({ path: 'virtual', reader })).rejects.toBe(readerError);
  });
});

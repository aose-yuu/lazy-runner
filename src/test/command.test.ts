import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCommand } from '../command.js';
import { CommandExitError } from '../errors.js';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

function mockSpawnResult(code: number, signal: NodeJS.Signals | null = null) {
  spawnMock.mockImplementation(() => {
    const emitter = new EventEmitter();
    setImmediate(() => {
      emitter.emit('exit', code, signal);
    });
    return emitter;
  });
}

describe('runCommand', () => {
  afterEach(() => {
    spawnMock.mockReset();
  });

  it('invokes hooks around a successful command', async () => {
    mockSpawnResult(0, null);
    const before = vi.fn();
    const after = vi.fn();
    const option = { name: 'alpha', command: 'echo hi' };

    await runCommand(option, { onBeforeStart: before, onAfterSuccess: after });

    expect(before).toHaveBeenCalledWith(option);
    expect(after).toHaveBeenCalledWith(option);
    expect(before.mock.invocationCallOrder[0]).toBeLessThan(after.mock.invocationCallOrder[0]);
    expect(spawnMock).toHaveBeenCalledWith('echo hi', { shell: true, stdio: 'inherit' });
  });

  it('throws when the spawned command exits with a non-zero code', async () => {
    mockSpawnResult(2, null);
    const after = vi.fn();
    const option = { name: 'beta', command: 'exit 2' };

    await expect(runCommand(option, { onAfterSuccess: after })).rejects.toBeInstanceOf(
      CommandExitError,
    );
    expect(after).not.toHaveBeenCalled();
  });
});

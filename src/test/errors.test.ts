import { describe, expect, it, vi } from 'vitest';
import {
  assertCommandSucceeded,
  CommandExitError,
  CommandSignalError,
  ConfigError,
  handleFailure,
} from '../errors.js';

const consolaError = vi.hoisted(() => vi.fn());

vi.mock('consola', () => ({
  consola: {
    error: consolaError,
    prompt: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

describe('assertCommandSucceeded', () => {
  it('allows successful commands to pass through', () => {
    expect(() => {
      assertCommandSucceeded({ code: 0, signal: null }, 'success');
    }).not.toThrow();
  });

  it('throws CommandExitError with the original exit code', () => {
    const run = () => assertCommandSucceeded({ code: 2, signal: null }, 'failure');
    expect(run).toThrowError(CommandExitError);

    try {
      run();
    } catch (error) {
      expect(error).toBeInstanceOf(CommandExitError);
      if (error instanceof CommandExitError) {
        expect(error.exitCode).toBe(2);
      }
    }
  });

  it('throws CommandSignalError when a signal terminated the command', () => {
    expect(() => assertCommandSucceeded({ code: 0, signal: 'SIGINT' }, 'interrupted')).toThrowError(
      CommandSignalError,
    );
  });
});

describe('handleFailure', () => {
  it('logs CliError message and exits with provided code', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);

    expect(() => handleFailure(new ConfigError('bad config'))).toThrowError('exit:1');
    expect(consolaError).toHaveBeenCalledWith('bad config');

    exitSpy.mockRestore();
    consolaError.mockReset();
  });

  it('handles unknown errors with exit code 1', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);

    expect(() => handleFailure(new Error('boom'))).toThrowError('exit:1');
    expect(consolaError).toHaveBeenCalledWith('boom');

    exitSpy.mockRestore();
    consolaError.mockReset();
  });

  it('string errors are logged verbatim and exit with code 1', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);

    expect(() => handleFailure('text failure')).toThrowError('exit:1');
    expect(consolaError).toHaveBeenCalledWith('text failure');

    exitSpy.mockRestore();
    consolaError.mockReset();
  });
});

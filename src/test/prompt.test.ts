import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectionError } from '../errors.js';
import { prompt } from '../prompt.js';

const promptMock = vi.hoisted(() => vi.fn());

vi.mock('consola', () => ({
  consola: {
    prompt: promptMock,
    error: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

describe('prompt', () => {
  afterEach(() => {
    promptMock.mockReset();
  });

  it('returns the option matching the provided answer', async () => {
    promptMock.mockResolvedValue('1');
    const options = [
      { name: 'alpha', command: 'echo alpha' },
      { name: 'beta', command: 'echo beta' },
    ];

    await expect(prompt(options)).resolves.toEqual({ name: 'beta', command: 'echo beta' });
    expect(promptMock).toHaveBeenCalledWith(
      'Select a command to run',
      expect.objectContaining({
        options: [
          { label: 'alpha', value: '0', hint: 'echo alpha' },
          { label: 'beta', value: '1', hint: 'echo beta' },
        ],
      }),
    );
  });

  it('navigates nested groups and returns a leaf command', async () => {
    promptMock.mockResolvedValueOnce('0');
    promptMock.mockResolvedValueOnce('1');
    const options = [
      {
        name: 'AI',
        options: [
          { name: 'claude code', command: 'claude' },
          { name: 'codex', command: 'codex' },
        ],
      },
    ];

    await expect(prompt(options)).resolves.toEqual({ name: 'codex', command: 'codex' });
    expect(promptMock).toHaveBeenNthCalledWith(
      1,
      'Select a command to run',
      expect.objectContaining({
        options: [{ label: 'AI', value: '0', hint: '2 options' }],
      }),
    );
    expect(promptMock).toHaveBeenNthCalledWith(
      2,
      'Select a command to run (AI)',
      expect.objectContaining({
        options: [
          { label: 'claude code', value: '0', hint: 'claude' },
          { label: 'codex', value: '1', hint: 'codex' },
        ],
      }),
    );
  });

  it('throws SelectionError when the answer does not match an option', async () => {
    promptMock.mockResolvedValue('3');
    const options = [{ name: 'alpha', command: 'echo alpha' }];

    await expect(prompt(options)).rejects.toBeInstanceOf(SelectionError);
  });
});

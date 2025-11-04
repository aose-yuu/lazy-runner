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
    promptMock.mockResolvedValue('alpha');
    const options = [
      { name: 'alpha', command: 'echo alpha' },
      { name: 'beta', command: 'echo beta' },
    ];

    await expect(prompt(options)).resolves.toEqual({ name: 'alpha', command: 'echo alpha' });
    expect(promptMock).toHaveBeenCalledWith(
      'Select a command to run',
      expect.objectContaining({
        options: [
          { label: 'alpha', value: 'alpha', hint: 'echo alpha' },
          { label: 'beta', value: 'beta', hint: 'echo beta' },
        ],
      }),
    );
  });

  it('throws SelectionError when the answer does not match an option', async () => {
    promptMock.mockResolvedValue('gamma');
    const options = [{ name: 'alpha', command: 'echo alpha' }];

    await expect(prompt(options)).rejects.toBeInstanceOf(SelectionError);
  });
});

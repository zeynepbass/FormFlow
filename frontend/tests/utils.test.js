import { describe, expect, it } from 'vitest';
import { formatAnswer } from '@/features/responses/format-answer';
import { safeRedirectPath } from '@/lib/safe-redirect';

describe('safeRedirectPath', () => {
  it('allows same-site paths only', () => {
    expect(safeRedirectPath('/forms/abc?x=1')).toBe('/forms/abc?x=1');
    expect(safeRedirectPath('https://evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('//evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('/\\evil.example')).toBe('/dashboard');
    expect(safeRedirectPath(null)).toBe('/dashboard');
  });
});

describe('formatAnswer', () => {
  it('formats every answer shape', () => {
    expect(formatAnswer(undefined)).toBe('—');
    expect(formatAnswer(['A', 'B'])).toBe('A, B');
    expect(formatAnswer(42)).toBe('42');
    expect(formatAnswer({ fileId: 'x', name: 'cv.pdf', size: 2048 })).toBe('cv.pdf (2.0 KB)');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const store = vi.hoisted(() => ({ arabic: false }));

// The engine's hook: reads the store's "Arabic numbers" setting.
vi.mock('@salla.sa/twilight-theme-engine/hooks', () => ({
  useNumber: () => ({
    useArabicNumerals: store.arabic,
    toArabic: (input: number | string) => String(input).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]),
  }),
}));

const { useStoreDigits } = await import('../../app/hooks/useStoreDigits');
const digits = () => renderHook(() => useStoreDigits()).result.current;

beforeEach(() => {
  store.arabic = false;
});

describe('useStoreDigits', () => {
  it('prints the amount as it is when the store uses Latin digits', () => {
    expect(digits()(1380)).toBe('1380');
    expect(digits()('3.45')).toBe('3.45');
  });

  it('writes Arabic-Indic digits and the Arabic decimal mark when the store asks for them', () => {
    store.arabic = true;
    expect(digits()(1380)).toBe('١٣٨٠');
    expect(digits()(3.45)).toBe('٣٫٤٥');
  });

  it('prints nothing for a missing amount', () => {
    store.arabic = true;
    expect(digits()(null)).toBe('');
    expect(digits()(undefined)).toBe('');
  });
});

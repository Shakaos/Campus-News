import { describe, expect, it } from 'vitest';
import { formatDate, getLocalDateInputValue } from './date';

describe('date helpers', () => {
  it('formats date-only values without shifting the calendar day', () => {
    expect(formatDate('2026-10-22')).toBe('22/10/2026');
  });

  it('uses the local calendar date for date inputs', () => {
    expect(getLocalDateInputValue(new Date(2026, 9, 22, 23, 30))).toBe('2026-10-22');
  });
});

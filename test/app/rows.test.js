import { describe, it, expect } from 'vitest';
import { resolveRows } from '../../app/src/rows.js';

describe('resolveRows', () => {
  it('keeps rows whose id still matches', () => {
    expect(resolveRows([{ id: 'a', _row: 2 }], { 2: 'a' }, 'id')).toEqual({ ok: [{ id: 'a', _row: 2 }], stale: [] });
  });
  it('reports rows that moved (sorted sheet)', () => {
    expect(resolveRows([{ id: 'a', _row: 2 }], { 2: 'b' }, 'id')).toEqual({ ok: [], stale: [{ id: 'a', _row: 2 }] });
  });
  it('remaps stale rows using the fresh id column', () => {
    const fresh = ['x', 'b', 'a']; // row 2 = x, row 3 = b, row 4 = a
    expect(resolveRows([{ id: 'a', _row: 2 }], { 2: 'x' }, 'id', fresh).ok).toEqual([{ id: 'a', _row: 4 }]);
  });
});

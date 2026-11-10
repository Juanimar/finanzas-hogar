import { describe, it, expect } from 'vitest';
import { TABS, rowToObj, objToRow } from '../src/core/schema.js';
import { SEED_CATEGORIAS, SEED_REGLAS, GRUPOS, NO_GASTO } from '../src/core/seed.js';

describe('schema', () => {
  it('round-trips a movimiento', () => {
    const cols = TABS.movimientos.columns;
    const mov = { id: 'abc', fecha: '2026-11-08', monto_orig: 3251, moneda: 'UYU', revisado: true, bloqueado: false };
    const back = rowToObj(cols, objToRow(cols, mov));
    expect(back.id).toBe('abc');
    expect(back.monto_orig).toBe(3251);
    expect(back.revisado).toBe(true);
    expect(back.bloqueado).toBe(false);
    expect(back.nota).toBe('');
  });

  it('serializes booleans as TRUE/FALSE', () => {
    const row = objToRow(['a', 'b'], { a: true, b: false });
    expect(row).toEqual(['TRUE', 'FALSE']);
  });

  it('has no duplicate columns and the 6 tabs', () => {
    expect(Object.keys(TABS).sort()).toEqual(['categorias', 'cotizaciones', 'cuentas', 'log', 'movimientos', 'reglas']);
    for (const t of Object.values(TABS)) expect(new Set(t.columns).size).toBe(t.columns.length);
  });
});

describe('seeds', () => {
  it('has 21 categories in the 4 groups', () => {
    expect(SEED_CATEGORIAS).toHaveLength(21);
    for (const c of SEED_CATEGORIAS) expect(GRUPOS).toContain(c.grupo);
    expect(SEED_CATEGORIAS.filter(c => c.grupo === 'No es gasto').map(c => c.nombre)).toEqual(NO_GASTO);
    expect(SEED_CATEGORIAS.filter(c => c.grupo === 'Ingresos').map(c => c.nombre)).toEqual(['Sueldo', 'Otros ingresos']);
  });

  it('every seed rule points to an existing category', () => {
    const names = new Set(SEED_CATEGORIAS.map(c => c.nombre));
    expect(SEED_REGLAS.length).toBeGreaterThanOrEqual(35);
    for (const r of SEED_REGLAS) expect(names.has(r.categoria), r.patron).toBe(true);
  });
});

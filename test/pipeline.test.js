import { describe, it, expect } from 'vitest';
import fx from './fixtures/itau.json';
import { processMessages, fillMissingRates } from '../src/core/pipeline.js';
import { SEED_REGLAS } from '../src/core/seed.js';

const NOW = '2026-11-09 06:00:00';
function fakeStore(ids = []) {
  const s = {
    ids: new Set(ids), rows: [], logs: [],
    reglas: SEED_REGLAS, cuentas: [{ numero: '1111', tipo: 'tarjeta_propia', titular: 'Compartido' }],
    hasId: id => s.ids.has(id),
    appendMovimientos: movs => { movs.forEach(m => s.ids.add(m.id)); s.rows.push(...movs); },
    log: (nivel, evento, detalle, ref) => s.logs.push({ nivel, evento, detalle, ref }),
  };
  return s;
}
const rate40 = () => 40;

describe('processMessages', () => {
  it('writes a fully built movimiento', () => {
    const st = fakeStore();
    const r = processMessages([fx.creditoUsd], st, rate40, NOW);
    expect(r).toMatchObject({ nuevos: 1, revisar: [] });
    expect(st.rows[0]).toMatchObject({
      id: 'm2', comercio: 'ANTHROPIC CLAUDE SUB', categoria: 'Suscripciones', descripcion: 'Claude',
      quien: 'Compartido', cotizacion: 40, monto_uyu: 800, monto_usd: 20, origen: 'gmail', bloqueado: false, creado: NOW,
    });
  });
  it('is idempotent by message id', () => {
    const st = fakeStore();
    processMessages([fx.debito, fx.pago], st, rate40, NOW);
    const r = processMessages([fx.debito, fx.pago], st, rate40, NOW);
    expect(r.nuevos).toBe(0);
    expect(st.rows).toHaveLength(3);
  });
  it('unreadable body goes to revisar and is logged', () => {
    const st = fakeStore();
    const r = processMessages([{ ...fx.debito, body: 'nuevo formato' }], st, rate40, NOW);
    expect(r.revisar).toEqual(['m3']);
    expect(st.rows).toHaveLength(0);
    expect(st.logs[0]).toMatchObject({ nivel: 'aviso', ref: 'm3' });
  });
  it('non-notice mails are ignored', () => {
    const r = processMessages([{ id: 'z', date: fx.debito.date, subject: 'Promo', body: '' }], fakeStore(), rate40, NOW);
    expect(r).toMatchObject({ nuevos: 0, revisar: [] });
  });
  it('missing rate keeps the row with empty conversion', () => {
    const st = fakeStore();
    processMessages([fx.creditoUsd], st, () => null, NOW);
    expect(st.rows[0]).toMatchObject({ cotizacion: '', monto_usd: 20, monto_uyu: '' });
  });
  it('a throwing rate provider does not lose the movement', () => {
    const st = fakeStore();
    const r = processMessages([fx.debito], st, () => { throw new Error('BCU caído'); }, NOW);
    expect(r.nuevos).toBe(1);
    expect(st.rows[0].cotizacion).toBe('');
  });
});

describe('fillMissingRates', () => {
  it('completes conversions later', () => {
    const changed = fillMissingRates([{ id: 'a', fecha: '2026-11-01', monto_orig: 20, moneda: 'USD', cotizacion: '' }, { id: 'b', cotizacion: 39 }], () => 40);
    expect(changed).toEqual([expect.objectContaining({ id: 'a', cotizacion: 40, monto_uyu: 800 })]);
  });
});

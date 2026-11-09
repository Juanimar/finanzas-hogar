import { describe, it, expect } from 'vitest';
import { isGasto, monthSummary, cumulativeByDay, merchantTotals, catIndex } from '../src/core/aggregate.js';
import { SEED_CATEGORIAS } from '../src/core/seed.js';

const m = (fecha, categoria, uyu, usd, extra = {}) => ({ fecha, categoria, monto_uyu: uyu, monto_usd: usd, tipo: 'consumo_credito', clasificado_por: 'regla_exacta', revisado: true, ...extra });
const movs = [
  m('2026-11-01', 'Supermercado', 1000, 25, { descripcion: 'Devoto' }),
  m('2026-11-03', 'Supermercado', 500, 12.5, { descripcion: 'Devoto' }),
  m('2026-11-03', 'Suscripciones', 800, 20, { clasificado_por: 'manual', descripcion: 'Claude' }),
  m('2026-11-05', 'Otros', 100, 2.5, { clasificado_por: 'pendiente', revisado: false }),
  m('2026-11-05', 'Movimiento interno', 39285, 980, { tipo: 'pago_tarjeta' }),
  m('2026-11-06', 'Ahorro/Inversión', 140000, 3500, { tipo: 'transferencia', clasificado_por: 'cuenta' }),
  m('2026-10-20', 'Supermercado', 300, 7.5, { descripcion: 'Devoto' }),
];
const cats = SEED_CATEGORIAS;

describe('isGasto', () => {
  const ix = catIndex(cats);
  it('excludes card payments and non-spending categories', () => {
    expect(isGasto(movs[0], ix)).toBe(true);
    expect(isGasto(movs[4], ix)).toBe(false);
    expect(isGasto(movs[5], ix)).toBe(false);
  });
});

describe('monthSummary', () => {
  it('totals in UYU and USD', () => {
    const s = monthSummary(movs, cats, '2026-11', 'UYU');
    expect(s.total).toBe(2400);
    expect(s.porGrupo).toEqual({ Fijos: 800, Variables: 1600 });
    expect(s.porCategoria[0]).toEqual({ categoria: 'Supermercado', grupo: 'Variables', total: 1500 });
    expect(s.ahorro).toBe(140000);
    expect(s.pendientes).toBe(1);
    expect(monthSummary(movs, cats, '2026-11', 'USD').total).toBe(60);
  });
  it('learning metric sums to 100', () => {
    const { metric } = monthSummary(movs, cats, '2026-11', 'UYU');
    expect(metric.reglas + metric.manual + metric.pendiente).toBe(100);
    expect(metric.manual).toBeGreaterThan(0);
  });
  it('empty month', () => {
    expect(monthSummary([], cats, '2026-12', 'UYU')).toMatchObject({ total: 0, metric: { reglas: 0, manual: 0, pendiente: 0 } });
  });
});

describe('cumulativeByDay', () => {
  it('is monotonic and month-long', () => {
    const c = cumulativeByDay(movs, cats, '2026-11', 'UYU');
    expect(c).toHaveLength(30);
    expect(c[0]).toBe(1000);
    expect(c[2]).toBe(2300);
    expect(c[29]).toBe(2400);
  });
});

describe('merchantTotals', () => {
  it('month and year per merchant', () => {
    expect(merchantTotals(movs, cats, 'Supermercado', '2026-11', 'UYU')).toEqual([{ comercio: 'Devoto', mes: 1500, anio: 1800 }]);
  });
});

import { describe, it, expect } from 'vitest';
import { isGasto, monthSummary, cumulativeByDay, merchantTotals, catIndex, yearSummary } from '../src/core/aggregate.js';
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

describe('unreadMailCount', () => {
  it('counts distinct unread mails in the last 7 days', async () => {
    const { unreadMailCount } = await import('../src/core/aggregate.js');
    const logs = [
      { fecha_hora: '2026-11-08 06:00:00', evento: 'mail_no_leido', ref: 'a' },
      { fecha_hora: '2026-11-09 06:00:00', evento: 'mail_no_leido', ref: 'a' },
      { fecha_hora: '2026-11-09 06:00:00', evento: 'mail_no_leido', ref: 'b' },
      { fecha_hora: '2026-10-20 06:00:00', evento: 'mail_no_leido', ref: 'old' },
      { fecha_hora: '2026-11-09 06:00:00', evento: 'ejecucion', ref: '' },
    ];
    expect(unreadMailCount(logs, '2026-11-09')).toBe(2);
  });
});

describe('ingresos y tasa de ahorro', () => {
  it('los ingresos no son gasto y la tasa de ahorro se calcula', async () => {
    const { monthSummary } = await import('../src/core/aggregate.js');
    const { SEED_CATEGORIAS } = await import('../src/core/seed.js');
    const base = { tipo: 'manual', clasificado_por: 'manual', revisado: true };
    const movs = [
      { ...base, fecha: '2026-11-01', categoria: 'Sueldo', monto_uyu: 200000, monto_usd: 5000 },
      { ...base, fecha: '2026-11-02', categoria: 'Supermercado', monto_uyu: 50000, monto_usd: 1250 },
      { ...base, fecha: '2026-11-03', categoria: 'Ahorro/Inversión', monto_uyu: 60000, monto_usd: 1500, tipo: 'transferencia' },
    ];
    const s = monthSummary(movs, SEED_CATEGORIAS, '2026-11', 'UYU');
    expect(s.total).toBe(50000);
    expect(s.ingresos).toBe(200000);
    expect(s.tasaAhorro).toBe(30);
  });
  it('sin ingresos la tasa es null', async () => {
    const { monthSummary } = await import('../src/core/aggregate.js');
    expect(monthSummary([], [], '2026-11', 'UYU').tasaAhorro).toBeNull();
  });
});

describe('yearSummary', () => {
  it('12 meses con fijos, variables, ahorro e ingresos', async () => {
    const { yearSummary } = await import('../src/core/aggregate.js');
    const { SEED_CATEGORIAS } = await import('../src/core/seed.js');
    const b = { tipo: 'consumo_credito', clasificado_por: 'regla_exacta', revisado: true };
    const movs = [
      { ...b, fecha: '2026-01-10', categoria: 'Supermercado', monto_uyu: 100, monto_usd: 2.5 },
      { ...b, fecha: '2026-01-11', categoria: 'Suscripciones', monto_uyu: 50, monto_usd: 1.25 },
      { ...b, fecha: '2026-03-05', categoria: 'Supermercado', monto_uyu: 300, monto_usd: 7.5 },
      { ...b, fecha: '2026-03-06', categoria: 'Ahorro/Inversión', monto_uyu: 1000, monto_usd: 25, tipo: 'transferencia' },
      { ...b, fecha: '2026-03-07', categoria: 'Sueldo', monto_uyu: 5000, monto_usd: 125, tipo: 'manual' },
      { ...b, fecha: '2025-12-31', categoria: 'Supermercado', monto_uyu: 999, monto_usd: 25 },
    ];
    const y = yearSummary(movs, SEED_CATEGORIAS, '2026', 'UYU');
    expect(y.meses).toHaveLength(12);
    expect(y.meses[0]).toMatchObject({ mes: '2026-01', fijos: 50, variables: 100, total: 150, ahorro: 0, ingresos: 0 });
    expect(y.meses[2]).toMatchObject({ total: 300, ahorro: 1000, ingresos: 5000 });
    expect(y.meses[1].total).toBe(0);
    expect(y.total).toBe(450);
    expect(y.promedio).toBe(225); // promedio de los meses con gastos
    expect(y.porGrupo).toEqual({ Fijos: 50, Variables: 400 });
    expect(y.porCategoria[0]).toMatchObject({ categoria: 'Supermercado', total: 400 });
    expect(y.ingresos).toBe(5000);
    expect(y.tasaAhorro).toBe(20);
    expect(y.meses[2].porCategoria).toEqual([expect.objectContaining({ categoria: 'Supermercado', total: 300 })]);
  });
});

describe('gastos divididos', () => {
  const cats = [{ nombre: 'Supermercado', grupo: 'Variables' }];
  const movs = [
    { id: 'a', fecha: '2026-11-03', tipo: 'credito', categoria: 'Supermercado', monto_uyu: 4000, monto_usd: 100, parte: 0.1, descripcion: 'Super' },
    { id: 'b', fecha: '2026-11-04', tipo: 'credito', categoria: 'Supermercado', monto_uyu: 600, monto_usd: 15, descripcion: 'Super' },
  ];
  it('todos los totales usan solo la parte propia', () => {
    const s = monthSummary(movs, cats, '2026-11', 'UYU');
    expect(s.total).toBe(1000);
    expect(s.porCategoria[0].total).toBe(1000);
    expect(cumulativeByDay(movs, cats, '2026-11', 'UYU')[3]).toBe(1000);
    expect(merchantTotals(movs, cats, 'Supermercado', '2026-11', 'UYU')[0].mes).toBe(1000);
    expect(yearSummary(movs, cats, '2026', 'USD').total).toBe(25);
  });
});

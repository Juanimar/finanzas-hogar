import { describe, it, expect } from 'vitest';
import fx from './fixtures/itau.json';
import { parseItauEmail, parseAmount } from '../src/core/parsers.js';
import { toMontevideoDate } from '../src/core/dates.js';

const one = m => { const r = parseItauEmail(m); expect(r.ok).toBe(true); return r.movs; };

describe('parseAmount', () => {
  it('handles thousands commas and one decimal', () => {
    expect(parseAmount('39,285.84')).toBe(39285.84);
    expect(parseAmount('3251.0')).toBe(3251);
    expect(parseAmount('140000.00')).toBe(140000);
  });
});

describe('toMontevideoDate', () => {
  it('shifts UTC−3', () => {
    expect(toMontevideoDate('2026-11-07T01:30:00Z')).toBe('2026-11-06');
    expect(toMontevideoDate('2026-11-07T12:00:00Z')).toBe('2026-11-07');
  });
});

describe('parseItauEmail', () => {
  it('crédito UYU', () => {
    expect(one(fx.creditoUyu)).toEqual([{
      id: 'm1', fecha: '2026-11-08', tipo: 'consumo_credito', medio: 'Visa 1111',
      comercio_raw: 'MERPAGO*MACROMERCADO MONTE', cuenta_destino: '', banco_destino: '',
      monto_orig: 3251, moneda: 'UYU',
    }]);
  });
  it('crédito USD', () => {
    const [m] = one(fx.creditoUsd);
    expect(m).toMatchObject({ fecha: '2026-10-26', tipo: 'consumo_credito', medio: 'Visa 1111', monto_orig: 20, moneda: 'USD', comercio_raw: 'ANTHROPIC* CLAUDE SUB +1415' });
  });
  it('débito', () => {
    const [m] = one(fx.debito);
    expect(m).toMatchObject({ fecha: '2026-11-06', tipo: 'consumo_debito', medio: 'Débito 2222', monto_orig: 832.71, moneda: 'UYU', comercio_raw: 'DEVOTO EXPRESS VIS3' });
  });
  it('transferencia (URGP → UYU)', () => {
    const [m] = one(fx.transferencia);
    expect(m).toMatchObject({ tipo: 'transferencia', medio: 'Cuenta 3333', monto_orig: 500, moneda: 'UYU', cuenta_destino: '1234567', banco_destino: 'Itau', comercio_raw: '' });
    const [o] = one(fx.transferenciaOca);
    expect(o).toMatchObject({ monto_orig: 140000, cuenta_destino: '7654321', banco_destino: 'OCA Blue' });
  });
  it('pago de tarjeta → dos movimientos', () => {
    const movs = one(fx.pago);
    expect(movs).toHaveLength(2);
    expect(movs[0]).toMatchObject({ id: 'm6-uyu', tipo: 'pago_tarjeta', medio: 'Visa 1111', monto_orig: 39285.84, moneda: 'UYU' });
    expect(movs[1]).toMatchObject({ id: 'm6-usd', monto_orig: 456.31, moneda: 'USD' });
  });
  it('pago con dólares en cero → un solo movimiento', () => {
    const m = { ...fx.pago, body: fx.pago.body.replace('456.31', '0.00') };
    expect(one(m)).toHaveLength(1);
  });
  it('asunto desconocido → null', () => {
    expect(parseItauEmail({ id: 'x', date: fx.pago.date, subject: 'Tus puntos valen más', body: '' })).toBeNull();
  });
  it('asunto conocido con cuerpo irreconocible → ok:false', () => {
    const r = parseItauEmail({ ...fx.debito, body: 'Formato nuevo sin datos' });
    expect(r).toEqual({ ok: false, reason: expect.any(String) });
  });
  it('acepta reenvíos (Fwd:)', () => {
    expect(one({ ...fx.debito, subject: 'Fwd: ' + fx.debito.subject })).toHaveLength(1);
  });
});

describe('monedas raras de Itaú', () => {
  it('transferencia en US.D → USD', () => {
    const m = { ...fx.transferencia, body: fx.transferencia.body.replace('500.00 URGP', '143.00 US.D') };
    expect(parseItauEmail(m).movs[0]).toMatchObject({ monto_orig: 143, moneda: 'USD' });
  });
});

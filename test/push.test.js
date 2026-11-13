import { describe, it, expect } from 'vitest';
import fx from './fixtures/itau.json';
import { parsePush, pushToMovimiento } from '../src/core/push.js';
import { processMessages } from '../src/core/pipeline.js';
import { SEED_REGLAS } from '../src/core/seed.js';

const AT = '2026-11-13T00:12:00Z'; // 21:12 del 12/11 en Montevideo
const NOW = '2026-11-13 06:00:00';

describe('parsePush', () => {
  it('lee el push de consumo con tarjeta de crédito', () => {
    expect(parsePush('Se aprobó un consumo de su tarjeta VISA Nro. **** 1111 por UYU 300.0 en MERPAGO*SRV Barra.', AT)).toEqual({
      ok: true, mov: { fecha: '2026-11-12', tipo: 'consumo_credito', medio: 'Visa 1111', monto_orig: 300, moneda: 'UYU', comercio_raw: 'MERPAGO*SRV Barra', cuenta_destino: '', banco_destino: '' },
    });
  });
  it('acepta dólares, el título pegado adelante y espacios raros', () => {
    const r = parsePush('Consumo aprobado\nSe aprobó un consumo de su tarjeta VISA Nro. ****1111 por USD 20.00 en ANTHROPIC* CLAUDE SUBSCR.', AT);
    expect(r.mov).toMatchObject({ monto_orig: 20, moneda: 'USD', comercio_raw: 'ANTHROPIC* CLAUDE SUBSCR' });
  });
  it('lo que no reconoce lo devuelve como no leído, sin inventar', () => {
    expect(parsePush('Tenés un nuevo beneficio en Itaú Volar', AT)).toEqual({ ok: false, reason: expect.any(String) });
  });
});

describe('pushToMovimiento', () => {
  const ctx = { reglas: SEED_REGLAS, cuentas: [{ numero: '1111', tipo: 'tarjeta_propia', titular: 'Compartido' }] };
  it('arma el movimiento con id estable (si Android lo manda dos veces, es el mismo)', () => {
    const t = 'Se aprobó un consumo de su tarjeta VISA Nro. **** 1111 por UYU 3251.0 en MERPAGO*MACROMERCADO MONTE.';
    const a = pushToMovimiento(t, AT, ctx, 40, NOW);
    const b = pushToMovimiento(t, '2026-11-13T00:12:40Z', ctx, 40, NOW);
    expect(a.ok).toBe(true);
    expect(a.mov).toMatchObject({ origen: 'push', categoria: 'Supermercado', monto_uyu: 3251 });
    expect(b.mov.id).toBe(a.mov.id);
  });
});

describe('el mail que llega después de un push no duplica', () => {
  it('se descarta en silencio si ya entró por push (misma tarjeta, monto y moneda, ±1 día)', () => {
    const ctx = { reglas: SEED_REGLAS, cuentas: [] };
    const push = pushToMovimiento('Se aprobó un consumo de su tarjeta VISA Nro. **** 1111 por UYU 3251.0 en MERPAGO*MACROMERCADO MONTE.', '2026-11-08T19:54:00Z', ctx, 40, NOW).mov;
    const rows = [];
    const st = {
      reglas: SEED_REGLAS, cuentas: [], existing: [push], hasId: () => false, log: () => {},
      appendMovimientos: m => rows.push(...m),
    };
    const r = processMessages([fx.creditoUyu], st, () => 40, NOW);
    expect(rows).toHaveLength(0);
    expect(r.nuevos).toBe(0);
  });
});

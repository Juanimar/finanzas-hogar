import { describe, it, expect } from 'vitest';
import { pickRate, computeAmounts, buildBcuRequest, parseBcuResponse } from '../src/core/money.js';

const rates = [
  { fecha: '2026-11-05', usd_uyu: 40.1 },
  { fecha: '2026-11-06', usd_uyu: 40.2 },
];

describe('pickRate', () => {
  it('exact date', () => expect(pickRate(rates, '2026-11-06').usd_uyu).toBe(40.2));
  it('Saturday uses Friday', () => expect(pickRate(rates, '2026-11-07').fecha).toBe('2026-11-06'));
  it('too old → null', () => expect(pickRate(rates, '2026-11-30')).toBeNull());
  it('before any rate → null', () => expect(pickRate(rates, '2026-11-01')).toBeNull());
});

describe('computeAmounts', () => {
  it('USD → UYU', () => expect(computeAmounts(20, 'USD', 40)).toEqual({ monto_uyu: 800, monto_usd: 20 }));
  it('UYU → USD rounded', () => expect(computeAmounts(100, 'UYU', 40.2)).toEqual({ monto_uyu: 100, monto_usd: 2.49 }));
  it('no rate keeps native only', () => expect(computeAmounts(100, 'UYU', null)).toEqual({ monto_uyu: 100, monto_usd: '' }));
});

describe('BCU', () => {
  it('builds a SOAP request for USD 2222', () => {
    const x = buildBcuRequest('2026-11-01', '2026-11-08');
    expect(x).toContain('<cot:item>2222</cot:item>');
    expect(x).toContain('<cot:FechaDesde>2026-11-01</cot:FechaDesde>');
  });
  it('parses Fecha/TCV pairs', () => {
    const xml = `<SOAP-ENV:Envelope><SOAP-ENV:Body><wsbcucotizaciones.ExecuteResponse xmlns="Cotiza"><Salida><respuestastatus><status>1</status></respuestastatus><datoscotizaciones>
      <datoscotizaciones.dato><Fecha>2026-11-05</Fecha><Moneda>2222</Moneda><TCC>40.1</TCC><TCV>40.1</TCV></datoscotizaciones.dato>
      <datoscotizaciones.dato><Fecha>2026-11-06</Fecha><Moneda>2222</Moneda><TCC>40.2</TCC><TCV>40.25</TCV></datoscotizaciones.dato>
      </datoscotizaciones></Salida></wsbcucotizaciones.ExecuteResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;
    expect(parseBcuResponse(xml)).toEqual([{ fecha: '2026-11-05', usd_uyu: 40.1 }, { fecha: '2026-11-06', usd_uyu: 40.25 }]);
  });
});

import { describe, it, expect } from 'vitest';
import { parseMaiorano } from '../src/core/maiorano.js';

// Filas como las devuelve pdfRows() del reporte "Posición de Inversión" (datos inventados).
const FILAS = [
  ['Cuenta de Inversiones'],
  ['Posición de Inversión(en USD)'],
  ['Situación de su cuenta al:', '17/11/26'],
  ['1', 'Efectivo', 'Saldo', 'Saldo', 'USD', '%', 'Cartera'],
  ['2', 'PESOS URUGUAYOS', '$', '7,74', '0,19', '0,00'],
  ['2', 'DOLARES USA BILLETE', 'USD', '1.000,00', '1.000,00', '10,00'],
  ['SubTotal Efectivo', 'USD', '1.000,19'],
  ['7', 'FONDO GLOBAL A ACC', '/  /', 'USD', '10,00000', '100,00', 'U', '1.000,00', '120,00', 'U', '0,00', '1.200,00', '12,00'],
  ['7', 'EMPRESA X 7.50% 1/1/2033', '7,5000', '01/01/2033', 'USD', '5.000,00000', '100,00', '%', '5.000,00', '98,00', '%', '50,00', '4.950,00', '49,50'],
  ['7', 'SPY - SPDR TRUST SERIE 1', '/  /', 'USD', '4,00000', '600,00', 'U', '2.400,00', '712,45', 'U', '0,00', '2.849,81', '28,50'],
  ['Sub Total Valores', 'USD', '8.999,81'],
  ['Total Posición', 'USD', '10.000,00'],
  ['17/01/27', 'CUPON', 'EMPRESA X 7.50% 1/1/2033', 'USD', '187,50', '187,50', '187,50'],
  ['01/07/27', 'CUPON', 'EMPRESA X 7.50% 1/1/2033', 'USD', '187,50', '187,50', '375,00'],
  ['Total Cash Flow', '375,00'],
  ['Totales por Instrumento'],
  ['Instrumento', 'Importe En', 'USD', '%'],
  ['w', 'EF', '1.000,19', '10,00'],
  ['w', 'RV', 'ACCIONES', '2.849,81', '28,50'],
  ['w', 'NS', 'RENTA FIJA EM CORP', '4.950,00', '49,50'],
  ['w', 'AG', 'RENTA FIJA GLOBAL', '1.200,00', '12,00'],
  ['x', 'Total', '10.000,00'],
  ['Tipo de Cambio', '$', '40,60900'],
];

describe('parseMaiorano', () => {
  const p = parseMaiorano(FILAS);
  it('lee fecha, total y efectivo', () => {
    expect(p).toMatchObject({ fecha: '2026-11-17', total: 10000, efectivo: 1000.19, tipoCambio: 40.609 });
  });
  it('lee cada tenencia con su costo, valor actual y peso', () => {
    expect(p.tenencias).toHaveLength(3);
    expect(p.tenencias[1]).toEqual({ nombre: 'EMPRESA X 7.50% 1/1/2033', costo: 5000, valor: 4950, pct: 49.5 });
    expect(p.tenencias[2]).toMatchObject({ nombre: 'SPY - SPDR TRUST SERIE 1', valor: 2849.81 });
  });
  it('lee la composición por tipo de instrumento (EF = Efectivo)', () => {
    expect(p.composicion).toEqual([
      { tipo: 'Efectivo', usd: 1000.19, pct: 10 },
      { tipo: 'Acciones', usd: 2849.81, pct: 28.5 },
      { tipo: 'Renta fija em corp', usd: 4950, pct: 49.5 },
      { tipo: 'Renta fija global', usd: 1200, pct: 12 },
    ]);
  });
  it('lee los cupones de los próximos 12 meses', () => {
    expect(p.cupones).toEqual([
      { fecha: '2027-01-17', valor: 'EMPRESA X 7.50% 1/1/2033', usd: 187.5 },
      { fecha: '2027-07-01', valor: 'EMPRESA X 7.50% 1/1/2033', usd: 187.5 },
    ]);
  });
  it('rechaza lo que no es un reporte de posición', () => {
    expect(() => parseMaiorano([['Estado de cuenta VISA'], ['Total', '1,00']])).toThrow(/reporte de posición/);
  });
});

import { describe, it, expect } from 'vitest';
import { zlibSync, strToU8 } from 'fflate';
import { pdfTextLines } from '../src/core/pdf.js';
import { parseEstadoCuenta, conciliar } from '../src/core/estadoCuenta.js';

// Datos inventados con el mismo formato de columnas fijas que el estado de cuenta VISA de Itaú.
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
const linea = (fecha, tarjeta, comercio, cuota, uyu, usd, orig) => {
  let l = pad(`          ${fecha}  ${tarjeta}    ${comercio}`, 64);
  if (cuota) l = pad(l + cuota, 64);
  const at = (s, end) => { l = pad(l, end - s.length) + s; };
  if (orig) at(orig, 93);
  if (uyu) at(uyu, 107);
  if (usd) at(usd, 121);
  return l;
};
const LINEAS = [
  '                     SALDO DEL ESTADO DE CUENTA ANTERIOR                                          10.000,00       100,00',
  '          30 09 26   PAGOS                                                                       -10.000,00',
  '          02 10 26   PAGOS                                                                                       -100,00',
  linea('10 10 26', '1013', 'TELEPEAJE', '', '167,00'),
  linea('09 01 26', '1025', 'TIENDA DE COSAS', '10/12', '', '100,00'),
  linea('20 06 26', '1025', 'SUPERMERCADO X', ' 5/ 6', '607,50'),
  linea('30 09 26', '1025', 'MERPAGO*TIENDA', ' 1/ 2', '1492,30'),
  linea('27 10 26', '1025', 'SERVICIO ONLINE', '', '', '20,00', '20,00'),
  linea('08 10 26', '1025', 'CAFE DEL CENTRO', '', '1.475,00'),
  linea('08 10 26', '1025', 'REDUC. IVA LEY 17934', '', '-35,04'),
  '',
  '                            SEGURO DE VIDA SOBRE SALDO                                               158,27          2,96',
  '                     SALDO CONTADO                                                                12.000,00        50,00',
];

describe('parseEstadoCuenta', () => {
  const ec = parseEstadoCuenta(['26/10/26', ...LINEAS]);
  it('lee la fecha de cierre', () => expect(ec.cierre).toBe('2026-10-26'));
  it('distingue pesos y dólares por columna, y lee cuotas', () => {
    const by = c => ec.items.find(i => i.comercio === c);
    expect(by('TELEPEAJE')).toMatchObject({ fecha: '2026-10-10', tarjeta: '1013', monto: 167, moneda: 'UYU', cuota: null });
    expect(by('TIENDA DE COSAS')).toMatchObject({ moneda: 'USD', monto: 100, cuota: { n: 10, de: 12 } });
    expect(by('SUPERMERCADO X').cuota).toEqual({ n: 5, de: 6 });
    expect(by('SERVICIO ONLINE')).toMatchObject({ moneda: 'USD', monto: 20 });
    expect(by('CAFE DEL CENTRO').monto).toBe(1475);
    expect(by('REDUC. IVA LEY 17934').monto).toBe(-35.04);
  });
  it('ignora pagos y saldos; el seguro va con la fecha de cierre, en las dos monedas', () => {
    expect(ec.items.some(i => /^(PAGOS|SALDO)/.test(i.comercio))).toBe(false);
    const seg = ec.items.filter(i => i.comercio === 'SEGURO DE VIDA SOBRE SALDO');
    expect(seg).toEqual([
      expect.objectContaining({ fecha: '2026-10-26', moneda: 'UYU', monto: 158.27 }),
      expect.objectContaining({ fecha: '2026-10-26', moneda: 'USD', monto: 2.96 }),
    ]);
  });
});

describe('conciliar', () => {
  const ec = parseEstadoCuenta(['26/10/26', ...LINEAS]);
  const ctx = { reglas: [], cuentas: [], desde: '2026-01-01' };
  const mov = (fecha, monto, moneda, extra = {}) => ({ id: `m${fecha}${monto}`, fecha, tipo: 'consumo_credito', medio: 'Visa 1025', monto_orig: monto, moneda, ...extra });

  it('no agrega lo que ya llegó por mail, aunque cambie la tarjeta o la fecha (hasta 7 días)', () => {
    const existentes = [
      mov('2026-10-16', 167, 'UYU'), // telepeaje: llegó como 1025 y 6 días después
      mov('2026-06-20', 3645, 'UYU'), // cuota 5/6: ya contada en junio
      mov('2026-09-30', 2984.6, 'UYU'), // 1/2: el mail trae el total
      mov('2026-10-27', 20, 'USD'),
      mov('2026-10-08', 1475, 'UYU', { tipo: 'manual', medio: 'Efectivo' }), // cargado a mano
    ];
    const nuevos = conciliar(ec, existentes, ctx);
    expect(nuevos.map(n => n.comercio_raw).sort()).toEqual(['REDUC. IVA LEY 17934', 'SEGURO DE VIDA SOBRE SALDO', 'SEGURO DE VIDA SOBRE SALDO']);
  });

  it('agrega lo que falta, con el total de la compra en cuotas y nota', () => {
    const nuevos = conciliar(ec, [], ctx);
    const by = c => nuevos.find(n => n.comercio_raw === c);
    expect(by('TELEPEAJE')).toMatchObject({ fecha: '2026-10-10', medio: 'Visa 1013', monto_orig: 167, moneda: 'UYU', tipo: 'consumo_credito', origen: 'estado_cuenta' });
    expect(by('MERPAGO*TIENDA')).toMatchObject({ monto_orig: 2984.6, fecha: '2026-09-30' });
    expect(by('MERPAGO*TIENDA').nota).toMatch(/2 cuotas/);
    expect(nuevos.some(n => n.comercio_raw === 'SUPERMERCADO X' || n.comercio_raw === 'TIENDA DE COSAS')).toBe(false); // cuotas 2..N
    expect(by('REDUC. IVA LEY 17934')).toMatchObject({ categoria: 'Bancos/Comisiones', monto_orig: -35.04 });
    expect(by('SEGURO DE VIDA SOBRE SALDO').categoria).toBe('Bancos/Comisiones');
  });

  it('cada movimiento existente cubre una sola línea (dos telepeajes iguales, un solo mail)', () => {
    const doble = { ...ec, items: [...ec.items.filter(i => i.comercio === 'TELEPEAJE'), ...ec.items.filter(i => i.comercio === 'TELEPEAJE')] };
    const nuevos = conciliar(doble, [mov('2026-10-11', 167, 'UYU')], ctx);
    expect(nuevos).toHaveLength(1);
  });

  it('varias líneas del mismo comercio y día que suman un solo aviso no se agregan (eBay)', () => {
    const items = [12.79, 22.75, 24.4, 10.87, 15.72, 30.11, 26.51, 20.01].map(monto => ({ fecha: '2026-08-08', tarjeta: '1025', comercio: 'EBAY O*21-14985-6921', cuota: null, monto, moneda: 'USD' }));
    expect(conciliar({ cierre: '2026-08-26', items }, [mov('2026-08-08', 163.16, 'USD')], ctx)).toHaveLength(0);
    expect(conciliar({ cierre: '2026-08-26', items }, [], ctx)).toHaveLength(8);
  });

  it('el mail trae el monto neto de la reducción de IVA: compra + REDUC. IVA del mismo día = un aviso', () => {
    const items = [
      { fecha: '2026-09-03', tarjeta: '1025', comercio: 'NORIMOTO UY', cuota: null, monto: 3052, moneda: 'UYU' },
      { fecha: '2026-09-03', tarjeta: '1025', comercio: 'REDUC. IVA LEY 17934', cuota: null, monto: -204.71, moneda: 'UYU' },
      { fecha: '2026-02-01', tarjeta: '1025', comercio: 'LA PEATONAL', cuota: null, monto: 525, moneda: 'UYU' },
      { fecha: '2026-02-01', tarjeta: '1025', comercio: 'REDUC. IVA LEY 17934', cuota: null, monto: -38.73, moneda: 'UYU' },
      { fecha: '2026-02-01', tarjeta: '1025', comercio: 'LA PEATONAL', cuota: null, monto: 1215, moneda: 'UYU' },
      { fecha: '2026-02-01', tarjeta: '1025', comercio: 'REDUC. IVA LEY 17934', cuota: null, monto: -89.63, moneda: 'UYU' },
    ];
    const existentes = [mov('2026-09-02', 2847.29, 'UYU'), mov('2026-01-31', 486.27, 'UYU'), mov('2026-01-31', 1125.37, 'UYU')];
    expect(conciliar({ cierre: '2026-09-28', items }, existentes, ctx)).toHaveLength(0);
  });

  it('la propina en otra línea: compra + propina del mismo día = un aviso', () => {
    const items = [
      { fecha: '2026-09-11', tarjeta: '1025', comercio: 'MERPAGO*CARLALUCIANA', cuota: null, monto: 38.58, moneda: 'USD' },
      { fecha: '2026-09-11', tarjeta: '1025', comercio: 'PROPINA*MERPAGO*CARL', cuota: null, monto: 3.86, moneda: 'USD' },
    ];
    expect(conciliar({ cierre: '2026-09-28', items }, [mov('2026-09-10', 42.45, 'USD')], ctx)).toHaveLength(0);
  });

  it('es idempotente: correrlo dos veces no duplica', () => {
    const primera = conciliar(ec, [], ctx);
    expect(conciliar(ec, primera, ctx)).toHaveLength(0);
  });

  it('ignora líneas anteriores a la fecha desde (las cubre la planilla vieja)', () => {
    const viejo = { ...ec, items: [{ fecha: '2025-12-20', tarjeta: '1025', comercio: 'ALGO', cuota: null, monto: 10, moneda: 'UYU' }] };
    expect(conciliar(viejo, [], ctx)).toHaveLength(0);
  });
});

describe('pdfTextLines', () => {
  const enc = s => strToU8(s, true);
  const stream = content => {
    const z = zlibSync(enc(content));
    return [enc(`4 0 obj\n<< /Length ${z.length} /Filter /FlateDecode >>\nstream\n`), z, enc('\nendstream\nendobj\n')];
  };
  const pdf = parts => {
    const all = [enc('%PDF-1.4\n'), ...parts.flat(), enc('%%EOF')];
    const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
    let o = 0; for (const p of all) { out.set(p, o); o += p.length; }
    return out;
  };
  it('descomprime y devuelve el texto ordenado de arriba hacia abajo, con escapes', () => {
    const c = 'BT\n1 0 0 1 24.5 500 Tm\n/F1 7 Tf\n(segunda \\(linea\\))Tj\nET\nBT\n1 0 0 1 24.5 600 Tm\n/F1 7 Tf\n(primera)Tj\nET\nBT\n1 0 0 1 490 700 Tm\n(26/10/26)Tj\nET';
    expect(pdfTextLines(pdf([stream(c)]))).toEqual(['26/10/26', 'primera', 'segunda (linea)']);
  });
  it('separa varias líneas posicionadas dentro del mismo bloque de texto', () => {
    const c = 'BT\n1 0 0 1 24.5 591.6 Tm\n/F1 7 Tf\n(linea uno)Tj\n1 0 0 1 24.5 584.6 Tm\n(linea dos)Tj\nET';
    expect(pdfTextLines(pdf([stream(c)]))).toEqual(['linea uno', 'linea dos']);
  });
  it('decodifica acentos WinAnsi (octal)', () => {
    const c = 'BT\n1 0 0 1 24.5 500 Tm\n(D\\311BITO AUTOM\\301TICO)Tj\nET';
    expect(pdfTextLines(pdf([stream(c)]))).toEqual(['DÉBITO AUTOMÁTICO']);
  });
});

import { describe, it, expect } from 'vitest';
import { inversionesToMovs } from '../src/core/inversiones.js';

const NOW = '2026-11-10 03:30:00';
const rows = [
  ['', '', 'Total', '$156.100'],
  ['PORTAFOLIO'],
  ['Año', 'Mes', 'Depósitos', 'USD', 'Acumulado'],
  ['2019', '11', '6/11/2019', '$3.000', '$3.000', '-$3.000', '', '', 'Año', 'Mes', 'SUM de USD'],
  ['2025', '2', '20/02/2025', '520', '$51.700'],
  ['2026', '6', '03/06/2026', '5000', '$136.300'],
  ['2026', '10', '27/10/2026', '', '', '188.209,00'],
  ['1899', '12'],
];
const existentes = [{ id: 'x', fecha: '2026-06-03', tipo: 'transferencia', categoria: 'Ahorro/Inversión', moneda: 'USD', monto_orig: 5000 }];

describe('inversionesToMovs', () => {
  it('reads deposits under the header, skips blanks and already-registered transfers', () => {
    const movs = inversionesToMovs(rows, existentes, NOW);
    expect(movs.map(m => [m.id, m.fecha, m.monto_orig])).toEqual([
      ['inv-2019-11-06-3000', '2019-11-06', 3000],
      ['inv-2025-02-20-520', '2025-02-20', 520],
    ]);
    expect(movs[0]).toMatchObject({ moneda: 'USD', monto_usd: 3000, categoria: 'Ahorro/Inversión', revisado: true, bloqueado: true, origen: 'historico' });
  });
  it('is idempotent with its own ids', () => {
    const first = inversionesToMovs(rows, existentes, NOW);
    expect(inversionesToMovs(rows, [...existentes, ...first], NOW)).toEqual([]);
  });
  it('matches an email transfer within 3 days', () => {
    const e = [{ fecha: '2026-06-05', categoria: 'Ahorro/Inversión', moneda: 'USD', monto_orig: '5000' }];
    expect(inversionesToMovs(rows, e, NOW).some(m => m.fecha === '2026-06-03')).toBe(false);
  });
});

import { depositosInversiones, balancesInversiones } from '../src/core/inversiones.js';
describe('lectura de la pestaña Inversiones para la pantalla de inversiones', () => {
  const rows = [
    ['', '', 'Total', '$10.000'],
    ['Año', 'Mes', 'Depósitos', 'USD', 'Acumulado'],
    ['2025', '1', '03/01/2025', '3000', '$3.000', '-3000', '', '', 'Fecha', 'Balance Maiorano'],
    ['2025', '2', '6/2/2025', '$4.700', '$7.700', '-4700', '', '', '2/9/2025', '96300'],
    ['2025', '3', '', '', '', '', '', '', '27/10/2026', '188.209,00'],
    ['1899', '12'],
  ];
  it('depósitos con fecha y monto', () => {
    expect(depositosInversiones(rows)).toEqual([{ fecha: '2025-01-03', usd: 3000 }, { fecha: '2025-02-06', usd: 4700 }]);
  });
  it('balances anotados a mano (columna "Balance Maiorano")', () => {
    expect(balancesInversiones(rows)).toEqual([{ fecha: '2025-09-02', total: 96300 }, { fecha: '2026-10-27', total: 188209 }]);
  });
});

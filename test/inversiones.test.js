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

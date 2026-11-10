import { describe, it, expect } from 'vitest';
import { importLegacyRows, parseLegacyAmount } from '../src/core/legacy.js';

const NOW = '2026-11-10 03:00:00';
const H = ['Año', 'Mes', 'Quien', 'Descripción', 'Monto', 'Coment', 'Categoría'];

describe('parseLegacyAmount', () => {
  it.each([['1000', 1000], ['67324,53', 67324.53], ['1.978.80', 1978.8], ['1.500', 1500], ['-3655', -3655], ['', NaN]])('%s', (s, n) => {
    if (Number.isNaN(n)) expect(parseLegacyAmount(s)).toBeNaN(); else expect(parseLegacyAmount(s)).toBe(n);
  });
});

describe('importLegacyRows', () => {
  const rows = [H,
    ['2024', '7', 'Juani', 'Pedidosya', '135', 'Debito', 'Alimentación'],
    ['2024', '9', 'Juani', 'Verduras en puestero', '520', 'Efectivo', 'Alimentación'],
    ['2024', '9', 'Mili', 'Medias Juani', '140', 'Blue', 'Ropa'],
    ['2024', '12', 'Mili', 'Regalo', '300', 'Transferencia', 'Cumpleaños'],
    ['2025', '1', '-', 'Algo', '100', '', 'Otro'],
    ['2025', '11', 'Juani', 'credito pesos', '61977', 'Crédito', 'Total Crédito'],
    ['2025', '11', 'Juani', 'credito dol', '829', 'Crédito', 'Total Crédito'],
    ['2025', '11', 'Juani', 'transferencia total', '-3655', 'Transferencia', 'Total Transferencia'],
    ['2026', '1', 'Juani', 'Nafta', '500', 'Debito', 'Transporte'],
    ['2026', '1', '-', 'Servicios Mensuales'],
  ];
  const { movs, omitidas } = importLegacyRows(rows, { hasta: '2025-12', now: NOW });

  it('maps categories and people', () => {
    expect(movs[0]).toMatchObject({ id: 'hist-2', fecha: '2024-07-15', tipo: 'manual', medio: 'Planilla (Debito)', descripcion: 'Pedidosya', monto_orig: 135, moneda: 'UYU', categoria: 'Delivery', quien: 'Juani', clasificado_por: 'manual', revisado: true, bloqueado: true, origen: 'historico', cotizacion: '' });
    expect(movs[1].categoria).toBe('Supermercado');
    expect(movs[2]).toMatchObject({ categoria: 'Ropa', quien: 'Mili' });
    expect(movs[3].categoria).toBe('Regalos y Cumpleaños');
    expect(movs[4]).toMatchObject({ categoria: 'Otros', quien: 'Compartido' });
  });
  it('card totals become Otros, dollars detected, negative totals skipped', () => {
    const t = movs.filter(m => m.fecha === '2025-11-15');
    expect(t.map(m => [m.monto_orig, m.moneda, m.categoria])).toEqual([[61977, 'UYU', 'Otros'], [829, 'USD', 'Otros']]);
    expect(t[0].descripcion).toContain('total sin detalle');
  });
  it('stops at the cut-off month and reports skipped rows', () => {
    expect(movs.some(m => m.fecha.startsWith('2026'))).toBe(false);
    expect(omitidas).toBe(3); // negative total, 2026 row, incomplete row
  });
});

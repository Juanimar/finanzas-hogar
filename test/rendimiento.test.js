import { describe, it, expect } from 'vitest';
import { xirr, resumenInversion } from '../src/core/rendimiento.js';

describe('xirr (rendimiento ponderado por dinero, anual)', () => {
  it('un depósito que crece 10% en un año rinde 10%', () => {
    expect(xirr([{ fecha: '2025-01-01', monto: -1000 }, { fecha: '2026-01-01', monto: 1100 }])).toBeCloseTo(0.1, 4);
  });
  it('pondera por el tiempo que estuvo cada depósito', () => {
    const r = xirr([{ fecha: '2025-01-01', monto: -1000 }, { fecha: '2025-07-02', monto: -1000 }, { fecha: '2026-01-01', monto: 2150 }]);
    expect(r).toBeGreaterThan(0.09);
    expect(r).toBeLessThan(0.11);
  });
  it('sin flujos válidos devuelve null', () => {
    expect(xirr([{ fecha: '2025-01-01', monto: -1000 }])).toBeNull();
  });
});

describe('resumenInversion', () => {
  it('aportado, ganancia y rendimiento hasta la fecha de la foto', () => {
    const r = resumenInversion([{ fecha: '2025-01-01', usd: 1000 }, { fecha: '2027-01-01', usd: 500 }], { fecha: '2026-01-01', total: 1100 });
    expect(r).toMatchObject({ aportado: 1000, ganancia: 100, gananciaPct: 10 });
    expect(r.mwrr).toBeCloseTo(0.1, 3);
  });
});

import { historialCartera, referenciasPlanilla } from '../src/core/rendimiento.js';
describe('historialCartera', () => {
  it('une balances a mano y reportes, ordena y en el mismo día gana el reporte', () => {
    const h = historialCartera(
      [{ fecha: '2026-11-17', total_usd: 185773.27, efectivo_usd: 40494.72, detalle: '{"composicion":[]}' }],
      [{ fecha: '2025-09-02', total: 96300 }, { fecha: '2026-11-17', total: 1 }],
    );
    expect(h.map(x => [x.fecha, x.total, x.fuente])).toEqual([['2025-09-02', 96300, 'planilla'], ['2026-11-17', 185773.27, 'reporte']]);
    expect(h[1].detalle.composicion).toEqual([]);
  });
});
describe('referenciasPlanilla', () => {
  it('lee las tasas de referencia de la pestaña Inversiones', () => {
    const rows = [['', '', '', '', 'Metodo MWRR'], ['', '', 'Total', '$1', 'Tasa de Retorno Portafolio:', '11,10%'], ['', '', '', '', 'Tasa de Retorno SP&500:', '12,13%']];
    expect(referenciasPlanilla(rows)).toEqual([{ nombre: 'Portafolio', tasa: 0.111 }, { nombre: 'SP&500', tasa: 0.1213 }]);
  });
});

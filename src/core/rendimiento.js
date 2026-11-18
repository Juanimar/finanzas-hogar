// Rendimiento de la cartera: lo aportado contra lo que vale hoy, y la tasa anual ponderada por dinero (MWRR/XIRR),
// el mismo método que Juani usa en la pestaña Inversiones.
const DAY = 86400000;
const r2 = n => Math.round(n * 100) / 100;

/** flujos: [{fecha:'YYYY-MM-DD', monto}] (aportes negativos, valor final positivo). Devuelve tasa anual o null. */
export function xirr(flujos) {
  const f = flujos.filter(x => x.fecha && Number.isFinite(x.monto) && x.monto !== 0);
  if (!f.some(x => x.monto < 0) || !f.some(x => x.monto > 0)) return null;
  const t0 = Math.min(...f.map(x => Date.parse(x.fecha)));
  const npv = r => f.reduce((a, x) => a + x.monto / (1 + r) ** ((Date.parse(x.fecha) - t0) / DAY / 365), 0);
  let lo = -0.99, hi = 10;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** depositos: [{fecha, usd}]; foto: {fecha, total}. Solo cuentan los depósitos hasta la fecha de la foto. */
export function resumenInversion(depositos, foto) {
  const previos = depositos.filter(d => d.fecha <= foto.fecha);
  const aportado = r2(previos.reduce((a, d) => a + d.usd, 0));
  const ganancia = r2(foto.total - aportado);
  return {
    fecha: foto.fecha, total: foto.total, aportado, ganancia,
    gananciaPct: aportado ? r2((ganancia / aportado) * 100) : null,
    mwrr: xirr([...previos.map(d => ({ fecha: d.fecha, monto: -d.usd })), { fecha: foto.fecha, monto: foto.total }]),
  };
}

/** Valor de la cartera en el tiempo: reportes subidos (Posiciones) + balances anotados a mano (Inversiones). */
export function historialCartera(posiciones, balances) {
  const m = new Map();
  for (const b of balances) m.set(b.fecha, { fecha: b.fecha, total: b.total, fuente: 'planilla' });
  for (const p of posiciones) {
    let detalle = null;
    try { detalle = JSON.parse(p.detalle || 'null'); } catch (e) { detalle = null; }
    m.set(String(p.fecha), { fecha: String(p.fecha), total: Number(p.total_usd), efectivo: Number(p.efectivo_usd), detalle, fuente: 'reporte' });
  }
  return [...m.values()].filter(x => x.total > 0).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Tasas de comparación que Juani calcula en la pestaña Inversiones ("Tasa de Retorno X:" → %). */
export function referenciasPlanilla(rows) {
  const out = [];
  for (const r of rows) {
    const i = r.findIndex(c => /^Tasa de Retorno/i.test(String(c).trim()));
    if (i < 0) continue;
    const tasa = Number(String(r[i + 1] || '').replace('%', '').replace(',', '.')) / 100;
    if (Number.isFinite(tasa)) out.push({ nombre: String(r[i]).replace(/^Tasa de Retorno\s*/i, '').replace(/:$/, '').trim(), tasa: Math.round(tasa * 1e6) / 1e6 });
  }
  return out;
}

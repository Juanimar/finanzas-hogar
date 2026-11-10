// "Inversiones" tab (USD deposits with date) → Ahorro/Inversión movements, skipping ones already present.
const DAY = 86400000;
const usd = s => Number(String(s ?? '').replace(/[$\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));

function parseDate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

export function inversionesToMovs(rows, existentes, now) {
  const start = rows.findIndex(r => String(r[2]).trim() === 'Depósitos' && String(r[3]).trim() === 'USD');
  if (start < 0) return [];
  const ids = new Set(existentes.map(m => String(m.id)));
  const ahorros = existentes.filter(m => m.categoria === 'Ahorro/Inversión' && m.moneda === 'USD');
  const out = [];
  for (const r of rows.slice(start + 1)) {
    const fecha = parseDate(r[2]);
    const monto = usd(r[3]);
    if (!fecha || !(monto > 0)) continue;
    const id = `inv-${fecha}-${monto}`;
    if (ids.has(id)) continue;
    const t = Date.parse(fecha);
    if (ahorros.some(m => Number(m.monto_orig) === monto && Math.abs(Date.parse(m.fecha) - t) <= 3 * DAY)) continue;
    ids.add(id);
    out.push({
      id, fecha, tipo: 'manual', medio: 'Planilla Inversiones', comercio_raw: 'Depósito inversión', comercio: 'DEPOSITO INVERSION',
      cuenta_destino: '', banco_destino: '', descripcion: 'Depósito inversión (BROU)', monto_orig: monto, moneda: 'USD',
      cotizacion: '', monto_uyu: '', monto_usd: monto, categoria: 'Ahorro/Inversión', quien: 'Compartido',
      clasificado_por: 'manual', revisado: true, bloqueado: true, origen: 'historico', nota: 'Importado de Inversiones',
      creado: now, modificado: now,
    });
  }
  return out;
}

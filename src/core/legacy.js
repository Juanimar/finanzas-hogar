import { normalizeComercio } from './normalize.js';

// Old "Gastos Mensuales" tab → Movimientos. Only month is known, so the 15th is used.
const CAT = {
  comidasocial: 'ComidaSocial', diversion: 'Diversión', transporte: 'Transporte', trasporte: 'Transporte',
  casa: 'Casa', regalos: 'Regalos y Cumpleaños', regalo: 'Regalos y Cumpleaños', cumpleanos: 'Regalos y Cumpleaños',
  'higiene/salud': 'Salud', higiene: 'Salud', salud: 'Salud', 'estetica/cosmetica': 'Estética/Cosmética',
  donacion: 'Donación', 'servicios mensuales': 'Servicios', subscripciones: 'Suscripciones', suscripciones: 'Suscripciones',
  tarjeta: 'Bancos/Comisiones', ropa: 'Ropa', deporte: 'Deporte', estudio: 'Educación', otro: 'Otros', '': 'Otros',
};
const key = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function parseLegacyAmount(s) {
  let t = String(s ?? '').trim();
  if (!t) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if ((t.match(/\./g) || []).length > 1) { const i = t.lastIndexOf('.'); t = t.slice(0, i).replace(/\./g, '') + t.slice(i); }
  else if (/^-?\d{1,3}\.\d{3}$/.test(t)) t = t.replace('.', '');
  return Number(t);
}

export function legacyCategoria(cat, descripcion) {
  const k = key(cat);
  if (k === 'alimentacion') return /pedidos ?ya|rappi/i.test(descripcion) ? 'Delivery' : 'Supermercado';
  return CAT[k] || 'Otros';
}

/** rows: raw values including header row. Returns {movs, omitidas}. `hasta`: last month included (YYYY-MM). */
export function importLegacyRows(rows, { hasta, now }) {
  const movs = [];
  let omitidas = 0;
  rows.slice(1).forEach((r, i) => {
    const [anio, mes, quienRaw, desc, montoRaw, coment, cat] = r;
    const fechaMes = `${anio}-${String(mes).padStart(2, '0')}`;
    const monto = parseLegacyAmount(montoRaw);
    if (!/^\d{4}-\d{2}$/.test(fechaMes) || !Number.isFinite(monto) || r.length < 5) { omitidas++; return; }
    if (fechaMes > hasta || monto <= 0) { omitidas++; return; }
    const esTotal = /^total/i.test(String(cat || ''));
    const moneda = esTotal && /dol/i.test(desc) ? 'USD' : 'UYU';
    const quien = ['Juani', 'Mili'].includes(String(quienRaw).trim()) ? String(quienRaw).trim() : 'Compartido';
    const descripcion = esTotal ? `${desc} (total sin detalle)` : String(desc || '').trim();
    movs.push({
      id: `hist-${i + 2}`, fecha: `${fechaMes}-15`, tipo: 'manual',
      medio: `Planilla (${String(coment || '').trim() || 'sin dato'})`,
      comercio_raw: String(desc || '').trim(), comercio: normalizeComercio(desc), cuenta_destino: '', banco_destino: '',
      descripcion, monto_orig: monto, moneda, cotizacion: '',
      monto_uyu: moneda === 'UYU' ? monto : '', monto_usd: moneda === 'USD' ? monto : '',
      categoria: esTotal ? 'Otros' : legacyCategoria(cat, desc), quien,
      clasificado_por: 'manual', revisado: true, bloqueado: true, origen: 'historico',
      nota: 'Importado de Gastos Mensuales', creado: now, modificado: now,
    });
  });
  return { movs, omitidas };
}

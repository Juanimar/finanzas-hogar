// Notificaciones push de la app de Itaú en Android, reenviadas por MacroDroid al script.
// Llegan al instante y también cubren consumos de los que Itaú no manda mail.
import { toMontevideoDate } from './dates.js';
import { buildMovimiento } from './pipeline.js';

const MONEDA = { UYU: 'UYU', $: 'UYU', USD: 'USD', U$S: 'USD', 'US$': 'USD' };
const CREDITO = /tarjeta\s+VISA\s+Nro\.?\s*\*+\s*(\d{4})\s+por\s+(UYU|USD|U\$S|US\$|\$)\s*([\d.,]+?)\s+en\s+(.+?)\.?\s*$/i;

const num = s => Number(/,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''));

/** text: texto del push (título + cuerpo); receivedAt: ISO UTC de cuando llegó. */
export function parsePush(text, receivedAt) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const m = CREDITO.exec(t);
  if (!m) return { ok: false, reason: 'Formato de push no reconocido' };
  const monto = num(m[3]);
  if (!Number.isFinite(monto)) return { ok: false, reason: `Monto inválido: ${m[3]}` };
  return {
    ok: true,
    mov: {
      fecha: toMontevideoDate(receivedAt), tipo: 'consumo_credito', medio: `Visa ${m[1]}`,
      monto_orig: monto, moneda: MONEDA[m[2].toUpperCase()], comercio_raw: m[4].trim(), cuenta_destino: '', banco_destino: '',
    },
  };
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Movimiento listo para la planilla. El id es estable dentro de 10 minutos, por si Android repite el push. */
export function pushToMovimiento(text, receivedAt, ctx, rate, now) {
  const p = parsePush(text, receivedAt);
  if (!p.ok) return p;
  const bucket = Math.floor(Date.parse(receivedAt) / 600000);
  const id = `push-${hash(`${p.mov.medio}|${p.mov.monto_orig}|${p.mov.moneda}|${p.mov.comercio_raw}|${bucket}`)}`;
  return { ok: true, mov: buildMovimiento({ ...p.mov, id }, ctx, rate, now, 'push') };
}

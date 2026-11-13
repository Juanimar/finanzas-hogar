import { parseItauEmail } from './parsers.js';
import { normalizeComercio } from './normalize.js';
import { classify } from './classify.js';
import { computeAmounts } from './money.js';

function safeRate(rateProvider, fecha) {
  try { return rateProvider(fecha) || null; } catch (e) { return null; }
}

export function buildMovimiento(draft, { reglas, cuentas }, rate, now, origen = 'gmail') {
  const comercio = normalizeComercio(draft.comercio_raw);
  const base = { ...draft, comercio, bloqueado: false };
  const c = classify(base, { reglas, cuentas });
  return {
    ...base, ...c, comercio: c.comercio ?? comercio,
    cotizacion: rate || '', ...computeAmounts(draft.monto_orig, draft.moneda, rate),
    origen, nota: '', creado: now, modificado: now,
  };
}

/**
 * messages: [{id, subject, body, date}]
 * store: {hasId, reglas, cuentas, appendMovimientos(movs), log(nivel, evento, detalle, ref)}
 * rateProvider: fecha -> usd_uyu | null (may throw)
 */
const dupKey = m => [m.fecha, m.medio, Number(m.monto_orig), m.moneda, m.comercio_raw || '', m.cuenta_destino || ''].join('|');
export const DUP_NOTE = 'Posible duplicado: el mismo aviso llegó en dos mails';

export function processMessages(messages, store, rateProvider, now, origen = 'gmail') {
  const nuevos = [];
  const keys = new Set((store.existing || []).map(dupKey));
  // Lo que ya entró por push al instante: el mail que llega después no se vuelve a cargar.
  const pushes = (store.existing || []).filter(m => m.origen === 'push').map(m => ({ m, usado: false }));
  const yaPorPush = d => {
    const p = pushes.find(x => !x.usado && x.m.medio === d.medio && Number(x.m.monto_orig) === Number(d.monto_orig) && x.m.moneda === d.moneda
      && Math.abs(Date.parse(x.m.fecha) - Date.parse(d.fecha)) <= 86400000);
    if (p) p.usado = true;
    return !!p;
  };
  const revisar = [];
  let ignorados = 0;
  for (const msg of messages) {
    const parsed = parseItauEmail(msg);
    if (parsed === null) { ignorados++; continue; }
    if (!parsed.ok) {
      revisar.push(msg.id);
      store.log('aviso', 'mail_no_leido', `${msg.subject}: ${parsed.reason} | ${String(msg.body).slice(0, 300)}`, msg.id);
      continue;
    }
    for (const d of parsed.movs) {
      if (store.hasId(d.id) || nuevos.some(n => n.id === d.id)) continue;
      if (yaPorPush(d)) continue;
      const mov = buildMovimiento(d, store, safeRate(rateProvider, d.fecha), now, origen);
      const k = dupKey(mov);
      if (keys.has(k)) Object.assign(mov, { revisado: false, nota: DUP_NOTE });
      keys.add(k);
      nuevos.push(mov);
    }
  }
  if (nuevos.length) store.appendMovimientos(nuevos);
  return { nuevos: nuevos.length, revisar, ignorados };
}

export function fillMissingRates(movs, rateProvider) {
  const out = [];
  for (const m of movs) {
    if (m.cotizacion !== '' || !m.fecha || !m.moneda) continue;
    const rate = safeRate(rateProvider, m.fecha);
    if (rate) out.push({ ...m, cotizacion: rate, ...computeAmounts(Number(m.monto_orig), m.moneda, rate) });
  }
  return out;
}

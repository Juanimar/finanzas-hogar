import { toMontevideoDate } from './dates.js';

export function parseAmount(s) {
  return Number(String(s).replace(/,/g, ''));
}

function currency(s) {
  const u = s.toUpperCase();
  if (/^(URGP|UYU|PESOS?|\$)$/.test(u)) return 'UYU';
  if (/^(USD|US\.?D|U\$S|DOLARES|DÓLARES|DOLAR|DÓLAR)$/.test(u)) return 'USD';
  return null;
}

const clean = body => String(body).replace(/[|#]/g, ' ').replace(/\s+/g, ' ').trim();
const NUM = '([\\d.,]+)';

const PARSERS = [
  {
    subject: /consumo aprobado con tarjeta de cr[eé]dito/i,
    tipo: 'consumo_credito',
    re: new RegExp(`nro\\. \\*+\\s*(\\d{4}) Importe: ${NUM} (\\S+) Comercio: (.+?) Adem[aá]s`, 'i'),
    build: m => [{ medio: `Visa ${m[1]}`, monto: m[2], moneda: m[3], comercio_raw: m[4] }],
  },
  {
    subject: /consumo aprobado con tarjeta de d[eé]bito/i,
    tipo: 'consumo_debito',
    re: new RegExp(`terminada en (\\d{4}) ?\\. Realizado en (.+?) Monto: ${NUM} (\\S+?)\\.? `, 'i'),
    build: m => [{ medio: `Débito ${m[1]}`, monto: m[3], moneda: m[4], comercio_raw: m[2] }],
  },
  {
    subject: /transferencia realizada/i,
    tipo: 'transferencia',
    re: new RegExp(`desde la cuenta \\*+\\s*(\\d{4}) Importe: ${NUM} (\\S+) Cuenta destino: (\\S+) Banco/Instituci[oó]n destino: (.+?) Adem[aá]s`, 'i'),
    build: m => [{ medio: `Cuenta ${m[1]}`, monto: m[2], moneda: m[3], cuenta_destino: m[4], banco_destino: m[5] }],
  },
  {
    subject: /pago de tarjeta de cr[eé]dito/i,
    tipo: 'pago_tarjeta',
    re: new RegExp(`terminada en (\\d{4})\\. Pago en pesos: ${NUM} pesos Pago en d[oó]lares: ${NUM} d[oó]lares`, 'i'),
    build: m => [
      { suffix: '-uyu', medio: `Visa ${m[1]}`, monto: m[2], moneda: 'UYU' },
      { suffix: '-usd', medio: `Visa ${m[1]}`, monto: m[3], moneda: 'USD' },
    ],
  },
];

export function parseItauEmail({ id, subject, body, date }) {
  const p = PARSERS.find(x => x.subject.test(subject || ''));
  if (!p) return null;
  const m = clean(body).match(p.re);
  if (!m) return { ok: false, reason: `Formato no reconocido para "${subject}"` };
  const fecha = toMontevideoDate(date);
  const movs = [];
  for (const b of p.build(m)) {
    const moneda = currency(b.moneda);
    const monto = parseAmount(b.monto);
    if (!moneda || !Number.isFinite(monto)) return { ok: false, reason: `Monto o moneda inválidos: ${b.monto} ${b.moneda}` };
    if (p.tipo === 'pago_tarjeta' && monto === 0) continue;
    movs.push({
      id: id + (b.suffix || ''), fecha, tipo: p.tipo, medio: b.medio,
      comercio_raw: (b.comercio_raw || '').trim(), cuenta_destino: b.cuenta_destino || '',
      banco_destino: (b.banco_destino || '').trim(), monto_orig: monto, moneda,
    });
  }
  return { ok: true, movs };
}

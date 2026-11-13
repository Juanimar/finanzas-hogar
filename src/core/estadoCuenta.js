// Estado de cuenta VISA de Itaú (PDF mensual por mail) → conciliación con lo que llegó por avisos.
// El formato es de columnas fijas (Courier): fecha · tarjeta · comercio · cuota · [moneda origen] · pesos · dólares.
import { buildMovimiento } from './pipeline.js';

const AMOUNT = /-?[\d.]+,\d\d/g;
const COL_USD = 114; // las cifras en dólares terminan en la columna ~121, las de pesos en ~107
const COL_UYU = 100; // más a la izquierda está el importe en la moneda de origen (no se usa)
const VENTANA_DIAS = 7; // el telepeaje, por ejemplo, llega por mail hasta 6 días después
const DAY = 86400000;
const r2 = n => Math.round(n * 100) / 100;
const num = s => Number(s.replace(/\./g, '').replace(',', '.'));
const fechaISO = (d, m, y) => `20${y}-${m}-${d}`;

function montos(line) {
  const out = {};
  for (const m of line.matchAll(AMOUNT)) {
    const end = m.index + m[0].length;
    if (end >= COL_USD) out.USD = num(m[0]);
    else if (end >= COL_UYU) out.UYU = num(m[0]);
  }
  return out;
}

const CARGO_BANCO = /SEGURO DE VIDA|REDUC\.? IVA|INTERES|COMISION|RECARGO|IMPUESTO|IVA S\/?/i;

export function parseEstadoCuenta(lines) {
  let cierre = null;
  const items = [];
  for (const line of lines) {
    const c = /^\s*(\d\d)\/(\d\d)\/(\d\d)\s*$/.exec(line);
    if (c && !cierre) { cierre = fechaISO(c[1], c[2], c[3]); continue; }

    const m = /^\s*(\d\d) (\d\d) (\d\d)\s+(\d{4})\s+(.+?)(?:\s{2,}|$)/.exec(line);
    if (m) {
      const resto = line.slice(m.index + m[0].length);
      const primerMonto = resto.search(AMOUNT);
      const q = /(\d{1,2})\/\s?(\d{1,2})/.exec(primerMonto >= 0 ? resto.slice(0, primerMonto) : resto);
      const base = { fecha: fechaISO(m[1], m[2], m[3]), tarjeta: m[4], comercio: m[5].trim(), cuota: q ? { n: Number(q[1]), de: Number(q[2]) } : null };
      const a = montos(line);
      if (a.UYU !== undefined) items.push({ ...base, monto: a.UYU, moneda: 'UYU' });
      else if (a.USD !== undefined) items.push({ ...base, monto: a.USD, moneda: 'USD' });
      continue;
    }

    // Cargos del banco sin fecha (seguro de vida, intereses): van con la fecha de cierre.
    const lead = line.length - line.trimStart().length;
    const texto = line.trim();
    if (lead >= 26 && lead <= 30 && !/^SALDO|^PAGOS/.test(texto) && CARGO_BANCO.test(texto)) {
      const comercio = texto.replace(AMOUNT, '').trim();
      const a = montos(line);
      for (const moneda of ['UYU', 'USD']) if (a[moneda]) items.push({ fecha: null, tarjeta: '', comercio, cuota: null, monto: a[moneda], moneda });
    }
  }
  for (const i of items) if (!i.fecha) i.fecha = cierre;
  return { cierre, items };
}

const NO_CRUZAR = new Set(['transferencia', 'consumo_debito', 'pago_tarjeta']);
const dias = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / DAY;

/**
 * Devuelve los movimientos que faltan: líneas del estado de cuenta que no coinciden con ningún
 * movimiento ya cargado (por mail, push, a mano o por un estado de cuenta anterior).
 * ctx: { reglas, cuentas, desde: 'YYYY-MM-DD', now, rateFor?: fecha -> cotización }
 */
export function conciliar(ec, existentes, ctx) {
  const pool = existentes.filter(m => !NO_CRUZAR.has(m.tipo)).map(m => ({ m, usado: false }));
  const buscar = (moneda, monto, fecha, tol) => {
    let best = null;
    for (const p of pool) {
      if (p.usado || p.m.moneda !== moneda || Math.abs(Number(p.m.monto_orig) - monto) > tol) continue;
      const d = dias(p.m.fecha, fecha);
      if (d <= VENTANA_DIAS && (!best || d < best.d)) best = { p, d };
    }
    if (best) best.p.usado = true;
    return !!best;
  };

  // 1) Línea por línea.
  let pendientes = [];
  for (const it of ec.items) {
    if (!it.fecha || it.fecha < (ctx.desde || '')) continue;
    if (it.cuota && it.cuota.n > 1) continue; // la compra ya se contó entera en su mes
    const total = it.cuota ? r2(it.monto * it.cuota.de) : it.monto;
    const tol = it.cuota ? it.cuota.de * 0.01 + 0.02 : 0.005;
    if (!buscar(it.moneda, total, it.fecha, tol)) pendientes.push({ ...it, total });
  }

  // 2) El aviso trae el monto neto: compra + su "REDUC. IVA" del mismo día.
  const esIva = i => /REDUC\.? IVA/i.test(i.comercio);
  for (const iva of pendientes.filter(esIva)) {
    const compra = pendientes.find(c => !esIva(c) && c.fecha === iva.fecha && c.moneda === iva.moneda && buscar(c.moneda, r2(c.total + iva.total), c.fecha, 0.01));
    if (compra) pendientes = pendientes.filter(i => i !== compra && i !== iva);
  }

  // 3) Varias líneas del mismo día que llegaron en un solo aviso: un carrito de eBay, compra + propina.
  //    Primero por comercio, después todo el día junto.
  const porGrupo = clave => {
    const grupos = new Map();
    for (const it of pendientes) grupos.set(clave(it), [...(grupos.get(clave(it)) || []), it]);
    for (const g of grupos.values()) {
      if (g.length < 2) continue;
      const suma = r2(g.reduce((a, i) => a + i.total, 0));
      if (buscar(g[0].moneda, suma, g[0].fecha, 0.01 * g.length)) pendientes = pendientes.filter(i => !g.includes(i));
    }
  };
  porGrupo(it => `${it.fecha}|${it.moneda}|${it.comercio.split(/\s+/)[0]}`);
  porGrupo(it => `${it.fecha}|${it.moneda}`);

  // 4) Lo que sigue sin aparecer, se agrega.
  const nuevos = [];
  const vistos = new Map();
  for (const it of pendientes) {
    const key = `${it.fecha}-${it.tarjeta || 'banco'}-${it.total}-${it.moneda}`;
    const k = (vistos.get(key) || 0) + 1;
    vistos.set(key, k);
    const draft = {
      id: `edc-${key}-${k}`, fecha: it.fecha, tipo: 'consumo_credito', medio: it.tarjeta ? `Visa ${it.tarjeta}` : 'Visa',
      comercio_raw: it.comercio, cuenta_destino: '', banco_destino: '', monto_orig: it.total, moneda: it.moneda,
    };
    const rate = ctx.rateFor ? safe(() => ctx.rateFor(it.fecha)) : null;
    const mov = buildMovimiento(draft, ctx, rate, ctx.now || '', 'estado_cuenta');
    if (!it.tarjeta || CARGO_BANCO.test(it.comercio)) Object.assign(mov, { categoria: 'Bancos/Comisiones', clasificado_por: 'regla_contiene', revisado: true });
    mov.nota = it.cuota ? `Compra en ${it.cuota.de} cuotas · agregado desde el estado de cuenta` : 'Agregado desde el estado de cuenta (no llegó aviso)';
    nuevos.push(mov);
  }
  return nuevos;
}

function safe(f) { try { return f() || null; } catch (e) { return null; } }

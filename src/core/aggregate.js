const r2 = n => Math.round(n * 100) / 100;
const amount = (m, currency) => Number(currency === 'USD' ? m.monto_usd : m.monto_uyu) || 0;
const inMonth = (m, yyyymm) => String(m.fecha).startsWith(yyyymm);

export function catIndex(categorias) {
  return new Map(categorias.map(c => [c.nombre, c]));
}

const grupoOf = (m, ix) => ix.get(m.categoria)?.grupo || 'Variables';

const INGRESOS = new Set(['Sueldo', 'Otros ingresos']);
const isIngreso = (m, ix) => grupoOf(m, ix) === 'Ingresos' || INGRESOS.has(m.categoria);

export function isGasto(mov, ix) {
  return mov.tipo !== 'pago_tarjeta' && grupoOf(mov, ix) !== 'No es gasto' && !isIngreso(mov, ix);
}

export function monthSummary(movs, categorias, yyyymm, currency) {
  const ix = catIndex(categorias);
  const month = movs.filter(m => inMonth(m, yyyymm));
  const gastos = month.filter(m => isGasto(m, ix));
  const porGrupo = { Fijos: 0, Variables: 0 };
  const porCat = new Map();
  for (const m of gastos) {
    const a = amount(m, currency);
    const g = grupoOf(m, ix);
    porGrupo[g] = r2((porGrupo[g] || 0) + a);
    porCat.set(m.categoria, r2((porCat.get(m.categoria) || 0) + a));
  }
  const porCategoria = [...porCat].map(([categoria, total]) => ({ categoria, grupo: grupoOf({ categoria }, ix), total }))
    .sort((a, b) => b.total - a.total);
  const ahorro = r2(month.filter(m => m.categoria === 'Ahorro/Inversión').reduce((s, m) => s + amount(m, currency), 0));
  const ingresos = r2(month.filter(m => isIngreso(m, ix)).reduce((s, m) => s + amount(m, currency), 0));
  const tasaAhorro = ingresos ? Math.round((ahorro / ingresos) * 100) : null;

  const counted = month.filter(m => m.tipo !== 'pago_tarjeta');
  const n = counted.length;
  const manual = counted.filter(m => m.clasificado_por === 'manual').length;
  const pend = counted.filter(m => m.clasificado_por === 'pendiente').length;
  const pct = x => (n ? Math.round((x / n) * 100) : 0);
  const metric = n ? { manual: pct(manual), pendiente: pct(pend) } : { manual: 0, pendiente: 0 };
  metric.reglas = n ? 100 - metric.manual - metric.pendiente : 0;

  return {
    total: r2(gastos.reduce((s, m) => s + amount(m, currency), 0)),
    porGrupo, porCategoria, ahorro, ingresos, tasaAhorro,
    pendientes: movs.filter(m => m.revisado === false).length,
    metric,
  };
}

export function cumulativeByDay(movs, categorias, yyyymm, currency) {
  const ix = catIndex(categorias);
  const [y, mo] = yyyymm.split('-').map(Number);
  const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const daily = new Array(days).fill(0);
  for (const m of movs) {
    if (!inMonth(m, yyyymm) || !isGasto(m, ix)) continue;
    daily[Number(String(m.fecha).slice(8, 10)) - 1] += amount(m, currency);
  }
  let acc = 0;
  return daily.map(d => (acc = r2(acc + d)));
}

export function merchantTotals(movs, categorias, categoria, yyyymm, currency) {
  const ix = catIndex(categorias);
  const year = yyyymm.slice(0, 4);
  const map = new Map();
  for (const m of movs) {
    if (m.categoria !== categoria || !isGasto(m, ix) || !String(m.fecha).startsWith(year)) continue;
    const k = m.descripcion || m.comercio || '(sin nombre)';
    const e = map.get(k) || { comercio: k, mes: 0, anio: 0 };
    const a = amount(m, currency);
    e.anio = r2(e.anio + a);
    if (inMonth(m, yyyymm)) e.mes = r2(e.mes + a);
    map.set(k, e);
  }
  return [...map.values()].sort((a, b) => b.mes - a.mes || b.anio - a.anio);
}

/** Distinct mails the script could not read in the 7 days up to `today` (YYYY-MM-DD). */
export function unreadMailCount(logs, today) {
  const since = new Date(Date.parse(today) - 7 * 86400000).toISOString().slice(0, 10);
  return new Set(logs.filter(l => l.evento === 'mail_no_leido' && String(l.fecha_hora).slice(0, 10) >= since).map(l => l.ref)).size;
}

/** One entry per month of `year`, plus total and average over months that have spending. */
export function yearSummary(movs, categorias, year, currency) {
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = `${year}-${String(i + 1).padStart(2, '0')}`;
    const s = monthSummary(movs, categorias, mes, currency);
    return { mes, fijos: s.porGrupo.Fijos || 0, variables: s.porGrupo.Variables || 0, total: s.total, ahorro: s.ahorro, ingresos: s.ingresos, porCategoria: s.porCategoria };
  });
  const conGasto = meses.filter(m => m.total > 0);
  const total = r2(meses.reduce((a, m) => a + m.total, 0));
  const sum = k => r2(meses.reduce((a, m) => a + m[k], 0));
  const cats = new Map();
  for (const m of meses) for (const c of m.porCategoria) {
    const prev = cats.get(c.categoria) || { ...c, total: 0 };
    cats.set(c.categoria, { ...prev, total: r2(prev.total + c.total) });
  }
  for (const m of meses) delete m.porCategoria;
  const ahorro = sum('ahorro'), ingresos = sum('ingresos');
  return {
    meses, total, promedio: conGasto.length ? r2(total / conGasto.length) : 0,
    porGrupo: { Fijos: sum('fijos'), Variables: sum('variables') },
    porCategoria: [...cats.values()].sort((a, b) => b.total - a.total),
    ahorro, ingresos, tasaAhorro: ingresos ? Math.round((ahorro / ingresos) * 100) : null,
  };
}

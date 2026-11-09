import { normalizeComercio } from './normalize.js';

const titleCase = s => s.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase());

export function quienFor(medio, cuentas) {
  const last4 = (String(medio || '').match(/(\d{4})$/) || [])[1];
  const c = last4 && cuentas.find(x => x.tipo === 'tarjeta_propia' && String(x.numero) === last4);
  return (c && c.titular) || 'Compartido';
}

function matchRule(comercio, reglas) {
  if (!comercio) return null;
  const exact = reglas.find(r => r.tipo === 'exacta' && r.patron === comercio);
  if (exact) return { regla: exact, por: 'regla_exacta' };
  const padded = ` ${comercio} `;
  const hits = reglas.filter(r => r.tipo === 'contiene' && r.patron && padded.includes(` ${r.patron} `));
  if (!hits.length) return null;
  hits.sort((a, b) => b.patron.length - a.patron.length);
  return { regla: hits[0], por: 'regla_contiene' };
}

const fromRule = (hit, comercio, quien, revisado = hit.regla.origen !== 'agrupacion') => ({
  categoria: hit.regla.categoria,
  quien: hit.regla.quien || quien,
  descripcion: hit.regla.descripcion || titleCase(comercio),
  clasificado_por: hit.por,
  revisado,
});

export function classify(mov, { reglas, cuentas }) {
  if (mov.bloqueado) {
    const { categoria, quien, descripcion, clasificado_por, revisado } = mov;
    return { categoria, quien, descripcion, clasificado_por, revisado };
  }
  const quien = quienFor(mov.medio, cuentas);

  if (mov.tipo === 'pago_tarjeta') {
    return { categoria: 'Movimiento interno', quien, descripcion: `Pago tarjeta ${mov.medio}`, clasificado_por: 'regla_exacta', revisado: true };
  }

  if (mov.tipo === 'transferencia') {
    const c = cuentas.find(x => String(x.numero) === String(mov.cuenta_destino));
    if (c) {
      const categoria = c.tipo === 'propia_ahorro' ? 'Ahorro/Inversión'
        : c.tipo === 'propia_interna' ? 'Movimiento interno'
        : c.categoria || 'Otros';
      return { categoria, quien: c.quien || quien, descripcion: c.nombre || `Cuenta ${c.numero}`, clasificado_por: 'cuenta', revisado: true };
    }
    const banco = normalizeComercio(mov.banco_destino);
    const hit = matchRule(banco, reglas);
    // Bank-name matches (e.g. any Midinero wallet) are a guess: keep them for review.
    if (hit) return fromRule(hit, banco, quien, false);
    return { categoria: 'Otros', quien, descripcion: `Transferencia a ${mov.banco_destino || ''} ${mov.cuenta_destino}`.replace(/\s+/g, ' ').trim(), clasificado_por: 'pendiente', revisado: false };
  }

  const comercio = mov.comercio || normalizeComercio(mov.comercio_raw || mov.descripcion);
  const hit = matchRule(comercio, reglas);
  if (hit) return { ...fromRule(hit, comercio, quien), comercio };
  return { categoria: 'Otros', quien, descripcion: titleCase(comercio), clasificado_por: 'pendiente', revisado: false, comercio };
}

export function applyToSimilar(movs, reglas, cuentas) {
  const changed = [];
  for (const m of movs) {
    if (m.bloqueado || m.clasificado_por !== 'pendiente') continue;
    const c = classify(m, { reglas, cuentas });
    if (c.clasificado_por !== 'pendiente') changed.push({ ...m, ...c });
  }
  return changed;
}

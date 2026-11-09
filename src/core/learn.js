import { tokens } from './normalize.js';

let seq = 0;
const newId = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;

export function learnFromEdit(mov, edit, { reglas, cuentas }, now) {
  const categoria = edit.categoria ?? mov.categoria;

  if (mov.tipo === 'transferencia' && mov.cuenta_destino) {
    const prev = cuentas.find(c => String(c.numero) === String(mov.cuenta_destino)) || {};
    const tipo = categoria === 'Ahorro/Inversión' ? 'propia_ahorro'
      : categoria === 'Movimiento interno' ? 'propia_interna'
      : (prev.tipo && prev.tipo !== 'propia_ahorro' && prev.tipo !== 'propia_interna' ? prev.tipo : 'tercero');
    return {
      reglaUpsert: null,
      cuentaUpsert: {
        numero: String(mov.cuenta_destino), banco: prev.banco || mov.banco_destino || '',
        nombre: edit.nombreCuenta || prev.nombre || edit.descripcion || '', tipo,
        titular: prev.titular || '', categoria: tipo === 'tercero' ? categoria : '',
        quien: edit.quien && edit.quien !== 'Compartido' ? edit.quien : (prev.quien || ''),
      },
    };
  }

  if (!mov.comercio) return { reglaUpsert: null, cuentaUpsert: null };
  const prev = reglas.find(r => r.tipo === 'exacta' && r.patron === mov.comercio);
  const quien = edit.quien && edit.quien !== 'Compartido' ? edit.quien : (prev?.quien || '');
  if (prev) {
    return {
      reglaUpsert: { ...prev, categoria, descripcion: edit.descripcion || prev.descripcion, quien, modificada: now },
      cuentaUpsert: null,
    };
  }
  return {
    reglaUpsert: {
      id: newId(), tipo: 'exacta', patron: mov.comercio, categoria, quien,
      descripcion: edit.descripcion || mov.descripcion || '',
      origen: categoria === mov.categoria ? 'confirmacion' : 'correccion',
      usos: 0, creada: now, modificada: now,
    },
    cuentaUpsert: null,
  };
}

export function consolidate(reglas, now) {
  const byToken = new Map();
  for (const r of reglas.filter(x => x.tipo === 'exacta')) {
    for (const t of new Set(tokens(r.patron))) {
      if (t.length < 4) continue;
      if (!byToken.has(t)) byToken.set(t, []);
      byToken.get(t).push(r);
    }
  }
  const existing = new Set(reglas.filter(r => r.tipo === 'contiene').map(r => r.patron));
  const out = [];
  for (const [t, rs] of byToken) {
    if (rs.length < 2 || existing.has(t)) continue;
    const cats = new Set(rs.map(r => r.categoria));
    if (cats.size !== 1) continue;
    out.push({ id: newId(), tipo: 'contiene', patron: t, categoria: rs[0].categoria, quien: '', descripcion: t.charAt(0) + t.slice(1).toLowerCase(), origen: 'agrupacion', usos: 0, creada: now, modificada: now });
  }
  return out;
}

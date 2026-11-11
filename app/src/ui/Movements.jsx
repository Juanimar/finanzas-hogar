import { useState } from 'preact/hooks';
import { fmt, dayLabel, amountOf, ownOrig, parteLabel } from './format.js';
import { parteDe } from '../../../src/core/money.js';

export function MovList({ movs, currency, onOpen }) {
  const sorted = [...movs].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  return (
    <div class="card list">
      {sorted.map(m => (
        <button key={m.id} class="li mov-li" onClick={() => onOpen(m)}>
          <span>
            <div>{m.descripcion || m.comercio_raw}{m.revisado === false && <b class="tag">revisar</b>}</div>
            <div class="small muted">{dayLabel(m.fecha)} · {m.categoria}{m.quien && m.quien !== 'Compartido' ? ` · ${m.quien}` : ''}</div>
          </span>
          <span class={m.tipo === 'pago_tarjeta' ? 'muted' : ''}>
            {fmt(amountOf(m, currency) || ownOrig(m), amountOf(m, currency) ? currency : m.moneda)}
            {parteDe(m) < 1
              ? <div class="small muted">pagaste {fmt(m.monto_orig, m.moneda)} · {parteLabel(m)}</div>
              : m.moneda !== currency && <div class="small muted">{fmt(m.monto_orig, m.moneda)}</div>}
          </span>
        </button>
      ))}
      {!sorted.length && <div class="li muted">Nada por acá.</div>}
    </div>
  );
}

export function Movements({ state, month, currency, onOpen }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const movs = state.movs.filter(m => (term
    ? `${m.descripcion} ${m.comercio_raw} ${m.categoria} ${m.banco_destino}`.toLowerCase().includes(term)
    : String(m.fecha).startsWith(month)));
  return (
    <div class="screen">
      <input class="input search" placeholder="Buscar en todos los meses…" value={q} onInput={e => setQ(e.currentTarget.value)} />
      <MovList movs={movs} currency={currency} onOpen={onOpen} />
    </div>
  );
}

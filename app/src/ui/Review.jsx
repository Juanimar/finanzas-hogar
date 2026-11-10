import { useState } from 'preact/hooks';
import { Editor } from './Editor.jsx';
import { fmt, dayLabel } from './format.js';

// Categorías más usadas en lo ya revisado: un toque y listo.
function topCategorias(movs, n = 6) {
  const cnt = new Map();
  for (const m of movs) if (m.revisado === true && m.categoria && m.tipo !== 'pago_tarjeta') cnt.set(m.categoria, (cnt.get(m.categoria) || 0) + 1);
  return [...cnt].sort((a, b) => b[1] - a[1]).map(([c]) => c).filter(c => c !== 'Otros').slice(0, n);
}

export function Review({ state, store }) {
  const pend = state.movs.filter(m => m.revisado === false).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const [open, setOpen] = useState(null);
  const top = topCategorias(state.movs);
  if (!pend.length) return <div class="screen center"><div class="done">✓</div><p>Todo revisado.</p></div>;

  const quick = (m, categoria) => {
    const nombre = String(m.descripcion || '').startsWith('Transferencia a') ? '' : m.descripcion;
    store.review(m, m.tipo === 'transferencia' && nombre ? { categoria, nombreCuenta: nombre, descripcion: nombre } : { categoria });
  };

  return (
    <div class="screen">
      <p class="muted small">{pend.length} para revisar. Tocá una categoría y listo; se aprende para la próxima.</p>
      {pend.map(m => {
        const sugerida = m.clasificado_por !== 'pendiente' ? m.categoria : null;
        const chips = sugerida ? [sugerida, ...top.filter(c => c !== sugerida)].slice(0, 6) : top;
        return (
          <div key={m.id} class="card mov">
            <div class="mov-head">
              <div>
                <div>{m.descripcion || m.comercio_raw}</div>
                <div class="small muted">{dayLabel(m.fecha)} · {m.medio}{m.tipo === 'transferencia' ? ` → ${m.banco_destino} ${m.cuenta_destino}` : ''}</div>
              </div>
              <div class="amt">{fmt(m.monto_orig, m.moneda)}</div>
            </div>
            {open !== m.id ? (
              <div class="chips quickchips">
                {chips.map(c => <button key={c} class={`chip ${c === sugerida ? 'on' : ''}`} onClick={() => quick(m, c)}>{c}</button>)}
                <button class="chip more" onClick={() => setOpen(m.id)}>Otra…</button>
              </div>
            ) : (
              <Editor mov={m} categorias={state.categorias} onSave={edit => { setOpen(null); store.review(m, edit); }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'preact/hooks';
import { Editor } from './Editor.jsx';
import { fmt, dayLabel } from './format.js';

export function Review({ state, store }) {
  const pend = state.movs.filter(m => m.revisado === false).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const [open, setOpen] = useState(undefined);
  const current = open === undefined ? pend[0]?.id : open;
  if (!pend.length) return <div class="screen center"><div class="done">✓</div><p>Todo revisado.</p></div>;
  return (
    <div class="screen">
      <p class="muted small">{pend.length} para revisar. Lo que confirmes se aprende para la próxima.</p>
      {pend.map(m => (
        <div key={m.id} class="card mov">
          <button class="mov-head" onClick={() => setOpen(current === m.id ? null : m.id)}>
            <div>
              <div>{m.descripcion || m.comercio_raw}</div>
              <div class="small muted">{dayLabel(m.fecha)} · {m.medio}{m.tipo === 'transferencia' ? ` → ${m.banco_destino} ${m.cuenta_destino}` : ''}</div>
            </div>
            <div class="amt">{fmt(m.monto_orig, m.moneda)}</div>
          </button>
          {m.clasificado_por !== 'pendiente' && current !== m.id && (
            <div class="quick">
              <span class="small muted">{m.categoria}</span>
              <button class="ghost" onClick={() => store.review(m, { categoria: m.categoria })}>✓</button>
            </div>
          )}
          {current === m.id && (
            <Editor mov={m} categorias={state.categorias} onSave={edit => { setOpen(undefined); store.review(m, edit); }} />
          )}
        </div>
      ))}
    </div>
  );
}

import { useState } from 'preact/hooks';
import { QUIENES } from './format.js';

export function NewEntry({ state, store, onDone }) {
  const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const [f, setF] = useState({ fecha: today, monto: '', moneda: 'UYU', descripcion: '', categoria: '', quien: 'Compartido' });
  const [tipo, setTipo] = useState('gasto');
  const up = patch => setF(prev => ({ ...prev, ...patch }));
  const onDesc = v => {
    const s = tipo === 'gasto' ? store.suggest(v) : null;
    up({ descripcion: v, ...(s && !f.categoria ? { categoria: s.categoria } : {}) });
  };
  const ok = Number(f.monto) > 0 && f.descripcion.trim() && f.categoria;
  return (
    <div class="editor">
      <div class="seg">{[['gasto', 'Gasto'], ['ingreso', 'Ingreso']].map(([k, l]) => <button key={k} class={tipo === k ? 'on' : ''} onClick={() => { setTipo(k); up({ categoria: k === 'ingreso' ? 'Sueldo' : '' }); }}>{l}</button>)}</div>
      <div class="row2">
        <input class="input big-input" inputMode="decimal" placeholder="0" value={f.monto} onInput={e => up({ monto: e.currentTarget.value.replace(',', '.') })} autoFocus />
        <div class="seg">{['UYU', 'USD'].map(c => <button key={c} class={f.moneda === c ? 'on' : ''} onClick={() => up({ moneda: c })}>{c === 'UYU' ? '$' : 'US$'}</button>)}</div>
      </div>
      <input class="input" placeholder={tipo === 'ingreso' ? 'Detalle (ej: sueldo noviembre)' : 'Qué fue (ej: pilas casa)'} value={f.descripcion} onInput={e => onDesc(e.currentTarget.value)} />
      <input class="input" type="date" value={f.fecha} onInput={e => up({ fecha: e.currentTarget.value })} />
      <div class="chips">
        {state.categorias.filter(c => (tipo === 'ingreso' ? c.grupo === 'Ingresos' : c.grupo === 'Fijos' || c.grupo === 'Variables')).map(c => (
          <button key={c.nombre} class={`chip ${f.categoria === c.nombre ? 'on' : ''}`} onClick={() => up({ categoria: c.nombre })}>{c.nombre}</button>
        ))}
      </div>
      <div class="seg">{QUIENES.map(q => <button key={q} class={f.quien === q ? 'on' : ''} onClick={() => up({ quien: q })}>{q}</button>)}</div>
      <button class="primary" disabled={!ok} onClick={async () => { await store.addManual(f); onDone(); }}>Guardar</button>
    </div>
  );
}

import { useState } from 'preact/hooks';
import { QUIENES } from './format.js';

// Category / who / name editor used by "Para revisar" and the movement detail.
export function Editor({ mov, categorias, onSave, saveLabel = 'Confirmar' }) {
  const [categoria, setCategoria] = useState(mov.categoria === 'Otros' && mov.clasificado_por === 'pendiente' ? '' : mov.categoria);
  const [quien, setQuien] = useState(mov.quien || 'Compartido');
  const [nombre, setNombre] = useState(String(mov.descripcion || '').startsWith('Transferencia a') ? '' : mov.descripcion);
  const grupos = ['Variables', 'Fijos', 'No es gasto'];
  const isTransfer = mov.tipo === 'transferencia';
  return (
    <div class="editor">
      <label class="small muted">{isTransfer ? '¿A quién le transferiste?' : 'Descripción'}</label>
      <input class="input" value={nombre} placeholder={isTransfer ? 'Ej: Peluquería' : ''} onInput={e => setNombre(e.currentTarget.value)} />
      {grupos.map(g => (
        <div key={g}>
          <div class="small muted group-title">{g}</div>
          <div class="chips">
            {categorias.filter(c => c.grupo === g).map(c => (
              <button key={c.nombre} class={`chip ${categoria === c.nombre ? 'on' : ''}`} onClick={() => setCategoria(c.nombre)}>{c.nombre}</button>
            ))}
          </div>
        </div>
      ))}
      <div class="seg">
        {QUIENES.map(q => <button key={q} class={quien === q ? 'on' : ''} onClick={() => setQuien(q)}>{q}</button>)}
      </div>
      <button class="primary" disabled={!categoria || (isTransfer && !nombre)} onClick={() => onSave({
        categoria, quien,
        ...(isTransfer ? { nombreCuenta: nombre, descripcion: nombre } : { descripcion: nombre }),
      })}>{saveLabel}</button>
    </div>
  );
}

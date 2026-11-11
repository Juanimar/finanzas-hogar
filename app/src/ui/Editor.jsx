import { useState } from 'preact/hooks';
import { QUIENES, fmt } from './format.js';
import { parteDe, parteDesde } from '../../../src/core/money.js';

// Category / who / name editor used by "Para revisar" and the movement detail.
export function Editor({ mov, categorias, onSave, saveLabel = 'Confirmar' }) {
  const [categoria, setCategoria] = useState(mov.categoria === 'Otros' && mov.clasificado_por === 'pendiente' ? '' : mov.categoria);
  const [quien, setQuien] = useState(mov.quien || 'Compartido');
  const [nombre, setNombre] = useState(String(mov.descripcion || '').startsWith('Transferencia a') ? '' : mov.descripcion);
  const [parte, setParte] = useState(parteDe(mov) < 1 ? parteDe(mov) : '');
  const grupos = ['Variables', 'Fijos', 'No es gasto', 'Ingresos'];
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
      <Dividir mov={mov} parte={parte} setParte={setParte} />
      <button class="primary" disabled={!categoria || (isTransfer && !nombre)} onClick={() => onSave({
        categoria, quien, parte,
        ...(isTransfer ? { nombreCuenta: nombre, descripcion: nombre } : { descripcion: nombre }),
      })}>{saveLabel}</button>
    </div>
  );
}

const OPCIONES = [2, 3, 4, 5, 10];

// "Dividir": la familia solo paga una parte; el resto se lo devuelven otros.
function Dividir({ mov, parte, setParte }) {
  const total = Number(mov.monto_orig);
  const n = parte ? Math.round(1 / parte) : 1;
  const esOpcion = !parte || (OPCIONES.includes(n) && Math.abs(1 / n - parte) < 1e-6);
  const [otro, setOtro] = useState(!esOpcion);
  const [modo, setModo] = useState('entre');
  const [valor, setValor] = useState(!esOpcion ? String(Math.round(total * parte * 100) / 100) : '');
  const aplicarOtro = (m, v) => {
    setValor(v);
    setParte(parteDesde(m === 'entre' ? { entre: Number(v) } : { monto: Number(String(v).replace(',', '.')) }, total));
  };
  return (
    <div class="dividir">
      <div class="small muted group-title">Dividir el gasto</div>
      <div class="chips">
        <button class={`chip ${!parte && !otro ? 'on' : ''}`} onClick={() => { setOtro(false); setParte(''); }}>No</button>
        {OPCIONES.map(k => (
          <button key={k} class={`chip ${!otro && parte && n === k ? 'on' : ''}`} onClick={() => { setOtro(false); setParte(parteDesde({ entre: k }, total)); }}>÷{k}</button>
        ))}
        <button class={`chip ${otro ? 'on' : ''}`} onClick={() => { setOtro(true); setModo('monto'); setParte(''); setValor(''); }}>Otro</button>
      </div>
      {otro && (
        <div class="dividir-otro">
          <div class="seg">
            <button class={modo === 'entre' ? 'on' : ''} onClick={() => { setModo('entre'); aplicarOtro('entre', ''); }}>Entre N</button>
            <button class={modo === 'monto' ? 'on' : ''} onClick={() => { setModo('monto'); aplicarOtro('monto', ''); }}>Mi parte</button>
          </div>
          <input class="input" inputMode="decimal" value={valor} placeholder={modo === 'entre' ? 'Cantidad de personas' : `Monto (${mov.moneda})`} onInput={e => aplicarOtro(modo, e.currentTarget.value)} />
        </div>
      )}
      {parte
        ? <div class="small">Cuenta como gasto: <b>{fmt(total * parte, mov.moneda)}</b> <span class="muted">de {fmt(total, mov.moneda)}</span></div>
        : otro && valor && <div class="small muted">Tiene que ser menos que {fmt(total, mov.moneda)}.</div>}
    </div>
  );
}

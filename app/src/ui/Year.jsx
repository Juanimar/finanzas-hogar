import { yearSummary } from '../../../src/core/aggregate.js';
import { fmt } from './format.js';

const LETRAS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function Year({ state, month, currency, onPickMonth, onYear }) {
  const year = month.slice(0, 4);
  const y = yearSummary(state.movs, state.categorias, year, currency);
  const W = 336, H = 170, top = 10, bottom = 22, gap = 6;
  const max = Math.max(1, ...y.meses.map(m => m.total));
  const bw = (W - gap * 11) / 12;
  const sy = v => ((H - top - bottom) * v) / max;
  const avgY = H - bottom - sy(y.promedio);

  return (
    <div class="screen">
      <div class="year-head">
        <button class="ghost" onClick={() => onYear(-1)} aria-label="Año anterior">‹</button>
        <h2>{year}</h2>
        <button class="ghost" onClick={() => onYear(1)} aria-label="Año siguiente">›</button>
      </div>
      <section class="card hero">
        <div class="muted small">Gastado en {year}</div>
        <div class="big">{fmt(y.total, currency)}</div>
        <div class="muted small">Promedio mensual {fmt(y.promedio, currency)}</div>
        <svg viewBox={`0 0 ${W} ${H}`} class="bars" role="img" aria-label={`Gasto por mes en ${year}`}>
          {y.meses.map((m, i) => {
            const x = i * (bw + gap);
            const hv = sy(m.variables), hf = sy(m.fijos);
            const isCur = m.mes === month;
            return (
              <g key={m.mes} onClick={() => onPickMonth(m.mes)} class="bar-g">
                <rect x={x} y={top} width={bw} height={H - top - bottom} fill="transparent" />
                <rect x={x} y={H - bottom - hf} width={bw} height={hf} rx="2" class={`b-fijos ${isCur ? 'cur' : ''}`} />
                <rect x={x} y={H - bottom - hf - hv} width={bw} height={hv} rx="2" class={`b-var ${isCur ? 'cur' : ''}`} />
                <text x={x + bw / 2} y={H - 6} text-anchor="middle" class="bar-lbl">{LETRAS[i]}</text>
              </g>
            );
          })}
          {y.promedio > 0 && <line x1="0" x2={W} y1={avgY} y2={avgY} class="avg-line" />}
        </svg>
        <div class="legend small muted"><span class="dot var" /> Variables <span class="dot fijos" /> Fijos <span class="dot avgd" /> Promedio</div>
      </section>
      <div class="card list">
        <div class="li head small muted"><span>Mes</span><span>Gasto</span><span>Ahorro</span></div>
        {y.meses.filter(m => m.total || m.ahorro).map(m => (
          <button key={m.mes} class="li" onClick={() => onPickMonth(m.mes)}>
            <span>{NOMBRES[Number(m.mes.slice(5)) - 1]}</span>
            <span>{fmt(m.total, currency)}</span>
            <span class="muted">{m.ahorro ? fmt(m.ahorro, currency) : '—'}</span>
          </button>
        ))}
        {!y.total && <div class="li muted">Sin datos para {year}.</div>}
      </div>
    </div>
  );
}

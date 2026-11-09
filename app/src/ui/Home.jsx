import { monthSummary, cumulativeByDay } from '../../../src/core/aggregate.js';
import { Chart } from './Chart.jsx';
import { fmt, monthLabel, shiftMonth } from './format.js';

export function Home({ state, month, currency, go, isCurrentMonth }) {
  const s = monthSummary(state.movs, state.categorias, month, currency);
  const prevMonth = shiftMonth(month, -1);
  const cur = cumulativeByDay(state.movs, state.categorias, month, currency);
  const prev = cumulativeByDay(state.movs, state.categorias, prevMonth, currency);
  const today = isCurrentMonth ? new Date().getDate() : cur.length;
  const prevSameDay = prev[Math.min(today, prev.length) - 1] || 0;
  const delta = prevSameDay ? Math.round(((cur[today - 1] - prevSameDay) / prevSameDay) * 100) : null;
  const sinLeer = state.movs.length === 0;

  return (
    <div class="screen">
      {s.pendientes > 0 && (
        <button class="card pending" onClick={() => go('revisar')}>
          <span class="pending-n">{s.pendientes}</span>
          <span>{s.pendientes === 1 ? 'movimiento para revisar' : 'movimientos para revisar'}</span>
          <span class="chev">›</span>
        </button>
      )}
      <section class="card hero">
        <div class="muted">Gastado en {monthLabel(month)}</div>
        <div class="big">{fmt(s.total, currency)}</div>
        {delta !== null && (
          <div class="muted small">
            {delta === 0 ? 'Igual que' : `${Math.abs(delta)}% ${delta > 0 ? 'más' : 'menos'} que`} a esta altura de {monthLabel(prevMonth).split(' ')[0]}
          </div>
        )}
        <Chart current={cur} previous={prev} today={today} />
        <div class="legend small muted"><span class="dot cur" /> Este mes <span class="dot prev" /> Mes anterior</div>
      </section>
      <div class="row2">
        <button class="card stat" onClick={() => go('categorias', { grupo: 'Fijos' })}><div class="muted small">Fijos</div><div class="mid">{fmt(s.porGrupo.Fijos, currency)}</div></button>
        <button class="card stat" onClick={() => go('categorias', { grupo: 'Variables' })}><div class="muted small">Variables</div><div class="mid">{fmt(s.porGrupo.Variables, currency)}</div></button>
      </div>
      <section class="card">
        <div class="muted small">Ahorro e inversión del mes</div>
        <div class="mid">{fmt(s.ahorro, currency)}</div>
      </section>
      <section class="card">
        <div class="muted small">Cómo se clasificó este mes</div>
        <div class="bar">
          <span style={{ width: `${s.metric.reglas}%` }} class="b-rules" />
          <span style={{ width: `${s.metric.manual}%` }} class="b-manual" />
          <span style={{ width: `${s.metric.pendiente}%` }} class="b-pend" />
        </div>
        <div class="small muted">{s.metric.reglas}% automático · {s.metric.manual}% a mano · {s.metric.pendiente}% pendiente</div>
      </section>
      {sinLeer && <p class="muted center">Todavía no hay movimientos. Corré "Finanzas → Reconstruir historial" en la planilla.</p>}
    </div>
  );
}

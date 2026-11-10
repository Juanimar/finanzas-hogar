import { monthSummary, yearSummary, cumulativeByDay, unreadMailCount } from '../../../src/core/aggregate.js';
import { Chart } from './Chart.jsx';
import { fmt, monthLabel, shiftMonth } from './format.js';

const LETRAS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// Una sola pantalla de resumen: misma estructura para el mes y para el año.
export function Resumen({ state, month, mode, currency, go, isCurrentMonth, onPickMonth }) {
  const esMes = mode === 'mes';
  const year = month.slice(0, 4);
  const s = esMes ? monthSummary(state.movs, state.categorias, month, currency) : yearSummary(state.movs, state.categorias, year, currency);
  const pendientes = state.movs.filter(m => m.revisado === false).length;
  const noLeidos = unreadMailCount(state.logs || [], new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10));
  const periodo = esMes ? monthLabel(month) : year;
  const topCats = s.porCategoria.filter(c => c.total > 0).slice(0, 6);
  const maxCat = Math.max(1, ...topCats.map(c => c.total));

  return (
    <div class="screen">
      {noLeidos > 0 && (
        <div class="card warn small">
          {noLeidos === 1 ? '1 mail de Itaú no se pudo leer' : `${noLeidos} mails de Itaú no se pudieron leer`}. Están en Gmail con la etiqueta <b>Finanzas/Revisar</b>; cargalos con el botón + y avisá para ajustar el lector.
        </div>
      )}
      {pendientes > 0 && (
        <button class="card pending" onClick={() => go('revisar')}>
          <span class="pending-n">{pendientes}</span>
          <span>{pendientes === 1 ? 'movimiento para revisar' : 'movimientos para revisar'}</span>
          <span class="chev">›</span>
        </button>
      )}

      <section class="card hero">
        <div class="muted">Gastado en {periodo}</div>
        <div class="big">{fmt(s.total, currency)}</div>
        {esMes ? <MonthChart state={state} month={month} currency={currency} isCurrentMonth={isCurrentMonth} />
               : <YearBars y={s} month={month} currency={currency} onPickMonth={onPickMonth} />}
      </section>

      <div class="row2">
        <button class="card stat" onClick={() => esMes && go('categorias', { grupo: 'Fijos' })}><div class="muted small">Fijos</div><div class="mid">{fmt(s.porGrupo.Fijos || 0, currency)}</div></button>
        <button class="card stat" onClick={() => esMes && go('categorias', { grupo: 'Variables' })}><div class="muted small">Variables</div><div class="mid">{fmt(s.porGrupo.Variables || 0, currency)}</div></button>
      </div>
      <div class="row2">
        <section class="card"><div class="muted small">Ingresos</div><div class="mid">{s.ingresos ? fmt(s.ingresos, currency) : '—'}</div>{!s.ingresos && <div class="small muted">Cargalos con +</div>}</section>
        <section class="card"><div class="muted small">Ahorro e inversión</div><div class="mid">{fmt(s.ahorro, currency)}</div>{s.tasaAhorro !== null && <div class="small muted">{s.tasaAhorro}% de los ingresos</div>}</section>
      </div>

      {topCats.length > 0 && (
        <section class="card">
          <div class="muted small">En qué se fue</div>
          {topCats.map(c => (
            <button key={c.categoria} class="catrow" onClick={() => esMes && go('categorias', { grupo: c.grupo })}>
              <span class="catname">{c.categoria}</span>
              <span class="cattrack"><span class="catfill" style={{ width: `${(c.total / maxCat) * 100}%` }} /></span>
              <span class="catamt">{fmt(c.total, currency)}</span>
            </button>
          ))}
        </section>
      )}

      {esMes && s.metric && (
        <section class="card">
          <div class="muted small">Cómo se clasificó este mes</div>
          <div class="bar">
            <span style={{ width: `${s.metric.reglas}%` }} class="b-rules" />
            <span style={{ width: `${s.metric.manual}%` }} class="b-manual" />
            <span style={{ width: `${s.metric.pendiente}%` }} class="b-pend" />
          </div>
          <div class="small muted">{s.metric.reglas}% automático · {s.metric.manual}% a mano · {s.metric.pendiente}% pendiente</div>
        </section>
      )}
      {state.movs.length === 0 && <p class="muted center">Todavía no hay movimientos. Corré "Finanzas → Reconstruir historial" en la planilla.</p>}
    </div>
  );
}

function MonthChart({ state, month, currency, isCurrentMonth }) {
  const prevMonth = shiftMonth(month, -1);
  const cur = cumulativeByDay(state.movs, state.categorias, month, currency);
  const prev = cumulativeByDay(state.movs, state.categorias, prevMonth, currency);
  const today = isCurrentMonth ? new Date().getDate() : cur.length;
  const prevSameDay = prev[Math.min(today, prev.length) - 1] || 0;
  const delta = prevSameDay ? Math.round(((cur[today - 1] - prevSameDay) / prevSameDay) * 100) : null;
  return (
    <>
      {delta !== null && (
        <div class="muted small">
          {delta === 0 ? 'Igual que' : `${Math.abs(delta)}% ${delta > 0 ? 'más' : 'menos'} que`} a esta altura de {monthLabel(prevMonth).split(' ')[0]}
        </div>
      )}
      <Chart current={cur} previous={prev} today={today} />
      <div class="legend small muted"><span class="dot cur" /> Este mes <span class="dot prev" /> Mes anterior</div>
    </>
  );
}

function YearBars({ y, month, currency, onPickMonth }) {
  const W = 336, H = 170, top = 10, bottom = 22, gap = 6;
  const max = Math.max(1, ...y.meses.map(m => m.total));
  const bw = (W - gap * 11) / 12;
  const sy = v => ((H - top - bottom) * v) / max;
  const avgY = H - bottom - sy(y.promedio);
  return (
    <>
      <div class="muted small">Promedio mensual {fmt(y.promedio, currency)} · tocá un mes para verlo</div>
      <svg viewBox={`0 0 ${W} ${H}`} class="bars" role="img" aria-label="Gasto por mes">
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
    </>
  );
}

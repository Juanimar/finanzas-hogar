import { useState } from 'preact/hooks';
import { depositosInversiones, balancesInversiones } from '../../../src/core/inversiones.js';
import { resumenInversion, historialCartera, referenciasPlanilla } from '../../../src/core/rendimiento.js';
import { pdfRows } from '../../../src/core/pdf.js';
import { parseMaiorano } from '../../../src/core/maiorano.js';
import { fmt, dayLabel } from './format.js';

const usd0 = n => fmt(Math.round(n), 'USD').replace(/,00$/, '');
const pct = (x, d = 1) => `${(x * 100).toFixed(d).replace('.', ',')}%`;
const fechaLarga = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });

export function Inversiones({ state, store }) {
  const [subiendo, setSubiendo] = useState(null); // { estado: 'leyendo'|'listo'|'error', reporte?, error? }
  const depositos = depositosInversiones(state.inversiones || []);
  const historial = historialCartera(state.posiciones || [], balancesInversiones(state.inversiones || []));
  const ultimo = historial.at(-1);
  const ultimoReporte = [...historial].reverse().find(h => h.detalle);
  const refs = referenciasPlanilla(state.inversiones || []).filter(r => !/portafolio/i.test(r.nombre));

  async function leerArchivo(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    setSubiendo({ estado: 'leyendo' });
    try {
      const reporte = parseMaiorano(pdfRows(new Uint8Array(await file.arrayBuffer())));
      setSubiendo({ estado: 'listo', reporte });
    } catch (err) {
      setSubiendo({ estado: 'error', error: err.message || 'No pude leer el archivo' });
    }
  }

  const boton = (
    <label class="primary upload">
      Subir reporte de Maiorano (PDF)
      <input type="file" accept="application/pdf,.pdf" onChange={leerArchivo} hidden />
    </label>
  );

  return (
    <div class="screen">
      {subiendo?.estado === 'leyendo' && <div class="card small muted">Leyendo el reporte…</div>}
      {subiendo?.estado === 'error' && <div class="card warn small">{subiendo.error}. Bajá el reporte "Posición" desde el portal de Maiorano y probá de nuevo.</div>}
      {subiendo?.estado === 'listo' && (
        <div class="card">
          <div class="muted small">Reporte al {fechaLarga(subiendo.reporte.fecha)}</div>
          <div class="mid">{usd0(subiendo.reporte.total)}</div>
          <div class="small muted">{subiendo.reporte.tenencias.length} instrumentos · efectivo {usd0(subiendo.reporte.efectivo)}</div>
          <div class="row-btns">
            <button class="ghost" onClick={() => setSubiendo(null)}>Cancelar</button>
            <button class="primary" onClick={() => { store.guardarPosicion(subiendo.reporte); setSubiendo(null); }}>Guardar</button>
          </div>
        </div>
      )}

      {!ultimo ? (
        <div class="card center">
          <p>Todavía no hay datos de la cartera.</p>
          <p class="small muted">Bajá el reporte "Posición" del portal de Maiorano y subilo acá.</p>
          {boton}
        </div>
      ) : (
        <Cartera ultimo={ultimo} reporte={ultimoReporte} depositos={depositos} historial={historial} refs={refs}
          boton={boton} />
      )}
    </div>
  );
}

function Cartera({ ultimo, reporte, depositos, historial, refs, boton }) {
  const r = resumenInversion(depositos, ultimo);
  const det = reporte?.detalle;
    const proximos = (det?.cupones || []).filter(c => c.fecha >= new Date().toISOString().slice(0, 10));
  const totalCupones = proximos.reduce((a, c) => a + c.usd, 0);
  const comp = [...(det?.composicion || [])].sort((a, b) => b.usd - a.usd);
  const maxComp = Math.max(1, ...comp.map(c => c.usd));

  return (
    <>
      <section class="card hero">
        <div class="muted">Cartera Maiorano · {fechaLarga(ultimo.fecha)}</div>
        <div class="big">{usd0(r.total)}</div>
        <div class="small">
          <span class={r.ganancia >= 0 ? 'pos' : 'neg'}>{r.ganancia >= 0 ? '+' : '−'}{usd0(Math.abs(r.ganancia))} ({r.gananciaPct?.toFixed(1).replace('.', ',')}%)</span>
          <span class="muted"> sobre {usd0(r.aportado)} aportados</span>
        </div>
        <Evolucion historial={historial} depositos={depositos} />
      </section>

      <div class="row2">
        <section class="card">
          <div class="muted small">Rendimiento anual</div>
          <div class="mid">{r.mwrr != null ? pct(r.mwrr) : '—'}</div>
          <div class="small muted">ponderado por cada depósito</div>
        </section>
        <section class="card">
          <div class="muted small">Cupones por año</div>
          <div class="mid">{totalCupones ? usd0(totalCupones) : '—'}</div>
          {totalCupones > 0 && <div class="small muted">{((totalCupones / r.total) * 100).toFixed(1).replace('.', ',')}% de la cartera</div>}
        </section>
      </div>

      {refs.length > 0 && r.mwrr != null && (
        <section class="card">
          <div class="muted small">Comparado con (tasas de tu planilla)</div>
          {[{ nombre: 'Tu cartera', tasa: r.mwrr, propia: true }, ...refs].map(x => (
            <div key={x.nombre} class="refrow"><span class={x.propia ? 'strong' : ''}>{x.nombre}</span><span class={x.propia ? 'strong' : ''}>{pct(x.tasa)}</span></div>
          ))}
        </section>
      )}

      {comp.length > 0 && (
        <section class="card">
          <div class="muted small">En qué está invertido</div>
          {comp.map(c => (
            <div key={c.tipo} class="catrow">
              <span class="catname">{c.tipo}</span>
              <span class="cattrack"><span class="catfill" style={{ width: `${(c.usd / maxComp) * 100}%` }} /></span>
              <span class="catamt">{c.pct.toFixed(0)}%</span>
            </div>
          ))}
        </section>
      )}

      {det?.tenencias?.length > 0 && (
        <section class="card">
          <div class="muted small">Tus instrumentos · valor y resultado vs. lo pagado</div>
          {det.tenencias.filter(t => t.valor > 1).sort((a, b) => b.valor - a.valor).map(t => (
            <div key={t.nombre} class="tenencia">
              <span class="tn">{t.nombre}</span>
              <span class="tv">{usd0(t.valor)}{t.costo ? <span class={`small ${t.valor >= t.costo ? 'pos' : 'neg'}`}> {t.valor >= t.costo ? '+' : '−'}{(Math.abs(t.valor / t.costo - 1) * 100).toFixed(0)}%</span> : null}</span>
            </div>
          ))}
        </section>
      )}

      {proximos.length > 0 && (
        <section class="card">
          <div class="muted small">Cupones próximos 12 meses · {usd0(totalCupones)}</div>
          {proximos.slice(0, 4).map((c, i) => (
            <div key={i} class="refrow small"><span class="tn">{dayLabel(c.fecha)} · {c.valor}</span><span>{fmt(c.usd, 'USD')}</span></div>
          ))}
        </section>
      )}

      <div class="center">{boton}</div>
      {!reporte && <p class="small muted center">Subí un reporte para ver la composición, los instrumentos y los cupones.</p>}
    </>
  );
}

// Valor de la cartera vs. lo aportado, en el tiempo.
function Evolucion({ historial, depositos }) {
  if (historial.length < 2) return null;
  const W = 336, H = 150, padL = 4, padR = 4, top = 12, bottom = 18;
  const t0 = Date.parse(historial[0].fecha), t1 = Date.parse(historial.at(-1).fecha);
  const aportadoA = f => depositos.filter(d => d.fecha <= f).reduce((a, d) => a + d.usd, 0);
  const puntos = historial.map(h => ({ ...h, aportado: aportadoA(h.fecha) }));
  const max = Math.max(...puntos.map(p => Math.max(p.total, p.aportado)));
  const min = Math.min(...puntos.map(p => Math.min(p.total, p.aportado))) * 0.95;
  const sx = f => padL + ((Date.parse(f) - t0) / Math.max(1, t1 - t0)) * (W - padL - padR);
  const sy = v => top + (1 - (v - min) / Math.max(1, max - min)) * (H - top - bottom);
  const line = k => puntos.map((p, i) => `${i ? 'L' : 'M'}${sx(p.fecha).toFixed(1)},${sy(p[k]).toFixed(1)}`).join(' ');
  const mes = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-UY', { month: 'short', year: '2-digit' });
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} class="evol" role="img" aria-label="Valor de la cartera y lo aportado en el tiempo">
        <path d={line('aportado')} class="ln-aport" />
        <path d={line('total')} class="ln-valor" />
        {puntos.map(p => (
          <g key={p.fecha}>
            <circle cx={sx(p.fecha)} cy={sy(p.total)} r="12" fill="transparent"><title>{`${mes(p.fecha)} · valor ${usd0(p.total)} · aportado ${usd0(p.aportado)}`}</title></circle>
            <circle cx={sx(p.fecha)} cy={sy(p.total)} r="3" class="pt-valor" />
          </g>
        ))}
        <text x={padL} y={H - 4} class="bar-lbl" text-anchor="start">{mes(historial[0].fecha)}</text>
        <text x={W - padR} y={H - 4} class="bar-lbl" text-anchor="end">{mes(historial.at(-1).fecha)}</text>
      </svg>
      <div class="legend small muted"><span class="lg"><span class="sw" style={{ background: '#2a78d6' }} />Valor</span><span class="lg"><span class="sw dash" />Aportado</span></div>
    </>
  );
}

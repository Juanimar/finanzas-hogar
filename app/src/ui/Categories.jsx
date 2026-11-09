import { monthSummary, merchantTotals } from '../../../src/core/aggregate.js';
import { fmt } from './format.js';
import { MovList } from './Movements.jsx';

export function Categories({ state, month, currency, params, go, onOpenMov }) {
  if (params.categoria && params.comercio) {
    const movs = state.movs.filter(m => m.categoria === params.categoria && (m.descripcion || m.comercio || '(sin nombre)') === params.comercio && String(m.fecha).startsWith(month));
    return <div class="screen"><Back onClick={() => go('categorias', { categoria: params.categoria })} label={params.categoria} /><h2>{params.comercio}</h2><MovList movs={movs} currency={currency} onOpen={onOpenMov} /></div>;
  }
  if (params.categoria) {
    const rows = merchantTotals(state.movs, state.categorias, params.categoria, month, currency);
    return (
      <div class="screen">
        <Back onClick={() => go('categorias')} label="Categorías" />
        <h2>{params.categoria}</h2>
        <div class="card list">
          <div class="li head small muted"><span>Comercio</span><span>Mes</span><span>Año</span></div>
          {rows.map(r => (
            <button key={r.comercio} class="li" onClick={() => go('categorias', { categoria: params.categoria, comercio: r.comercio })}>
              <span>{r.comercio}</span><span>{fmt(r.mes, currency)}</span><span class="muted">{fmt(r.anio, currency)}</span>
            </button>
          ))}
          {!rows.length && <div class="li muted">Sin gastos este año.</div>}
        </div>
      </div>
    );
  }
  const s = monthSummary(state.movs, state.categorias, month, currency);
  const grupos = params.grupo ? [params.grupo] : ['Fijos', 'Variables'];
  return (
    <div class="screen">
      {grupos.map(g => {
        const cats = s.porCategoria.filter(c => c.grupo === g);
        return (
          <section key={g}>
            <h3>{g} <span class="muted">{fmt(s.porGrupo[g], currency)}</span></h3>
            <div class="card list">
              {cats.map(c => (
                <button key={c.categoria} class="li" onClick={() => go('categorias', { categoria: c.categoria })}>
                  <span>{c.categoria}</span>
                  <span class="barcell"><i style={{ width: `${s.porGrupo[g] ? (c.total / s.porGrupo[g]) * 100 : 0}%` }} /></span>
                  <span>{fmt(c.total, currency)}</span>
                </button>
              ))}
              {!cats.length && <div class="li muted">Sin gastos.</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const Back = ({ onClick, label }) => <button class="back" onClick={onClick}>‹ {label}</button>;

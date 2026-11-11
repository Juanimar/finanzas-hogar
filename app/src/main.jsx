import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { createStore } from './store.js';
import { sheetsClient } from './sheets.js';
import { demoClient } from './demo.js';
import { savedToken, signIn, signOut } from './auth.js';
import { Resumen } from './ui/Resumen.jsx';
import { Review } from './ui/Review.jsx';
import { Categories } from './ui/Categories.jsx';
import { Movements } from './ui/Movements.jsx';
import { Editor } from './ui/Editor.jsx';
import { NewEntry } from './ui/NewEntry.jsx';
import { Sheet } from './ui/Sheet.jsx';
import { monthLabel, shiftMonth, fmt, cap, ownOrig } from './ui/format.js';
import './styles.css';

const DEMO = new URLSearchParams(location.search).has('demo');
const thisMonth = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 7);
const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };

function Login({ onToken, error }) {
  const [err, setErr] = useState(error);
  return (
    <div class="login">
      <h1>Finanzas del Hogar</h1>
      <p class="muted">Juani &amp; Mili</p>
      <button class="primary" onClick={async () => { try { onToken(await signIn()); } catch (e) { setErr(e.message); } }}>Entrar con Google</button>
      {err && <p class="error">{err}</p>}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(DEMO ? { access: 'demo', email: 'demo' } : savedToken());
  const [authError, setAuthError] = useState(null);
  const store = useMemo(() => (token ? createStore(DEMO ? demoClient() : sheetsClient(() => token.access)) : null), [token]);
  const [state, setState] = useState(store?.get());
  const [view, setView] = useState({ name: 'resumen', params: {} });
  const [month, setMonth] = useState(thisMonth());
  const [mode, setMode] = useState(pref('fh.modo', 'mes'));
  const [currency, setCurrency] = useState(pref('fh.currency', 'UYU'));
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!store) return;
    const off = store.subscribe(setState);
    store.load().catch(async e => {
      if (e.code === 401) { try { setToken(await signIn({ silent: true })); } catch { signOut(); setToken(null); setAuthError('Volvé a entrar.'); } }
    });
    return off;
  }, [store]);

  if (!token) return <Login onToken={setToken} error={authError} />;
  if (!state || state.loading) return <div class="login"><p class="muted">Cargando…</p></div>;

  const go = (name, params = {}) => { setView({ name, params }); window.scrollTo(0, 0); };
  const toggleCurrency = () => { const c = currency === 'UYU' ? 'USD' : 'UYU'; setCurrency(c); try { localStorage.setItem('fh.currency', c); } catch {} };
  const setModo = m => { setMode(m); try { localStorage.setItem('fh.modo', m); } catch {} };
  const anual = view.name === 'resumen' && mode === 'anio';
  const step = anual ? 12 : 1;
  const pend = state.movs.filter(m => m.revisado === false).length;
  const common = { state, store, month, currency, go, params: view.params, onOpen: setDetail, onOpenMov: setDetail, isCurrentMonth: month === thisMonth() };

  return (
    <div class="app">
      <header>
        {view.name === 'resumen' && (
          <div class="seg" role="tablist">
            <button role="tab" class={mode === 'mes' ? 'on' : ''} onClick={() => setModo('mes')}>Mes</button>
            <button role="tab" class={mode === 'anio' ? 'on' : ''} onClick={() => setModo('anio')}>Año</button>
          </div>
        )}
        <button class="ghost" onClick={() => setMonth(shiftMonth(month, -step))} aria-label={anual ? 'Año anterior' : 'Mes anterior'}>‹</button>
        <button class="month" onClick={() => setMonth(thisMonth())}>{anual ? month.slice(0, 4) : cap(monthLabel(month)).replace(' de ', ' ')}</button>
        <button class="ghost" onClick={() => setMonth(shiftMonth(month, step))} aria-label={anual ? 'Año siguiente' : 'Mes siguiente'}>›</button>
        <button class="cur" onClick={toggleCurrency}>{currency === 'UYU' ? '$' : 'US$'}</button>
      </header>
      {state.error && <div class="toast" onClick={store.clearError}>{state.error} · tocá para cerrar</div>}
      {view.name === 'resumen' && <Resumen {...common} mode={mode} onPickMonth={m => { setMonth(m); setModo('mes'); window.scrollTo(0, 0); }} />}
      {view.name === 'revisar' && <Review {...common} />}
      {view.name === 'categorias' && <Categories {...common} />}
      {view.name === 'movs' && <Movements {...common} />}
      {view.name !== 'revisar' && <button class="fab" onClick={() => setAdding(true)} aria-label="Agregar gasto">+</button>}
      <nav>
        {[['resumen', 'Resumen'], ['revisar', `Revisar${pend ? ` (${pend})` : ''}`], ['categorias', 'Categorías'], ['movs', 'Movim.']].map(([k, l]) => (
          <button key={k} class={view.name === k ? 'on' : ''} onClick={() => go(k)}>{l}</button>
        ))}
      </nav>
      {detail && (
        <Sheet title={`${detail.descripcion || detail.comercio_raw} · ${fmt(ownOrig(detail), detail.moneda)}`} onClose={() => setDetail(null)}>
          <p class="small muted">{detail.fecha} · {detail.medio} · {detail.comercio_raw || `${detail.banco_destino} ${detail.cuenta_destino}`}</p>
          <Editor mov={detail} categorias={state.categorias} saveLabel="Guardar" onSave={edit => { store.review(detail, edit); setDetail(null); }} />
        </Sheet>
      )}
      {adding && <Sheet title="Nuevo gasto" onClose={() => setAdding(false)}><NewEntry state={state} store={store} onDone={() => setAdding(false)} /></Sheet>}
    </div>
  );
}

render(<App />, document.getElementById('app'));
if ('serviceWorker' in navigator && !DEMO && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');

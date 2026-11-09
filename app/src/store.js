import { learnFromEdit } from '../../src/core/learn.js';
import { applyToSimilar, classify } from '../../src/core/classify.js';
import { normalizeComercio } from '../../src/core/normalize.js';
import { pickRate, computeAmounts } from '../../src/core/money.js';
import { nowMontevideoIso } from '../../src/core/dates.js';

export function createStore(client) {
  let state = { loading: true, error: null, movs: [], reglas: [], cuentas: [], categorias: [], cotizaciones: [] };
  const subs = new Set();
  const set = patch => { state = { ...state, ...patch }; subs.forEach(f => f(state)); };

  async function upsert(key, list, obj, match) {
    const i = list.findIndex(match);
    if (i >= 0 && list[i]._row) {
      const merged = { ...list[i], ...obj, _row: list[i]._row };
      await client.updateRows(key, [merged]);
      return list.map((x, j) => (j === i ? merged : x));
    }
    const [added] = await client.appendRows(key, [obj]);
    return [...list, added];
  }

  async function guard(fn) {
    try { await fn(); } catch (e) { set({ error: e.message }); if (e.code === 401) throw e; }
  }

  return {
    get: () => state,
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    clearError: () => set({ error: null }),

    async load() {
      set({ loading: true, error: null });
      try {
        const [movs, reglas, cuentas, categorias, cotizaciones] = await Promise.all(
          ['movimientos', 'reglas', 'cuentas', 'categorias', 'cotizaciones'].map(k => client.readTab(k)),
        );
        set({
          loading: false, movs, reglas, cuentas, cotizaciones,
          categorias: categorias.filter(c => c.activa !== false).sort((a, b) => a.orden - b.orden),
        });
      } catch (e) { set({ loading: false, error: e.message }); if (e.code === 401) throw e; }
    },

    /** Confirm or correct a movement; learns a rule/account and resolves similar pending ones. */
    async review(mov, edit) {
      await guard(async () => {
        const now = nowMontevideoIso();
        const { reglaUpsert, cuentaUpsert } = learnFromEdit(mov, edit, state, now);
        let { reglas, cuentas } = state;
        if (reglaUpsert) reglas = await upsert('reglas', reglas, reglaUpsert, r => r.tipo === 'exacta' && r.patron === reglaUpsert.patron);
        if (cuentaUpsert) cuentas = await upsert('cuentas', cuentas, cuentaUpsert, c => String(c.numero) === cuentaUpsert.numero);

        const changedSomething = ['categoria', 'quien', 'descripcion'].some(k => edit[k] !== undefined && edit[k] !== mov[k]);
        const updated = {
          ...mov,
          categoria: edit.categoria ?? mov.categoria,
          quien: edit.quien ?? mov.quien,
          descripcion: edit.descripcion || edit.nombreCuenta || mov.descripcion,
          nota: edit.nota ?? mov.nota,
          clasificado_por: changedSomething || mov.clasificado_por === 'pendiente' ? 'manual' : mov.clasificado_por,
          revisado: true,
          bloqueado: mov.bloqueado || changedSomething,
          modificado: now,
        };
        const others = state.movs.filter(m => m.id !== mov.id);
        const similar = applyToSimilar(others, reglas, cuentas).map(m => ({ ...m, modificado: now }));
        const byId = new Map([updated, ...similar].map(m => [m.id, m]));
        set({ reglas, cuentas, movs: state.movs.map(m => byId.get(m.id) || m) });
        await client.updateRows('movimientos', [...byId.values()]);
      });
    },

    suggest(descripcion) {
      const c = classify({ tipo: 'manual', descripcion, medio: 'Efectivo' }, state);
      return c.clasificado_por === 'pendiente' ? null : c;
    },

    async addManual({ fecha, monto, moneda, descripcion, categoria, quien }) {
      await guard(async () => {
        const now = nowMontevideoIso();
        const rate = pickRate(state.cotizaciones, fecha)?.usd_uyu || '';
        const mov = {
          id: `man-${Date.now().toString(36)}`, fecha, tipo: 'manual', medio: 'Efectivo', comercio_raw: descripcion,
          comercio: normalizeComercio(descripcion), cuenta_destino: '', banco_destino: '', descripcion,
          monto_orig: Number(monto), moneda, cotizacion: rate, ...computeAmounts(Number(monto), moneda, rate),
          categoria, quien, clasificado_por: 'manual', revisado: true, bloqueado: true, origen: 'manual',
          nota: '', creado: now, modificado: now,
        };
        const [added] = await client.appendRows('movimientos', [mov]);
        const { reglaUpsert } = learnFromEdit({ ...mov, categoria: undefined }, { categoria, descripcion }, state, now);
        let { reglas } = state;
        if (reglaUpsert) reglas = await upsert('reglas', reglas, reglaUpsert, r => r.tipo === 'exacta' && r.patron === reglaUpsert.patron);
        set({ reglas, movs: [...state.movs, added] });
      });
    },
  };
}

import { describe, it, expect } from 'vitest';
import { createStore } from '../../app/src/store.js';
import { SEED_CATEGORIAS } from '../../src/core/seed.js';

function slowClient(db) {
  const appended = [];
  const wait = () => new Promise(r => setTimeout(r, 5));
  return {
    appended,
    readTab: async k => (db[k] || []).map(x => ({ ...x })),
    updateRows: async () => { await wait(); },
    appendRows: async (k, objs) => { await wait(); appended.push(...objs.map(o => ({ k, ...o }))); return objs.map((o, i) => ({ ...o, _row: 100 + appended.length + i })); },
  };
}

describe('store.review', () => {
  it('two quick reviews of the same merchant create one rule', async () => {
    const mov = id => ({ id, _row: 2, tipo: 'consumo_debito', medio: 'Débito 2222', comercio: 'KIOSCO PEPE', comercio_raw: 'KIOSCO PEPE', categoria: 'Otros', clasificado_por: 'pendiente', revisado: false, quien: 'Compartido' });
    const c = slowClient({ movimientos: [mov('a'), { ...mov('b'), _row: 3 }], categorias: SEED_CATEGORIAS });
    const store = createStore(c);
    await store.load();
    const [a, b] = store.get().movs;
    await Promise.all([store.review(a, { categoria: 'Casa' }), store.review(b, { categoria: 'Casa' })]);
    expect(c.appended.filter(x => x.k === 'reglas')).toHaveLength(1);
    expect(store.get().movs.every(m => m.revisado)).toBe(true);
  });
});

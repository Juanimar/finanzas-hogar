// In-memory client with fake data for ?demo=1 (UI testing without Google).
import { SEED_CATEGORIAS, SEED_REGLAS } from '../../src/core/seed.js';
import { buildMovimiento } from '../../src/core/pipeline.js';

export function demoClient() {
  const cuentas = [{ numero: '1111', tipo: 'tarjeta_propia', titular: 'Compartido' }, { numero: '7654321', tipo: 'propia_ahorro', nombre: 'OCA Blue' }];
  const reglas = SEED_REGLAS.map((r, i) => ({ id: `s${i}`, ...r }));
  const now = new Date();
  const ym = (d) => d.toISOString().slice(0, 7);
  const cur = ym(now);
  const prev = ym(new Date(now.getFullYear(), now.getMonth() - 1, 15));
  const raw = [
    ['MERPAGO*MACROMERCADO MONTE', 3251, 'UYU', 'consumo_credito'], ['DEVOTO EXPRESS VIS3', 832.71, 'UYU', 'consumo_debito'],
    ['DLO*PedidosYa Envio VIS3', 655, 'UYU', 'consumo_debito'], ['ANTHROPIC* CLAUDE SUB +1415', 20, 'USD', 'consumo_credito'],
    ['DLO*UBER*RIDES MONTE', 160.94, 'UYU', 'consumo_credito'], ['FROG MONTE', 1461, 'UYU', 'consumo_credito'],
    ['KIOSCO LA ESQUINA', 240, 'UYU', 'consumo_debito'], ['STARBUCKS COFFEE VIS3', 231.56, 'UYU', 'consumo_debito'],
    ['CENTENO VIS3', 380, 'UYU', 'consumo_debito'], ['FREDDO AROCENA VIS3', 344.26, 'UYU', 'consumo_debito'],
  ];
  const movs = [];
  let n = 0;
  for (const [month, factor] of [[prev, 1.1], [cur, 1]]) {
    raw.forEach(([c, m, mon, tipo], i) => {
      const day = String(1 + ((i * 3) % 27)).padStart(2, '0');
      movs.push(buildMovimiento({ id: `d${n++}`, fecha: `${month}-${day}`, tipo, medio: 'Visa 1111', comercio_raw: c, cuenta_destino: '', banco_destino: '', monto_orig: Math.round(m * factor * 100) / 100, moneda: mon }, { reglas, cuentas }, 40.2, 'demo'));
    });
  }
  movs.push(buildMovimiento({ id: `d${n++}`, fecha: `${cur}-02`, tipo: 'transferencia', medio: 'Cuenta 3333', comercio_raw: '', cuenta_destino: '1234567', banco_destino: 'Itau', monto_orig: 3040, moneda: 'UYU' }, { reglas, cuentas }, 40.2, 'demo'));
  movs.push(buildMovimiento({ id: `d${n++}`, fecha: `${cur}-01`, tipo: 'transferencia', medio: 'Cuenta 3333', comercio_raw: '', cuenta_destino: '7654321', banco_destino: 'OCA Blue', monto_orig: 140000, moneda: 'UYU' }, { reglas, cuentas }, 40.2, 'demo'));
  const db = {
    movimientos: movs, reglas, cuentas,
    categorias: SEED_CATEGORIAS, cotizaciones: [{ fecha: `${cur}-01`, usd_uyu: 40.2 }],
  };
  db.movimientos.forEach((m, i) => (m._row = i + 2));
  return {
    readTab: async k => db[k].map(x => ({ ...x })),
    updateRows: async () => {},
    appendRows: async (k, objs) => objs.map((o, i) => ({ ...o, _row: 1000 + i })),
  };
}

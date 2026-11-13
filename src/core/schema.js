// Column layout of the tabs the system owns (spec §5). Existing tabs are never touched.
export const TABS = {
  movimientos: {
    name: 'Movimientos',
    columns: [
      'id', 'fecha', 'tipo', 'medio', 'comercio_raw', 'comercio', 'cuenta_destino', 'banco_destino',
      'descripcion', 'monto_orig', 'moneda', 'cotizacion', 'monto_uyu', 'monto_usd', 'categoria', 'quien',
      'clasificado_por', 'revisado', 'bloqueado', 'origen', 'nota', 'creado', 'modificado', 'parte',
    ],
  },
  reglas: {
    name: 'Reglas',
    columns: ['id', 'tipo', 'patron', 'categoria', 'quien', 'descripcion', 'origen', 'usos', 'creada', 'modificada'],
  },
  cuentas: {
    name: 'Cuentas',
    columns: ['numero', 'banco', 'nombre', 'tipo', 'titular', 'categoria', 'quien'],
  },
  categorias: { name: 'Categorías', columns: ['nombre', 'grupo', 'orden', 'activa'] },
  cotizaciones: { name: 'Cotizaciones', columns: ['fecha', 'usd_uyu', 'fuente'] },
  log: { name: 'Log', columns: ['fecha_hora', 'nivel', 'evento', 'detalle', 'ref'] },
};

const BOOL = { TRUE: true, FALSE: false };

export function rowToObj(columns, row) {
  const o = {};
  columns.forEach((c, i) => {
    let v = row[i];
    if (v === undefined || v === null) v = '';
    if (typeof v === 'string' && v in BOOL) v = BOOL[v];
    o[c] = v;
  });
  return o;
}

export function objToRow(columns, obj) {
  return columns.map(c => {
    const v = obj[c];
    if (v === true) return 'TRUE';
    if (v === false) return 'FALSE';
    if (v === undefined || v === null) return '';
    return v;
  });
}

/**
 * Apps Script escribe con setValues, que interpreta "=…" como fórmula. Los textos que vienen de afuera
 * (mails, push, estados de cuenta) se escriben con apóstrofo para que queden como texto.
 * La app no lo necesita: escribe con valueInputOption RAW.
 */
export function celdaSegura(v) {
  if (typeof v !== 'string') return v;
  return /^[=+@]/.test(v) || /^-[^\d.,\s]/.test(v) ? `'${v}` : v;
}

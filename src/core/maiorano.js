// Reporte "Posición de Inversión" de Maiorano (PDF que Juani descarga del portal) → foto de la cartera.
// Entrada: filas de pdfRows() (celdas ordenadas de izquierda a derecha).

const NUM = /^-?[\d.]+,\d+$/;
const num = s => Number(String(s).replace(/\./g, '').replace(',', '.'));
const fecha = s => { const [d, m, y] = s.split('/'); return `20${y.slice(-2)}-${m}-${d}`; };
const cap = s => s.charAt(0) + s.slice(1).toLowerCase();
const TIPOS = { EF: 'Efectivo' };

export function parseMaiorano(filas) {
  const out = { fecha: null, total: null, efectivo: null, tipoCambio: null, tenencias: [], composicion: [], cupones: [] };
  let enInstrumentos = false;
  for (const f of filas) {
    const nums = f.filter(c => NUM.test(c)).map(num);
    const t0 = f[0] || '';
    if (/^Situaci.n de su cuenta al/.test(t0) && !out.fecha && /^\d\d\/\d\d\/\d\d$/.test(f[1] || '')) out.fecha = fecha(f[1]);
    else if (/^Total Posici.n/.test(t0)) out.total = nums.at(-1);
    else if (/^SubTotal Efectivo/.test(t0)) out.efectivo = nums.at(-1);
    else if (/^Tipo de Cambio/.test(t0)) out.tipoCambio = nums.at(-1);
    else if (/^Totales por Instrumento/.test(t0)) enInstrumentos = true;
    else if (enInstrumentos && t0 === 'w' && nums.length >= 2) {
      const codigo = f[1];
      const nombre = f.slice(2).find(c => !NUM.test(c));
      out.composicion.push({ tipo: TIPOS[codigo] || cap(nombre || codigo), usd: nums.at(-2), pct: nums.at(-1) });
    } else if (t0 === '7' && f[1] && nums.length >= 3) {
      // costo efectivo = primer importe después de "U"/"%", valor actual = anteúltimo, % cartera = último
      const iUnidad = f.findIndex((c, i) => i > 1 && (c === 'U' || c === '%' || c === 'N/A'));
      const costo = f.slice(iUnidad + 1).find(c => NUM.test(c));
      out.tenencias.push({ nombre: f[1], costo: costo ? num(costo) : null, valor: nums.at(-2), pct: nums.at(-1) });
    } else if (f[1] === 'CUPON' && /^\d\d\/\d\d\/\d\d$/.test(t0)) {
      out.cupones.push({ fecha: fecha(t0), valor: f[2], usd: nums[1] ?? nums[0] });
    } else if (t0 === 'x') enInstrumentos = false;
  }
  if (!out.fecha || out.total == null) throw new Error('El archivo no parece un reporte de posición de Maiorano');
  return out;
}

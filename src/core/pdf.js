// Lector mínimo de PDFs de texto simple (como el estado de cuenta VISA de Itaú: fuentes Courier
// WinAnsi, un string por línea con posición absoluta). No pretende leer cualquier PDF.
import { unzlibSync } from 'fflate';

const WIN_ANSI_80 = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ';

function latin1(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return s;
}

const winAnsi = code => (code >= 0x80 && code <= 0x9f ? WIN_ANSI_80[code - 0x80] : String.fromCharCode(code));

function unescapePdfString(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c !== '\\') { out += winAnsi(raw.charCodeAt(i)); continue; }
    const n = raw[++i];
    if (/[0-7]/.test(n)) {
      let oct = n;
      while (oct.length < 3 && /[0-7]/.test(raw[i + 1])) oct += raw[++i];
      out += winAnsi(parseInt(oct, 8) & 0xff);
    } else out += ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' })[n] ?? n;
  }
  return out;
}

function* streams(bytes) {
  const s = latin1(bytes);
  const re = /<<((?:(?!>>\s*stream)[\s\S])*?)>>\s*stream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const dict = m[1];
    const start = m.index + m[0].length;
    const len = /\/Length (\d+)(?!\s+\d+\s+R)/.exec(dict);
    const end = len ? start + Number(len[1]) : s.indexOf('endstream', start);
    re.lastIndex = Math.max(re.lastIndex, end);
    if (/\/Subtype\s*\/Image/.test(dict) || !/\/FlateDecode/.test(dict)) continue;
    try { yield latin1(unzlibSync(bytes.subarray(start, end))); } catch (e) { /* stream no comprimido o dañado */ }
  }
}

/** Celdas de texto con su posición, agrupadas por página (cada stream de contenido es una página). */
export function pdfTextItems(bytes) {
  const pages = [];
  for (const content of streams(bytes)) {
    const items = [];
    // Tokenizador secuencial: los strings se consumen enteros, así "ET"/"BT" dentro del texto no cortan nada.
    let x = 0, y = 0;
    const tok = /\(((?:\\[\s\S]|[^\\)])*)\)\s*Tj|(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+Tm|(-?[\d.]+)\s+(-?[\d.]+)\s+T[dD]\b|\bBT\b/g;
    for (const t of content.matchAll(tok)) {
      if (t[1] !== undefined) items.push({ y, x, text: unescapePdfString(t[1]) });
      else if (t[2] !== undefined) { x = Number(t[6]); y = Number(t[7]); }
      else if (t[8] !== undefined) { x += Number(t[8]); y += Number(t[9]); }
      else { x = 0; y = 0; }
    }
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    if (items.length) pages.push(items);
  }
  return pages;
}

/** Devuelve los textos del PDF, de arriba hacia abajo dentro de cada página. */
export function pdfTextLines(bytes) {
  return pdfTextItems(bytes).flatMap(items => items.map(i => i.text));
}

/** Filas de una tabla: celdas con (casi) la misma altura, ordenadas de izquierda a derecha. */
export function pdfRows(bytes, tolerancia = 2) {
  const rows = [];
  for (const items of pdfTextItems(bytes)) {
    let fila = null;
    for (const it of items) {
      if (!fila || Math.abs(fila.y - it.y) > tolerancia) { fila = { y: it.y, cells: [] }; rows.push(fila); }
      fila.cells.push({ x: it.x, text: it.text.trim() });
    }
  }
  return rows.map(r => r.cells.sort((a, b) => a.x - b.x).map(c => c.text).filter(Boolean)).filter(r => r.length);
}

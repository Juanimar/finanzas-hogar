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

/** Devuelve los textos del PDF, de arriba hacia abajo dentro de cada página. */
export function pdfTextLines(bytes) {
  const out = [];
  for (const content of streams(bytes)) {
    const items = [];
    for (const bt of content.match(/BT[\s\S]*?ET/g) || []) {
      let x = 0, y = 0;
      const tok = /(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) Tm|(-?[\d.]+) (-?[\d.]+) T[dD]|\(((?:\\[\s\S]|[^\\)])*)\)\s*Tj/g;
      for (const t of bt.matchAll(tok)) {
        if (t[1] !== undefined) { x = Number(t[5]); y = Number(t[6]); }
        else if (t[7] !== undefined) { x += Number(t[7]); y += Number(t[8]); }
        else items.push({ y, x, text: unescapePdfString(t[9]) });
      }
    }
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    out.push(...items.map(i => i.text));
  }
  return out;
}

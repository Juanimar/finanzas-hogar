// Words that carry no merchant identity. Never used as rule tokens.
export const STOPWORDS = new Set([
  'MERPAGO', 'DLO', 'PAYU', 'MP', 'PAYPAL', 'MONTE', 'MONTEVIDEO', 'VIS3', 'UY', 'URY', 'URUGUAY',
  'ENVIO', 'PAGO', 'PAGOS', 'COMPRA', 'SA', 'SRL', 'LTDA', 'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y',
  'WWW', 'COM', 'SUC', 'SUCURSAL', 'POS',
  'EXPRESS', 'SHOP', 'STORE', 'MARKET', 'ONLINE', 'CENTER', 'CENTRO', 'TIENDA', 'LOCAL', 'SERVICIOS',
  'URUGUAYA', 'INTERNACIONAL', 'GROUP', 'COMPANY', 'PLAZA', 'SHOPPING', 'CARRASCO', 'POCITOS',
]);

const PREFIX = /^(MERPAGO|DLO|PAYU|MP|PAYPAL|SQ)\s*\*/;
const TRAILING = new Set(['MONTE', 'MONTEVIDEO', 'VIS3', 'UY', 'URY']);

export function normalizeComercio(raw) {
  let s = String(raw || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
  while (PREFIX.test(s)) s = s.replace(PREFIX, '');
  s = s.replace(/[^A-Z0-9 ]+/g, ' ');
  const words = s.split(/\s+/).filter(w => w && !/^\d+$/.test(w));
  while (words.length && TRAILING.has(words[words.length - 1])) words.pop();
  return words.join(' ');
}

export function tokens(s) {
  return normalizeComercio(s).split(' ').filter(w => w && !STOPWORDS.has(w));
}

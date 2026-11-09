export const fmt = (n, currency) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency, maximumFractionDigits: currency === 'USD' ? 2 : 0 }).format(Number(n) || 0);
export const amountOf = (m, currency) => Number(currency === 'USD' ? m.monto_usd : m.monto_uyu) || 0;
export const monthLabel = ym => new Date(`${ym}-15T12:00:00`).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const dayLabel = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
export const shiftMonth = (ym, d) => { const [y, m] = ym.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1 + d, 1)); return t.toISOString().slice(0, 7); };
export const QUIENES = ['Compartido', 'Juani', 'Mili'];

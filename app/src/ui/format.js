import { efectivo, parteDe } from '../../../src/core/money.js';
export const fmt = (n, currency) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency, maximumFractionDigits: currency === 'USD' ? 2 : 0 }).format(Number(n) || 0);
export const amountOf = (m, currency) => efectivo(m, currency);
/** Monto en la moneda original, ya dividido. */
export const ownOrig = m => Math.round(Number(m.monto_orig) * parteDe(m) * 100) / 100;
/** "÷10" o "÷3" cuando la parte es 1/N; si no, el porcentaje. */
export const parteLabel = m => { const p = parteDe(m); const n = 1 / p; return Math.abs(n - Math.round(n)) < 0.01 ? `÷${Math.round(n)}` : `${Math.round(p * 100)}%`; };
export const monthLabel = ym => new Date(`${ym}-15T12:00:00`).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const dayLabel = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
export const shiftMonth = (ym, d) => { const [y, m] = ym.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1 + d, 1)); return t.toISOString().slice(0, 7); };
export const QUIENES = ['Compartido', 'Juani', 'Mili'];

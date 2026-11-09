// Cumulative spend this month vs last month.
export function Chart({ current, previous, today }) {
  const W = 320, H = 120, P = 4;
  const max = Math.max(1, ...current, ...previous);
  const days = Math.max(current.length, previous.length);
  const pt = (v, i) => `${P + (i / (days - 1)) * (W - 2 * P)},${H - P - (v / max) * (H - 2 * P)}`;
  const line = (arr, n) => arr.slice(0, n).map(pt).join(' ');
  const upto = today ? Math.min(today, current.length) : current.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="chart" role="img" aria-label="Gasto acumulado del mes contra el mes anterior">
      <polyline points={line(previous, previous.length)} class="chart-prev" />
      <polyline points={line(current, upto)} class="chart-cur" />
      {upto > 0 && <circle cx={pt(current[upto - 1], upto - 1).split(',')[0]} cy={pt(current[upto - 1], upto - 1).split(',')[1]} r="3.5" class="chart-dot" />}
    </svg>
  );
}

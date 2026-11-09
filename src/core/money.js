const DAY = 86400000;
const MAX_DAYS_BACK = 10;
const round2 = n => Math.round(n * 100) / 100;

export function pickRate(rates, fecha) {
  const target = Date.parse(fecha);
  let best = null;
  for (const r of rates) {
    const t = Date.parse(r.fecha);
    if (t <= target && target - t <= MAX_DAYS_BACK * DAY && (!best || t > Date.parse(best.fecha))) best = r;
  }
  return best;
}

export function computeAmounts(monto, moneda, usdUyu) {
  const rate = Number(usdUyu) || null;
  if (moneda === 'USD') return { monto_uyu: rate ? round2(monto * rate) : '', monto_usd: monto };
  return { monto_uyu: monto, monto_usd: rate ? round2(monto / rate) : '' };
}

export const BCU_URL = 'https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones';
export const BCU_USD = 2222;

export function buildBcuRequest(desde, hasta) {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cot="Cotiza">
<soapenv:Header/><soapenv:Body><cot:wsbcucotizaciones.Execute><cot:Entrada>
<cot:Moneda><cot:item>${BCU_USD}</cot:item></cot:Moneda>
<cot:FechaDesde>${desde}</cot:FechaDesde><cot:FechaHasta>${hasta}</cot:FechaHasta><cot:Grupo>0</cot:Grupo>
</cot:Entrada></cot:wsbcucotizaciones.Execute></soapenv:Body></soapenv:Envelope>`;
}

export function parseBcuResponse(xml) {
  const out = [];
  const re = /<Fecha>([\d-]+)<\/Fecha>[\s\S]*?<TCV>([\d.]+)<\/TCV>/g;
  let m;
  while ((m = re.exec(xml))) out.push({ fecha: m[1], usd_uyu: Number(m[2]) });
  return out;
}

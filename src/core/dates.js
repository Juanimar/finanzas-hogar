// Montevideo is UTC−3 with no DST.
const OFFSET_MS = -3 * 3600 * 1000;

export function toMontevideoDate(isoUtc) {
  const d = new Date(new Date(isoUtc).getTime() + OFFSET_MS);
  return d.toISOString().slice(0, 10);
}

export function nowMontevideoIso(now = new Date()) {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');
}

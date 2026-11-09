// Guards row-number writes against a sheet that was sorted or changed since the app loaded.
// idsByRow: { rowNumber: idCurrentlyThere }. freshIds: optional full id column (index 0 = row 2) to remap.
export function resolveRows(objs, idsByRow, idField, freshIds) {
  const ok = [];
  const stale = [];
  for (const o of objs) {
    if (String(idsByRow[o._row] ?? '') === String(o[idField])) { ok.push(o); continue; }
    const i = freshIds ? freshIds.findIndex(v => String(v) === String(o[idField])) : -1;
    if (i >= 0) ok.push({ ...o, _row: i + 2 }); else stale.push(o);
  }
  return { ok, stale };
}

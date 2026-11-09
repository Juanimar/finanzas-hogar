import { SPREADSHEET_ID } from './config.js';
import { TABS, rowToObj, objToRow } from '../../src/core/schema.js';

const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
const colLetter = n => { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const range = (tab, from, to) => encodeURIComponent(`'${tab.name}'!A${from}:${colLetter(tab.columns.length)}${to ?? ''}`);

export function sheetsClient(getToken) {
  async function call(path, opts = {}) {
    const r = await fetch(`${BASE}${path}`, { ...opts, headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });
    if (r.status === 401) throw Object.assign(new Error('Sesión vencida'), { code: 401 });
    if (!r.ok) throw new Error(`Sheets ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
  return {
    async readTab(key) {
      const tab = TABS[key];
      const d = await call(`/values/${range(tab, 2)}?valueRenderOption=UNFORMATTED_VALUE`);
      return (d.values || []).map((row, i) => ({ ...rowToObj(tab.columns, row), _row: i + 2 }));
    },
    async updateRows(key, objs) {
      if (!objs.length) return;
      const tab = TABS[key];
      await call('/values:batchUpdate', {
        method: 'POST',
        body: JSON.stringify({ valueInputOption: 'RAW', data: objs.map(o => ({ range: decodeURIComponent(range(tab, o._row, o._row)), values: [objToRow(tab.columns, o)] })) }),
      });
    },
    async appendRows(key, objs) {
      if (!objs.length) return [];
      const tab = TABS[key];
      const d = await call(`/values/${range(tab, 1)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
        method: 'POST', body: JSON.stringify({ values: objs.map(o => objToRow(tab.columns, o)) }),
      });
      const first = Number((d.updates?.updatedRange || '').match(/!A(\d+)/)?.[1]);
      return objs.map((o, i) => ({ ...o, _row: first ? first + i : undefined }));
    },
  };
}

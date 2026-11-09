/* global SpreadsheetApp, GmailApp, UrlFetchApp, PropertiesService, ScriptApp, LockService, Utilities */
import { TABS, rowToObj, objToRow } from '../src/core/schema.js';
import { SEED_CATEGORIAS, SEED_REGLAS } from '../src/core/seed.js';
import { processMessages, fillMissingRates } from '../src/core/pipeline.js';
import { applyToSimilar } from '../src/core/classify.js';
import { consolidate } from '../src/core/learn.js';
import { pickRate, buildBcuRequest, parseBcuResponse, BCU_URL } from '../src/core/money.js';
import { nowMontevideoIso } from '../src/core/dates.js';

const SENDER = 'comunicaciones@itau.com.uy';
const LABEL_OK = 'Finanzas/Procesado';
const LABEL_REVISAR = 'Finanzas/Revisar';
const DAILY_LOOKBACK = 'newer_than:7d';
const TIME_BUDGET_MS = 4.5 * 60 * 1000;
const PAGE = 50;
// Stored as plain text so Sheets never turns ids into numbers or dates into locale dates.
const TEXT_COLS = new Set(['id', 'fecha', 'cuenta_destino', 'numero', 'patron', 'creado', 'modificado', 'creada', 'modificada', 'fecha_hora']);

// ---------- Sheets adapter ----------

function sheet(tab) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(tab.name);
  if (!sh) {
    sh = ss.insertSheet(tab.name);
    sh.getRange(1, 1, 1, tab.columns.length).setValues([tab.columns]).setFontWeight('bold');
    sh.setFrozenRows(1);
    tab.columns.forEach((c, i) => { if (TEXT_COLS.has(c)) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
  }
  return sh;
}

function readAll(tab) {
  const sh = sheet(tab);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const values = sh.getRange(2, 1, n, tab.columns.length).getValues();
  return values.map((row, i) => ({ ...rowToObj(tab.columns, row.map(v => (v instanceof Date ? Utilities.formatDate(v, 'America/Montevideo', 'yyyy-MM-dd') : v))), _row: i + 2 }));
}

function append(tab, objs) {
  if (!objs.length) return;
  const sh = sheet(tab);
  sh.getRange(sh.getLastRow() + 1, 1, objs.length, tab.columns.length).setValues(objs.map(o => objToRow(tab.columns, o)));
}

function updateRows(tab, objs) {
  const sh = sheet(tab);
  for (const o of objs) sh.getRange(o._row, 1, 1, tab.columns.length).setValues([objToRow(tab.columns, o)]);
}

function log(nivel, evento, detalle, ref) {
  append(TABS.log, [{ fecha_hora: nowMontevideoIso(), nivel, evento, detalle: String(detalle || '').slice(0, 500), ref: ref || '' }]);
}

// ---------- Exchange rates (BCU, cached in Cotizaciones) ----------

function makeRateProvider() {
  let cache = readAll(TABS.cotizaciones);
  const tried = new Set();
  return fecha => {
    const hit = pickRate(cache, fecha);
    if (hit && (hit.fecha === fecha || tried.has(fecha) || Date.now() - Date.parse(fecha) > 4 * 86400000)) return Number(hit.usd_uyu);
    if (tried.has(fecha)) return null;
    tried.add(fecha);
    const desde = new Date(Date.parse(fecha) - 10 * 86400000).toISOString().slice(0, 10);
    const res = UrlFetchApp.fetch(BCU_URL, {
      method: 'post', contentType: 'text/xml; charset=utf-8', headers: { SOAPAction: '' },
      payload: buildBcuRequest(desde, fecha), muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) throw new Error(`BCU HTTP ${res.getResponseCode()}`);
    const known = new Set(cache.map(c => c.fecha));
    const fresh = parseBcuResponse(res.getContentText()).filter(r => !known.has(r.fecha)).map(r => ({ ...r, fuente: 'BCU 2222 TCV' }));
    append(TABS.cotizaciones, fresh);
    cache = cache.concat(fresh);
    const r = pickRate(cache, fecha);
    return r ? Number(r.usd_uyu) : null;
  };
}

// ---------- Gmail ----------

function label(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function collect(query, start, max) {
  const threads = GmailApp.search(query, start, max);
  const msgs = [];
  for (const t of threads) {
    for (const m of t.getMessages()) {
      if (!String(m.getFrom()).toLowerCase().includes(SENDER) && !/^fwd?:/i.test(m.getSubject())) continue;
      msgs.push({ id: m.getId(), subject: m.getSubject(), body: m.getPlainBody(), date: m.getDate().toISOString(), thread: t });
    }
  }
  return { msgs, count: threads.length };
}

function runBatch(msgs, origen) {
  const movs = readAll(TABS.movimientos);
  const ids = new Set(movs.map(m => String(m.id)));
  const store = {
    reglas: readAll(TABS.reglas), cuentas: readAll(TABS.cuentas),
    hasId: id => ids.has(id),
    appendMovimientos: rows => append(TABS.movimientos, rows),
    log,
  };
  const result = processMessages(msgs, store, makeRateProvider(), nowMontevideoIso(), origen);
  const revisar = new Set(result.revisar);
  const ok = label(LABEL_OK);
  const bad = label(LABEL_REVISAR);
  for (const m of msgs) (revisar.has(m.id) ? bad : ok).addToThread(m.thread);
  return result;
}

// ---------- Maintenance ----------

function mantenimiento() {
  const reglas = readAll(TABS.reglas);
  const nuevas = consolidate(reglas, nowMontevideoIso());
  append(TABS.reglas, nuevas);
  if (nuevas.length) log('info', 'reglas_agrupadas', nuevas.map(r => `${r.patron}→${r.categoria}`).join(', '));

  const movs = readAll(TABS.movimientos);
  const cuentas = readAll(TABS.cuentas);
  const reclasificados = applyToSimilar(movs, reglas.concat(nuevas), cuentas);
  let conTasa = [];
  try { conTasa = fillMissingRates(movs, makeRateProvider()); } catch (e) { log('aviso', 'bcu', e.message); }
  const byRow = new Map();
  for (const m of [...reclasificados, ...conTasa]) byRow.set(m._row, { ...(byRow.get(m._row) || {}), ...m, modificado: nowMontevideoIso() });
  updateRows(TABS.movimientos, [...byRow.values()]);
  return { reglas: nuevas.length, reclasificados: reclasificados.length, conTasa: conTasa.length };
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { log('aviso', 'lock', 'Otra ejecución en curso'); return null; }
  try { return fn(); } finally { lock.releaseLock(); }
}

// ---------- Public entry points (exposed as globals by the build) ----------

export function procesarDiario() {
  return withLock(() => {
    const { msgs } = collect(`from:${SENDER} ${DAILY_LOOKBACK}`, 0, 200);
    const r = runBatch(msgs, 'gmail');
    const m = mantenimiento();
    log('info', 'ejecucion', `nuevos=${r.nuevos} revisar=${r.revisar.length} reglas=${m.reglas} reclasificados=${m.reclasificados}`);
    return r;
  });
}

export function procesarAhora() {
  const r = procesarDiario();
  if (r) SpreadsheetApp.getUi().alert(`Listo: ${r.nuevos} movimientos nuevos, ${r.revisar.length} mails para revisar.`);
}

export function consolidarReglas() {
  const m = withLock(mantenimiento);
  if (m) SpreadsheetApp.getUi().alert(`Reglas nuevas: ${m.reglas}. Reclasificados: ${m.reclasificados}.`);
}

export function reconstruir() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Reconstruir historial', 'Desde qué fecha (AAAA-MM-DD):', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const desde = resp.getResponseText().trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) { ui.alert('Fecha inválida'); return; }
  PropertiesService.getScriptProperties().setProperty('BACKFILL', JSON.stringify({ desde, start: 0, nuevos: 0 }));
  continuarReconstruccion();
  ui.alert('Reconstrucción en marcha. Si hay muchos mails sigue sola en segundo plano; mirá la pestaña Log.');
}

export function continuarReconstruccion() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('BACKFILL');
  if (!raw) return;
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'continuarReconstruccion').forEach(t => ScriptApp.deleteTrigger(t));
  const st = JSON.parse(raw);
  const t0 = Date.now();
  withLock(() => {
    const q = `from:${SENDER} after:${st.desde.replace(/-/g, '/')}`;
    while (Date.now() - t0 < TIME_BUDGET_MS) {
      const { msgs, count } = collect(q, st.start, PAGE);
      if (!count) { st.done = true; break; }
      st.nuevos += runBatch(msgs, 'historico').nuevos;
      st.start += count;
    }
  });
  if (st.done) {
    props.deleteProperty('BACKFILL');
    withLock(mantenimiento);
    log('info', 'reconstruccion_fin', `desde=${st.desde} nuevos=${st.nuevos}`);
  } else {
    props.setProperty('BACKFILL', JSON.stringify(st));
    ScriptApp.newTrigger('continuarReconstruccion').timeBased().after(60 * 1000).create();
    log('info', 'reconstruccion_parcial', `start=${st.start} nuevos=${st.nuevos}`);
  }
}

export function configurar() {
  for (const tab of Object.values(TABS)) sheet(tab);
  if (!readAll(TABS.categorias).length) append(TABS.categorias, SEED_CATEGORIAS);
  if (!readAll(TABS.reglas).length) {
    const now = nowMontevideoIso();
    append(TABS.reglas, SEED_REGLAS.map((r, i) => ({ id: `s${i + 1}`, quien: '', origen: 'semilla', usos: 0, creada: now, modificada: now, ...r })));
  }
  label(LABEL_OK); label(LABEL_REVISAR);
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'procesarDiario').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('procesarDiario').timeBased().atHour(6).everyDays(1).inTimezone('America/Montevideo').create();
  log('info', 'configuracion', 'Pestañas, semillas, etiquetas y disparador diario listos');
  SpreadsheetApp.getUi().alert('Configuración lista. Completá la pestaña Cuentas y después usá Finanzas → Reconstruir historial.');
}

export function onOpen() {
  SpreadsheetApp.getUi().createMenu('Finanzas')
    .addItem('Procesar ahora', 'procesarAhora')
    .addItem('Consolidar reglas', 'consolidarReglas')
    .addItem('Reconstruir historial…', 'reconstruir')
    .addSeparator()
    .addItem('Configurar (primera vez)', 'configurar')
    .addToUi();
}

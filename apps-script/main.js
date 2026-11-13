/* global SpreadsheetApp, GmailApp, UrlFetchApp, PropertiesService, ScriptApp, LockService, Utilities, ContentService */
import { TABS, rowToObj, objToRow, celdaSegura } from '../src/core/schema.js';
import { SEED_CATEGORIAS, SEED_REGLAS } from '../src/core/seed.js';
import { processMessages, fillMissingRates } from '../src/core/pipeline.js';
import { applyToSimilar } from '../src/core/classify.js';
import { consolidate } from '../src/core/learn.js';
import { pickRate, buildBcuRequest, parseBcuResponse, BCU_URL } from '../src/core/money.js';
import { nowMontevideoIso, toMontevideoDate } from '../src/core/dates.js';
import { htmlToText } from '../src/core/html.js';
import { importLegacyRows } from '../src/core/legacy.js';
import { inversionesToMovs } from '../src/core/inversiones.js';
import { pdfTextLines } from '../src/core/pdf.js';
import { parseEstadoCuenta, conciliar } from '../src/core/estadoCuenta.js';
import { pushToMovimiento } from '../src/core/push.js';

const SENDER = 'comunicaciones@itau.com.uy';
const LABEL_OK = 'Finanzas/Procesado';
const REENVIADORES = ['juanmartinez.smc@gmail.com', 'mmarizcurrena.smc@gmail.com'];
const LABEL_REVISAR = 'Finanzas/Revisar';
const DAILY_LOOKBACK = 'newer_than:7d';
// Estado de cuenta VISA mensual (PDF adjunto): red de seguridad para lo que no llegó por aviso.
const EDC_SENDER = 'info-mail@itau.com.uy';
const LABEL_EDC = 'Finanzas/EstadoCuenta';
const EDC_DESDE = '2026-01-01'; // antes de esto manda la planilla vieja
const TIME_BUDGET_MS = 4 * 60 * 1000;
const PAGE = 20;
const GROW_ROWS = 500;
// Stored as plain text so Sheets never turns ids into numbers or dates into locale dates.
const TEXT_COLS = new Set(['id', 'fecha', 'cuenta_destino', 'numero', 'patron', 'creado', 'modificado', 'creada', 'modificada', 'fecha_hora']);

// ---------- Sheets adapter ----------

function sheet(tab) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(tab.name);
  if (sh) {
    // Never write into a pre-existing tab of the user that happens to share the name.
    const header = sh.getRange(1, 1, 1, tab.columns.length).getValues()[0].map(String);
    if (header.join('|') !== tab.columns.join('|')) {
      throw new Error(`La pestaña "${tab.name}" ya existe con otras columnas. Renombrala y volvé a ejecutar Configurar.`);
    }
  }
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
  const first = sh.getLastRow() + 1;
  const need = first + objs.length - 1;
  if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), Math.max(objs.length, GROW_ROWS));
  tab.columns.forEach((c, i) => { if (TEXT_COLS.has(c)) sh.getRange(first, i + 1, objs.length, 1).setNumberFormat('@'); });
  sh.getRange(first, 1, objs.length, tab.columns.length).setValues(objs.map(o => objToRow(tab.columns, o).map(celdaSegura)));
}

function updateRows(tab, objs) {
  const sh = sheet(tab);
  for (const o of objs) sh.getRange(o._row, 1, 1, tab.columns.length).setValues([objToRow(tab.columns, o).map(celdaSegura)]);
}

function log(nivel, evento, detalle, ref) {
  try {
    append(TABS.log, [{ fecha_hora: nowMontevideoIso(), nivel, evento, detalle: String(detalle || '').slice(0, 500), ref: ref || '' }]);
  } catch (e) { console.error('log failed', e); } // logging must never break processing
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

// Collects messages from up to `max` threads. Stops early (returning fewer threads) when past `deadline`.
function collect(query, start, max, deadline) {
  const threads = GmailApp.search(query, start, max);
  const msgs = [];
  let count = 0;
  for (const t of threads) {
    if (deadline && Date.now() > deadline && count > 0) break;
    count++;
    for (const m of t.getMessages()) {
      const from = String(m.getFrom()).toLowerCase();
      // Reenvíos a mano ("Fwd:") solo si los manda uno de los dos.
      if (!from.includes(SENDER) && !(/^fwd?:/i.test(m.getSubject()) && REENVIADORES.some(r => from.includes(r)))) continue;
      // Itaú sends HTML-only mails; convert ourselves instead of relying on getPlainBody().
      msgs.push({ id: m.getId(), subject: m.getSubject(), body: htmlToText(m.getBody()), date: m.getDate().toISOString(), thread: t });
    }
  }
  return { msgs, count, total: threads.length };
}

function runBatch(msgs, origen) {
  const movs = readAll(TABS.movimientos);
  const ids = new Set(movs.map(m => String(m.id)));
  const store = {
    reglas: readAll(TABS.reglas), cuentas: readAll(TABS.cuentas),
    hasId: id => ids.has(id),
    existing: movs,
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

// ---------- Estado de cuenta VISA ----------

function conciliarEstados(deadline) {
  const q = `from:${EDC_SENDER} subject:"estado de cuenta Visa" has:attachment after:${EDC_DESDE.replace(/-/g, '/')} -label:${LABEL_EDC.replace('/', '-')}`;
  const threads = GmailApp.search(q, 0, 24);
  const msgs = [];
  for (const t of threads) for (const m of t.getMessages()) msgs.push({ m, t });
  msgs.sort((a, b) => a.m.getDate() - b.m.getDate()); // en orden, para que cada mes vea lo agregado por el anterior
  if (!msgs.length) return { estados: 0, agregados: 0 };

  let movs = readAll(TABS.movimientos);
  const ids = new Set(movs.map(m => String(m.id)));
  const ctx = { reglas: readAll(TABS.reglas), cuentas: readAll(TABS.cuentas), desde: EDC_DESDE, now: nowMontevideoIso(), rateFor: makeRateProvider() };
  const ok = label(LABEL_EDC);
  let estados = 0, agregados = 0;
  for (const { m, t } of msgs) {
    if (deadline && Date.now() > deadline) break;
    const pdf = m.getAttachments().find(a => /\.pdf$/i.test(a.getName()));
    if (!pdf) continue;
    const ec = parseEstadoCuenta(pdfTextLines(Uint8Array.from(pdf.getBytes(), b => b & 255)));
    if (!ec.cierre || !ec.items.length) {
      log('aviso', 'estado_cuenta_no_leido', `No pude leer el estado de cuenta "${m.getSubject()}" del ${m.getDate().toISOString().slice(0, 10)}`, m.getId());
      label(LABEL_REVISAR).addToThread(t);
      continue;
    }
    const nuevos = conciliar(ec, movs, ctx).filter(n => !ids.has(n.id));
    append(TABS.movimientos, nuevos);
    for (const n of nuevos) ids.add(n.id);
    movs = movs.concat(nuevos);
    ok.addToThread(t);
    estados++; agregados += nuevos.length;
    log('info', 'estado_cuenta', `cierre=${ec.cierre} lineas=${ec.items.length} agregados=${nuevos.length}`, m.getId());
  }
  return { estados, agregados };
}

// ---------- Maintenance ----------

function syncInversiones() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Inversiones');
  if (!sh) return 0;
  const nuevos = inversionesToMovs(sh.getDataRange().getDisplayValues(), readAll(TABS.movimientos), nowMontevideoIso());
  append(TABS.movimientos, nuevos);
  if (nuevos.length) log('info', 'inversiones', `depositos_nuevos=${nuevos.length}`);
  return nuevos.length;
}

function mantenimiento() {
  try { syncInversiones(); } catch (e) { log('aviso', 'inversiones', e.message); }
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
  for (const m of reclasificados) byRow.set(m._row, { ...m, modificado: nowMontevideoIso() });
  for (const m of conTasa) {
    const base = byRow.get(m._row) || m;
    byRow.set(m._row, { ...base, cotizacion: m.cotizacion, monto_uyu: m.monto_uyu, monto_usd: m.monto_usd, modificado: nowMontevideoIso() });
  }
  updateRows(TABS.movimientos, [...byRow.values()]);
  return { reglas: nuevas.length, reclasificados: reclasificados.length, conTasa: conTasa.length };
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { log('aviso', 'lock', 'Otra ejecución en curso'); return null; }
  try { return fn(); } finally { lock.releaseLock(); }
}

// ---------- Public entry points (exposed as globals by the build) ----------

function dailyQuery() {
  const last = PropertiesService.getScriptProperties().getProperty('LAST_OK');
  if (!last) return `from:${SENDER} ${DAILY_LOOKBACK}`;
  const d = new Date(Date.parse(last) - 2 * 86400000).toISOString().slice(0, 10).replace(/-/g, '/');
  return `from:${SENDER} after:${d}`;
}

export function procesarDiario() {
  return withLock(() => {
    const q = dailyQuery();
    const msgs = [];
    for (let start = 0; ; start += 100) {
      const page = collect(q, start, 100);
      msgs.push(...page.msgs);
      if (page.total < 100) break;
    }
    const r = runBatch(msgs, 'gmail');
    PropertiesService.getScriptProperties().setProperty('LAST_OK', new Date().toISOString().slice(0, 10));
    try { conciliarEstados(Date.now() + TIME_BUDGET_MS); } catch (e) { log('aviso', 'estado_cuenta', e.message); }
    const m = mantenimiento();
    log('info', 'ejecucion', `nuevos=${r.nuevos} revisar=${r.revisar.length} reglas=${m.reglas} reclasificados=${m.reclasificados}`);
    return r;
  });
}

export function procesarAhora() {
  const r = procesarDiario();
  if (!r) { SpreadsheetApp.getUi().alert('Hay otra ejecución en curso. Probá en un minuto.'); return; }
  SpreadsheetApp.getUi().alert(`Listo: ${r.nuevos} movimientos nuevos, ${r.revisar.length} mails para revisar.`);
}

export function consolidarReglas() {
  const m = withLock(mantenimiento);
  if (!m) { SpreadsheetApp.getUi().alert('Hay otra ejecución en curso. Probá en un minuto.'); return; }
  SpreadsheetApp.getUi().alert(`Reglas nuevas: ${m.reglas}. Reclasificados: ${m.reclasificados}.`);
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
  const triggers = () => ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'continuarReconstruccion');
  triggers().forEach(t => ScriptApp.deleteTrigger(t));
  if (!raw) return;
  // Schedule the next run up front: if this run crashes or is killed, the next one resumes from saved state.
  ScriptApp.newTrigger('continuarReconstruccion').timeBased().after(2 * 60 * 1000).create();
  const st = JSON.parse(raw);
  const deadline = Date.now() + TIME_BUDGET_MS;
  try {
    withLock(() => {
      const q = `from:${SENDER} after:${st.desde.replace(/-/g, '/')}`;
      while (Date.now() < deadline) {
        const { msgs, count } = collect(q, st.start, PAGE, deadline);
        if (!count) { st.done = true; break; }
        st.nuevos += runBatch(msgs, 'historico').nuevos;
        st.start += count;
        props.setProperty('BACKFILL', JSON.stringify(st));
      }
    });
  } catch (e) {
    log('error', 'reconstruccion_error', `${e.message} (start=${st.start}); se reintenta en 2 minutos`);
    return;
  }
  if (st.done) {
    triggers().forEach(t => ScriptApp.deleteTrigger(t));
    props.deleteProperty('BACKFILL');
    withLock(mantenimiento);
    log('info', 'reconstruccion_fin', `desde=${st.desde} nuevos=${st.nuevos}`);
  } else {
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

export function importarPlanillaVieja() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Gastos Mensuales');
  if (!sh) throw new Error('No encuentro la pestaña "Gastos Mensuales"');
  const rows = sh.getDataRange().getDisplayValues();
  const { movs, omitidas } = importLegacyRows(rows, { hasta: '2025-12', now: nowMontevideoIso() });
  const existing = new Set(readAll(TABS.movimientos).map(m => String(m.id)));
  const nuevos = movs.filter(m => !existing.has(m.id));
  append(TABS.movimientos, nuevos);
  const cats = new Set(readAll(TABS.categorias).map(c => c.nombre));
  const faltan = SEED_CATEGORIAS.filter(c => !cats.has(c.nombre));
  append(TABS.categorias, faltan);
  log('info', 'importacion_planilla', `importados=${nuevos.length} omitidos=${omitidas} categorias_nuevas=${faltan.map(c => c.nombre).join(',')}`);
  withLock(mantenimiento);
  return { importados: nuevos.length, omitidas };
}

export function sincronizarInversiones() {
  const n = withLock(mantenimiento);
  return n;
}

export function conciliarEstadosAhora() {
  const r = withLock(() => conciliarEstados(Date.now() + TIME_BUDGET_MS));
  if (!r) { SpreadsheetApp.getUi().alert('Hay otra ejecución en curso. Probá en un minuto.'); return; }
  SpreadsheetApp.getUi().alert(r.estados
    ? `Listo: revisé ${r.estados} estado(s) de cuenta y agregué ${r.agregados} movimientos que no habían llegado por aviso.`
    : 'No hay estados de cuenta nuevos para revisar.');
}

// ---------- Push de Android (MacroDroid → aplicación web) ----------

/** Recibe {token, title, text} de MacroDroid cuando llega una notificación de la app de Itaú. */
export function doPost(e) {
  const out = s => ContentService.createTextOutput(s);
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out('json inválido'); }
  const token = PropertiesService.getScriptProperties().getProperty('PUSH_TOKEN');
  if (!token || body.token !== token) return out('no autorizado');
  const text = [body.title, body.text].filter(Boolean).join(' ').trim();
  if (!text) return out('vacío');
  const at = new Date().toISOString();
  return withLock(() => {
    let rate = null;
    try { rate = makeRateProvider()(toMontevideoDate(at)); } catch (err) { /* se completa en el mantenimiento */ }
    const r = pushToMovimiento(text, at, { reglas: readAll(TABS.reglas), cuentas: readAll(TABS.cuentas) }, rate, nowMontevideoIso());
    if (!r.ok) {
      if (/consumo|tarjeta|transferencia|d[eé]bito/i.test(text)) log('aviso', 'push_no_leido', text.slice(0, 300));
      return out('ignorado');
    }
    if (readAll(TABS.movimientos).some(m => String(m.id) === r.mov.id)) return out('repetido');
    append(TABS.movimientos, [r.mov]);
    log('info', 'push', `${r.mov.comercio_raw} ${r.mov.moneda} ${r.mov.monto_orig}`, r.mov.id);
    return out('ok');
  }) || out('ocupado');
}

export function configurarPush() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('PUSH_TOKEN');
  if (!token) { token = Utilities.getUuid().replace(/-/g, ''); props.setProperty('PUSH_TOKEN', token); }
  const url = ScriptApp.getService().getUrl() || '(todavía no publicaste la aplicación web)';
  SpreadsheetApp.getUi().alert(`Datos para MacroDroid\n\nDirección:\n${url}\n\nClave:\n${token}\n\nNo compartas la clave: con ella cualquiera podría agregar movimientos.`);
}

export function onOpen() {
  SpreadsheetApp.getUi().createMenu('Finanzas')
    .addItem('Procesar ahora', 'procesarAhora')
    .addItem('Consolidar reglas', 'consolidarReglas')
    .addItem('Reconstruir historial…', 'reconstruir')
    .addItem('Importar planilla vieja (hasta 2025)', 'importarPlanillaVieja')
    .addItem('Sincronizar Inversiones', 'sincronizarInversiones')
    .addItem('Conciliar estados de cuenta VISA', 'conciliarEstadosAhora')
    .addItem('Configurar push de Android', 'configurarPush')
    .addSeparator()
    .addItem('Configurar (primera vez)', 'configurar')
    .addToUi();
}

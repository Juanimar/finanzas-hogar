# Finanzas del Hogar — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gmail (Itaú) → Google Sheets with learning rules, plus an installable PWA for Juani and Mili.

**Architecture:** Pure, tested JS core (`src/core`) shared by two thin shells: an Apps Script bundle (`apps-script/`, built with esbuild into a single `Code.gs`) and a Vite + Preact PWA (`app/`) that talks to the Sheets API with the user's Google token.

**Tech Stack:** Node 22, Vitest, esbuild, Vite, Preact, Google Apps Script (V8), Google Identity Services, Sheets API v4.

**Spec:** `docs/superpowers/specs/2026-11-09-finanzas-hogar-mvp-design.md`

## Global Constraints

- Spreadsheet ID: `1jyPGemEDElKxN4lxUPTmoHLAXvkbf249idA_bsWw9HI`. Existing tabs are never modified.
- OAuth client ID: `278589590504-6t5iicgshp9jm7gjs36r222svl69hh04.apps.googleusercontent.com`. Scope: `https://www.googleapis.com/auth/spreadsheets`.
- Allowed users: `juanmartinez.smc@gmail.com` + Mili's address (config `ALLOWED_EMAILS`, Mili's filled at setup).
- Sender: `comunicaciones@itau.com.uy`. Labels: `Finanzas/Procesado`, `Finanzas/Revisar`.
- Time zone: `America/Montevideo` (UTC−3, no DST). Daily trigger 06:00.
- No AI in MVP. No secrets or personal data in the repo; email fixtures anonymised.
- Currency codes: only `UYU`, `USD`. `URGP`/`Pesos` → `UYU`; `Dólares`/`USD`/`U$S` → `USD`.
- BCU rate: USD code `2222`, field `TCV`; weekends/holidays use the last prior business day.
- Category list, groups and column names exactly as spec §5.

## Review Focus

1. Amounts with thousands separators (`39,285.84`) and one decimal (`3251.0`) parse to the right number — tests in Task 2.
2. A mail whose subject matches but body doesn't (format change) must go to `Finanzas/Revisar`, never be dropped or half-written — tests in Task 2 and Task 6.
3. An email received at 01:30 UTC belongs to the previous Montevideo day — test in Task 2.
4. A manual edit (`bloqueado`) is never overwritten by daily reclassification — test in Task 4.
5. Generic merchant tokens (`MERPAGO`, `MONTE`, `VIS3`, `ENVIO`) never become `contiene` rules — test in Task 4.

---

### Task 1: Scaffold + schema + seeds

**Files:** Create `package.json`, `vitest.config.js`, `src/core/schema.js`, `src/core/seed.js`, `test/schema.test.js`

**Interfaces — Produces:**
- `TABS = { movimientos, reglas, cuentas, categorias, cotizaciones, log }`, each `{ name: string, columns: string[] }` (columns per spec §5).
- `rowToObj(columns, row) -> object`, `objToRow(columns, obj) -> any[]` (booleans as `TRUE`/`FALSE`, missing → `''`).
- `SEED_CATEGORIAS: {nombre, grupo, orden, activa}[]` (19 categories, spec §5.4). `SEED_REGLAS: {tipo, patron, categoria, descripcion}[]` (~40, spec §7.4, patterns already normalized).
- `GRUPOS = ['Fijos','Variables','No es gasto']`, `NO_GASTO = ['Ahorro/Inversión','Movimiento interno']`.

- [ ] Test: round-trip `objToRow`/`rowToObj` for a movimiento; every seed regla's categoria exists in `SEED_CATEGORIAS`; 19 categories; no duplicate column names.
- [ ] Implement; `npx vitest run` green; commit.

### Task 2: Itaú email parsers

**Files:** Create `src/core/parsers.js`, `src/core/dates.js`, `test/fixtures/itau/*.txt` (anonymised real bodies: credito-uyu, credito-usd, debito, transferencia, pago-tarjeta), `test/parsers.test.js`

**Interfaces — Produces:**
- `toMontevideoDate(isoUtc: string) -> 'YYYY-MM-DD'`.
- `parseAmount(s: string) -> number` (strip `,` thousands).
- `parseItauEmail({id, subject, body, date}) -> {ok: true, movs: MovDraft[]} | {ok: false, reason: string} | null` — `null` if subject is not a known Itaú notice. `MovDraft = {id, fecha, tipo, medio, comercio_raw, cuenta_destino, banco_destino, monto_orig, moneda}`.
- Pago tarjeta → up to two drafts, ids `${id}-uyu` / `${id}-usd`, zero amounts skipped.

- [ ] Tests: each fixture → exact draft (e.g. credito-usd → `{tipo:'consumo_credito', medio:'Visa 1025', monto_orig:20, moneda:'USD', comercio_raw:'ANTHROPIC* CLAUDE SUB +1415'}`); pago → 39285.84 UYU + 456.31 USD; `URGP`→UYU; unknown subject → `null`; known subject + garbage body → `{ok:false}`; `2026-11-07T01:30:00Z` → `2026-11-06`.
- [ ] Implement; tests green; commit.

### Task 3: Normalizer + money

**Files:** Create `src/core/normalize.js`, `src/core/money.js`, `test/normalize.test.js`, `test/money.test.js`

**Interfaces — Produces:**
- `normalizeComercio(raw: string) -> string`; `STOPWORDS: Set<string>`; `tokens(s) -> string[]` (normalized, stopwords removed).
- `pickRate(rates: {fecha, usd_uyu}[], fecha) -> {fecha, usd_uyu} | null` (exact or latest prior, max 10 days back).
- `computeAmounts(monto, moneda, usd_uyu) -> {monto_uyu, monto_usd}` (2 decimals; null rate → both null except the native one).
- `buildBcuRequest(desde, hasta) -> string` (SOAP XML), `parseBcuResponse(xml) -> {fecha, usd_uyu}[]`.

- [ ] Tests: `MERPAGO*MACROMERCADO MONTE`→`MACROMERCADO`; `DLO*PedidosYa Envio VIS3`→`PEDIDOSYA ENVIO`; accents removed; Saturday picks Friday; USD 20 @ 40 → 800 UYU; parse a BCU response fixture.
- [ ] Implement; green; commit.

### Task 4: Classifier + learning + consolidation

**Files:** Create `src/core/classify.js`, `src/core/learn.js`, `test/classify.test.js`, `test/learn.test.js`

**Interfaces — Consumes:** `normalizeComercio`, `tokens`, `NO_GASTO`.
**Produces:**
- `classify(mov, {reglas, cuentas}) -> {categoria, quien, descripcion, clasificado_por, revisado}` (spec §7.2 order; `bloqueado` → returns current values unchanged; cuenta `propia_ahorro`→`Ahorro/Inversión`, `propia_interna`→`Movimiento interno`; no match → `Otros`/`pendiente`/`revisado:false`; matched → `revisado:true`).
- `quienFor(medio, cuentas) -> 'Compartido'|'Juani'|'Mili'`.
- `learnFromEdit(mov, edit:{categoria?, quien?, descripcion?, nombreCuenta?}, {reglas, cuentas}, now) -> {reglaUpsert|null, cuentaUpsert|null}` (spec §7.3; transfers learn into cuentas, others into exact reglas).
- `applyToSimilar(movs, reglas, cuentas) -> mov[]` (re-classify pending, unlocked; returns changed ones).
- `consolidate(reglas, now) -> nuevasReglas[]` (≥2 exact rules sharing a token ≥4 chars not in STOPWORDS, same categoria, no conflicting `contiene` → new `contiene`, `origen:'agrupacion'`).

- [ ] Tests: priority cuenta > exacta > contiene (longest wins); bloqueado untouched; `DEVOTO EXPRESS`+`DEVOTO AROCENA` → `contiene DEVOTO`; `PEDIDOSYA ENVIO` + `MERPAGO X` never yield `ENVIO`/`MERPAGO`; conflict blocks; edit on transfer creates cuenta; applyToSimilar resolves siblings.
- [ ] Implement; green; commit.

### Task 5: Aggregations for the app

**Files:** Create `src/core/aggregate.js`, `test/aggregate.test.js`

**Interfaces — Produces:**
- `isGasto(mov, catIndex) -> boolean` (excludes `pago_tarjeta` and `NO_GASTO`).
- `monthSummary(movs, categorias, yyyymm, currency:'UYU'|'USD') -> {total, porGrupo:{Fijos,Variables}, porCategoria:[{categoria, grupo, total}], pendientes, metric:{reglas, manual, pendiente}}`.
- `cumulativeByDay(movs, categorias, yyyymm, currency) -> number[]` (index 0 = day 1).
- `merchantTotals(movs, categorias, categoria, yyyymm, currency) -> [{comercio, mes, anio}]`.

- [ ] Tests with a small fixture month: totals in both currencies, pago_tarjeta excluded, cumulative monotonic, metric percentages sum to 100.
- [ ] Implement; green; commit.

### Task 6: Apps Script shell + bundle

**Files:** Create `apps-script/main.js`, `apps-script/sheets.js`, `apps-script/appsscript.json`, `scripts/build-gas.mjs`, `test/gas-pipeline.test.js`

**Interfaces — Consumes:** all core.
**Produces (global functions in `dist/Code.gs`):** `onOpen()` (menu "Finanzas": Procesar ahora / Consolidar reglas / Reconstruir historial / Configurar), `configurar()` (creates the 6 tabs with headers + seeds, labels, daily trigger; idempotent), `procesarDiario()`, `procesarAhora()`, `reconstruir()` (prompt for `desde`, batched with continuation in `PropertiesService`, 4.5 min budget per run), `consolidarReglas()`.
- `processMessages(messages, store, rateProvider, now) -> {nuevos, revisar, errores}` — pure orchestration taking injected adapters; this is what the test exercises with fakes.

- [ ] Test `processMessages` with fake store/rates: new mail → row with amounts + classification; same id twice → no duplicate; bad body → in `revisar`; rate missing → row saved with empty cotizacion.
- [ ] Implement adapters (GmailApp, SpreadsheetApp, UrlFetchApp to `https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones`, Log tab); `node scripts/build-gas.mjs` produces `dist/Code.gs` + `dist/appsscript.json`; `node --check` on bundle; commit.

### Task 7: PWA

**Files:** Create `app/index.html`, `app/vite.config.js`, `app/public/manifest.webmanifest`, `app/public/icon-*.png`, `app/public/sw.js`, `app/src/{main.jsx, config.js, auth.js, sheets.js, store.js, ui/*.jsx, styles.css}`

**Interfaces — Consumes:** core `aggregate`, `classify`, `learn`, `schema`.
**Produces:** screens Inicio, Revisar, Categorías→Comercio→Movimientos, Movimientos (search), Nuevo (+). `sheets.js`: `readTab(name) -> object[]` (with `_row` index), `updateRow(tab, rowIndex, obj)`, `appendRows(tab, objs)`. Currency toggle persisted in `localStorage`. Email allow-list check after login.

- [ ] `vite build` succeeds; smoke test with a mocked Sheets layer (`?demo=1` uses fixture data) rendered and screenshotted in a headless browser.
- [ ] GitHub Pages workflow `.github/workflows/pages.yml` (build `app/` with base `/finanzas-hogar/`); commit.

### Task 8: Setup guide + final verification

**Files:** Create `README.md` (setup in Spanish: paste `Code.gs`, run `Configurar`, authorise, run `Reconstruir historial`, fill `Cuentas`, install PWA on Android/iOS).

- [ ] Full `npx vitest run` green; bundle + app build; acceptance run against the real October mails via fixtures where available; commit.

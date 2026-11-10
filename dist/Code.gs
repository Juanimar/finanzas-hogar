// Generado por scripts/build-gas.mjs — no editar a mano.
var FH = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // apps-script/main.js
  var main_exports = {};
  __export(main_exports, {
    configurar: () => configurar,
    consolidarReglas: () => consolidarReglas,
    continuarReconstruccion: () => continuarReconstruccion,
    onOpen: () => onOpen,
    procesarAhora: () => procesarAhora,
    procesarDiario: () => procesarDiario,
    reconstruir: () => reconstruir
  });

  // src/core/schema.js
  var TABS = {
    movimientos: {
      name: "Movimientos",
      columns: [
        "id",
        "fecha",
        "tipo",
        "medio",
        "comercio_raw",
        "comercio",
        "cuenta_destino",
        "banco_destino",
        "descripcion",
        "monto_orig",
        "moneda",
        "cotizacion",
        "monto_uyu",
        "monto_usd",
        "categoria",
        "quien",
        "clasificado_por",
        "revisado",
        "bloqueado",
        "origen",
        "nota",
        "creado",
        "modificado"
      ]
    },
    reglas: {
      name: "Reglas",
      columns: ["id", "tipo", "patron", "categoria", "quien", "descripcion", "origen", "usos", "creada", "modificada"]
    },
    cuentas: {
      name: "Cuentas",
      columns: ["numero", "banco", "nombre", "tipo", "titular", "categoria", "quien"]
    },
    categorias: { name: "Categorías", columns: ["nombre", "grupo", "orden", "activa"] },
    cotizaciones: { name: "Cotizaciones", columns: ["fecha", "usd_uyu", "fuente"] },
    log: { name: "Log", columns: ["fecha_hora", "nivel", "evento", "detalle", "ref"] }
  };
  var BOOL = { TRUE: true, FALSE: false };
  function rowToObj(columns, row) {
    const o = {};
    columns.forEach((c, i) => {
      let v = row[i];
      if (v === void 0 || v === null) v = "";
      if (typeof v === "string" && v in BOOL) v = BOOL[v];
      o[c] = v;
    });
    return o;
  }
  function objToRow(columns, obj) {
    return columns.map((c) => {
      const v = obj[c];
      if (v === true) return "TRUE";
      if (v === false) return "FALSE";
      if (v === void 0 || v === null) return "";
      return v;
    });
  }

  // src/core/seed.js
  var NO_GASTO = ["Ahorro/Inversión", "Movimiento interno"];
  var CATS = {
    Fijos: ["Vivienda", "Servicios", "Servicio doméstico", "Suscripciones", "Bancos/Comisiones"],
    Variables: [
      "Supermercado",
      "Delivery",
      "ComidaSocial",
      "Transporte",
      "Casa",
      "Estética/Cosmética",
      "Salud",
      "Diversión",
      "Regalos y Cumpleaños",
      "Donación",
      "Viajes",
      "Otros"
    ],
    "No es gasto": NO_GASTO,
    Ingresos: ["Sueldo", "Otros ingresos"]
  };
  var SEED_CATEGORIAS = Object.entries(CATS).flatMap(
    ([grupo, nombres]) => nombres.map((nombre) => ({ nombre, grupo, activa: true }))
  ).map((c, i) => ({ ...c, orden: i + 1 }));
  var r = (patron, categoria, descripcion, tipo = "contiene") => ({ tipo, patron, categoria, descripcion });
  var SEED_REGLAS = [
    r("DEVOTO", "Supermercado", "Devoto"),
    r("DISCO", "Supermercado", "Disco"),
    r("GEANT", "Supermercado", "Géant"),
    r("TIENDA INGLESA", "Supermercado", "Tienda Inglesa"),
    r("MACROMERCADO", "Supermercado", "Macromercado"),
    r("TA TA", "Supermercado", "Ta-Ta"),
    r("TATA", "Supermercado", "Ta-Ta"),
    r("EL DORADO", "Supermercado", "El Dorado"),
    r("FRESH MARKET", "Supermercado", "Fresh Market"),
    r("PEDIDOSYA", "Delivery", "PedidosYa"),
    r("RAPPI", "Delivery", "Rappi"),
    r("UBER EATS", "Delivery", "Uber Eats"),
    r("UBER", "Transporte", "Uber"),
    r("CABIFY", "Transporte", "Cabify"),
    r("ANCAP", "Transporte", "Ancap"),
    r("PETROBRAS", "Transporte", "Petrobras"),
    r("AXION", "Transporte", "Axion"),
    r("STM", "Transporte", "STM", "exacta"),
    r("UTE", "Servicios", "UTE", "exacta"),
    r("OSE", "Servicios", "OSE", "exacta"),
    r("ANTEL", "Servicios", "Antel"),
    r("MOVISTAR", "Servicios", "Movistar"),
    r("CLARO", "Servicios", "Claro"),
    r("NETFLIX", "Suscripciones", "Netflix"),
    r("SPOTIFY", "Suscripciones", "Spotify"),
    r("ANTHROPIC", "Suscripciones", "Claude"),
    r("OPENAI", "Suscripciones", "ChatGPT"),
    r("DISNEY", "Suscripciones", "Disney+"),
    r("HBO", "Suscripciones", "HBO Max"),
    r("APPLE COM", "Suscripciones", "Apple"),
    r("GOOGLE", "Suscripciones", "Google"),
    r("YOUTUBE", "Suscripciones", "YouTube"),
    r("SAN ROQUE", "Salud", "San Roque"),
    r("FARMASHOP", "Salud", "Farmashop"),
    r("FARMACIA", "Salud", "Farmacia"),
    r("STARBUCKS", "ComidaSocial", "Starbucks"),
    r("FREDDO", "ComidaSocial", "Freddo"),
    r("MERCADOLIBRE", "Casa", "Mercado Libre"),
    r("FROG", "Casa", "Frog"),
    r("SODIMAC", "Casa", "Sodimac"),
    r("MIDINERO", "Servicio doméstico", "Midinero")
  ];

  // src/core/dates.js
  var OFFSET_MS = -3 * 3600 * 1e3;
  function toMontevideoDate(isoUtc) {
    const d = new Date(new Date(isoUtc).getTime() + OFFSET_MS);
    return d.toISOString().slice(0, 10);
  }
  function nowMontevideoIso(now = /* @__PURE__ */ new Date()) {
    return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 19).replace("T", " ");
  }

  // src/core/parsers.js
  function parseAmount(s) {
    return Number(String(s).replace(/,/g, ""));
  }
  function currency(s) {
    const u = s.toUpperCase();
    if (/^(URGP|UYU|PESOS?|\$)$/.test(u)) return "UYU";
    if (/^(USD|US\.?D|U\$S|DOLARES|DÓLARES|DOLAR|DÓLAR)$/.test(u)) return "USD";
    return null;
  }
  var clean = (body) => String(body).replace(/[|#]/g, " ").replace(/\s+/g, " ").trim();
  var NUM = "([\\d.,]+)";
  var PARSERS = [
    {
      subject: /consumo aprobado con tarjeta de cr[eé]dito/i,
      tipo: "consumo_credito",
      re: new RegExp(`nro\\. \\*+\\s*(\\d{4}) Importe: ${NUM} (\\S+) Comercio: (.+?) Adem[aá]s`, "i"),
      build: (m) => [{ medio: `Visa ${m[1]}`, monto: m[2], moneda: m[3], comercio_raw: m[4] }]
    },
    {
      subject: /consumo aprobado con tarjeta de d[eé]bito/i,
      tipo: "consumo_debito",
      re: new RegExp(`terminada en (\\d{4}) ?\\. Realizado en (.+?) Monto: ${NUM} (\\S+?)\\.? `, "i"),
      build: (m) => [{ medio: `Débito ${m[1]}`, monto: m[3], moneda: m[4], comercio_raw: m[2] }]
    },
    {
      subject: /transferencia realizada/i,
      tipo: "transferencia",
      re: new RegExp(`desde la cuenta \\*+\\s*(\\d{4}) Importe: ${NUM} (\\S+) Cuenta destino: (\\S+) Banco/Instituci[oó]n destino: (.+?) Adem[aá]s`, "i"),
      build: (m) => [{ medio: `Cuenta ${m[1]}`, monto: m[2], moneda: m[3], cuenta_destino: m[4], banco_destino: m[5] }]
    },
    {
      subject: /pago de tarjeta de cr[eé]dito/i,
      tipo: "pago_tarjeta",
      re: new RegExp(`terminada en (\\d{4})\\. Pago en pesos: ${NUM} pesos Pago en d[oó]lares: ${NUM} d[oó]lares`, "i"),
      build: (m) => [
        { suffix: "-uyu", medio: `Visa ${m[1]}`, monto: m[2], moneda: "UYU" },
        { suffix: "-usd", medio: `Visa ${m[1]}`, monto: m[3], moneda: "USD" }
      ]
    }
  ];
  function parseItauEmail({ id, subject, body, date }) {
    const p = PARSERS.find((x) => x.subject.test(subject || ""));
    if (!p) return null;
    const m = clean(body).match(p.re);
    if (!m) return { ok: false, reason: `Formato no reconocido para "${subject}"` };
    const fecha = toMontevideoDate(date);
    const movs = [];
    for (const b of p.build(m)) {
      const moneda = currency(b.moneda);
      const monto = parseAmount(b.monto);
      if (!moneda || !Number.isFinite(monto)) return { ok: false, reason: `Monto o moneda inválidos: ${b.monto} ${b.moneda}` };
      if (p.tipo === "pago_tarjeta" && monto === 0) continue;
      movs.push({
        id: id + (b.suffix || ""),
        fecha,
        tipo: p.tipo,
        medio: b.medio,
        comercio_raw: (b.comercio_raw || "").trim(),
        cuenta_destino: b.cuenta_destino || "",
        banco_destino: (b.banco_destino || "").trim(),
        monto_orig: monto,
        moneda
      });
    }
    return { ok: true, movs };
  }

  // src/core/normalize.js
  var STOPWORDS = /* @__PURE__ */ new Set([
    "MERPAGO",
    "DLO",
    "PAYU",
    "MP",
    "PAYPAL",
    "MONTE",
    "MONTEVIDEO",
    "VIS3",
    "UY",
    "URY",
    "URUGUAY",
    "ENVIO",
    "PAGO",
    "PAGOS",
    "COMPRA",
    "SA",
    "SRL",
    "LTDA",
    "DE",
    "DEL",
    "LA",
    "EL",
    "LOS",
    "LAS",
    "Y",
    "WWW",
    "COM",
    "SUC",
    "SUCURSAL",
    "POS",
    "EXPRESS",
    "SHOP",
    "STORE",
    "MARKET",
    "ONLINE",
    "CENTER",
    "CENTRO",
    "TIENDA",
    "LOCAL",
    "SERVICIOS",
    "URUGUAYA",
    "INTERNACIONAL",
    "GROUP",
    "COMPANY",
    "PLAZA",
    "SHOPPING",
    "CARRASCO",
    "POCITOS"
  ]);
  var PREFIX = /^(MERPAGO|DLO|PAYU|MP|PAYPAL|SQ)\s*\*/;
  var TRAILING = /* @__PURE__ */ new Set(["MONTE", "MONTEVIDEO", "VIS3", "UY", "URY"]);
  function normalizeComercio(raw) {
    let s = String(raw || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
    while (PREFIX.test(s)) s = s.replace(PREFIX, "");
    s = s.replace(/[^A-Z0-9 ]+/g, " ");
    const words = s.split(/\s+/).filter((w) => w && !/^\d+$/.test(w));
    while (words.length && TRAILING.has(words[words.length - 1])) words.pop();
    return words.join(" ");
  }
  function tokens(s) {
    return normalizeComercio(s).split(" ").filter((w) => w && !STOPWORDS.has(w));
  }

  // src/core/classify.js
  var titleCase = (s) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  function quienFor(medio, cuentas) {
    const last4 = (String(medio || "").match(/(\d{4})$/) || [])[1];
    const c = last4 && cuentas.find((x) => x.tipo === "tarjeta_propia" && String(x.numero) === last4);
    return c && c.titular || "Compartido";
  }
  function matchRule(comercio, reglas) {
    if (!comercio) return null;
    const exact = reglas.find((r2) => r2.tipo === "exacta" && r2.patron === comercio);
    if (exact) return { regla: exact, por: "regla_exacta" };
    const padded = ` ${comercio} `;
    const hits = reglas.filter((r2) => r2.tipo === "contiene" && r2.patron && padded.includes(` ${r2.patron} `));
    if (!hits.length) return null;
    hits.sort((a, b) => b.patron.length - a.patron.length);
    return { regla: hits[0], por: "regla_contiene" };
  }
  var fromRule = (hit, comercio, quien, revisado = hit.regla.origen !== "agrupacion") => ({
    categoria: hit.regla.categoria,
    quien: hit.regla.quien || quien,
    descripcion: hit.regla.descripcion || titleCase(comercio),
    clasificado_por: hit.por,
    revisado
  });
  function classify(mov, { reglas, cuentas }) {
    if (mov.bloqueado) {
      const { categoria, quien: quien2, descripcion, clasificado_por, revisado } = mov;
      return { categoria, quien: quien2, descripcion, clasificado_por, revisado };
    }
    const quien = quienFor(mov.medio, cuentas);
    if (mov.tipo === "pago_tarjeta") {
      return { categoria: "Movimiento interno", quien, descripcion: `Pago tarjeta ${mov.medio}`, clasificado_por: "regla_exacta", revisado: true };
    }
    if (mov.tipo === "transferencia") {
      const c = cuentas.find((x) => String(x.numero) === String(mov.cuenta_destino));
      if (c && c.tipo === "tercero" && !c.categoria) {
        return { categoria: "Otros", quien: c.quien || quien, descripcion: c.nombre || `Cuenta ${c.numero}`, clasificado_por: "pendiente", revisado: false };
      }
      if (c) {
        const categoria = c.tipo === "propia_ahorro" ? "Ahorro/Inversión" : c.tipo === "propia_interna" ? "Movimiento interno" : c.categoria || "Otros";
        return { categoria, quien: c.quien || quien, descripcion: c.nombre || `Cuenta ${c.numero}`, clasificado_por: "cuenta", revisado: true };
      }
      const banco = normalizeComercio(mov.banco_destino);
      const hit2 = matchRule(banco, reglas);
      if (hit2) return fromRule(hit2, banco, quien, false);
      return { categoria: "Otros", quien, descripcion: `Transferencia a ${mov.banco_destino || ""} ${mov.cuenta_destino}`.replace(/\s+/g, " ").trim(), clasificado_por: "pendiente", revisado: false };
    }
    const comercio = mov.comercio || normalizeComercio(mov.comercio_raw || mov.descripcion);
    const hit = matchRule(comercio, reglas);
    if (hit) return { ...fromRule(hit, comercio, quien), comercio };
    return { categoria: "Otros", quien, descripcion: titleCase(comercio), clasificado_por: "pendiente", revisado: false, comercio };
  }
  function applyToSimilar(movs, reglas, cuentas) {
    const changed = [];
    for (const m of movs) {
      if (m.bloqueado || m.clasificado_por !== "pendiente") continue;
      const c = classify(m, { reglas, cuentas });
      if (c.clasificado_por !== "pendiente") changed.push({ ...m, ...c });
    }
    return changed;
  }

  // src/core/money.js
  var DAY = 864e5;
  var MAX_DAYS_BACK = 10;
  var round2 = (n) => Math.round(n * 100) / 100;
  function pickRate(rates, fecha) {
    const target = Date.parse(fecha);
    let best = null;
    for (const r2 of rates) {
      const t = Date.parse(r2.fecha);
      if (t <= target && target - t <= MAX_DAYS_BACK * DAY && (!best || t > Date.parse(best.fecha))) best = r2;
    }
    return best;
  }
  function computeAmounts(monto, moneda, usdUyu) {
    const rate = Number(usdUyu) || null;
    if (moneda === "USD") return { monto_uyu: rate ? round2(monto * rate) : "", monto_usd: monto };
    return { monto_uyu: monto, monto_usd: rate ? round2(monto / rate) : "" };
  }
  var BCU_URL = "https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones";
  var BCU_USD = 2222;
  function buildBcuRequest(desde, hasta) {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cot="Cotiza">
<soapenv:Header/><soapenv:Body><cot:wsbcucotizaciones.Execute><cot:Entrada>
<cot:Moneda><cot:item>${BCU_USD}</cot:item></cot:Moneda>
<cot:FechaDesde>${desde}</cot:FechaDesde><cot:FechaHasta>${hasta}</cot:FechaHasta><cot:Grupo>0</cot:Grupo>
</cot:Entrada></cot:wsbcucotizaciones.Execute></soapenv:Body></soapenv:Envelope>`;
  }
  function parseBcuResponse(xml) {
    const out = [];
    const re = /<Fecha>([\d-]+)<\/Fecha>[\s\S]*?<TCV>([\d.]+)<\/TCV>/g;
    let m;
    while (m = re.exec(xml)) out.push({ fecha: m[1], usd_uyu: Number(m[2]) });
    return out;
  }

  // src/core/pipeline.js
  function safeRate(rateProvider, fecha) {
    try {
      return rateProvider(fecha) || null;
    } catch (e) {
      return null;
    }
  }
  function buildMovimiento(draft, { reglas, cuentas }, rate, now, origen = "gmail") {
    var _a;
    const comercio = normalizeComercio(draft.comercio_raw);
    const base = { ...draft, comercio, bloqueado: false };
    const c = classify(base, { reglas, cuentas });
    return {
      ...base,
      ...c,
      comercio: (_a = c.comercio) != null ? _a : comercio,
      cotizacion: rate || "",
      ...computeAmounts(draft.monto_orig, draft.moneda, rate),
      origen,
      nota: "",
      creado: now,
      modificado: now
    };
  }
  var dupKey = (m) => [m.fecha, m.medio, Number(m.monto_orig), m.moneda, m.comercio_raw || "", m.cuenta_destino || ""].join("|");
  var DUP_NOTE = "Posible duplicado: el mismo aviso llegó en dos mails";
  function processMessages(messages, store, rateProvider, now, origen = "gmail") {
    const nuevos = [];
    const keys = new Set((store.existing || []).map(dupKey));
    const revisar = [];
    let ignorados = 0;
    for (const msg of messages) {
      const parsed = parseItauEmail(msg);
      if (parsed === null) {
        ignorados++;
        continue;
      }
      if (!parsed.ok) {
        revisar.push(msg.id);
        store.log("aviso", "mail_no_leido", `${msg.subject}: ${parsed.reason} | ${String(msg.body).slice(0, 300)}`, msg.id);
        continue;
      }
      for (const d of parsed.movs) {
        if (store.hasId(d.id) || nuevos.some((n) => n.id === d.id)) continue;
        const mov = buildMovimiento(d, store, safeRate(rateProvider, d.fecha), now, origen);
        const k = dupKey(mov);
        if (keys.has(k)) Object.assign(mov, { revisado: false, nota: DUP_NOTE });
        keys.add(k);
        nuevos.push(mov);
      }
    }
    if (nuevos.length) store.appendMovimientos(nuevos);
    return { nuevos: nuevos.length, revisar, ignorados };
  }
  function fillMissingRates(movs, rateProvider) {
    const out = [];
    for (const m of movs) {
      if (m.cotizacion !== "" || !m.fecha || !m.moneda) continue;
      const rate = safeRate(rateProvider, m.fecha);
      if (rate) out.push({ ...m, cotizacion: rate, ...computeAmounts(Number(m.monto_orig), m.moneda, rate) });
    }
    return out;
  }

  // src/core/learn.js
  var seq = 0;
  var newId = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;
  function consolidate(reglas, now) {
    const byToken = /* @__PURE__ */ new Map();
    const seen = /* @__PURE__ */ new Set();
    for (const r2 of reglas.filter((x) => x.tipo === "exacta")) {
      if (seen.has(r2.patron)) continue;
      seen.add(r2.patron);
      for (const t of new Set(tokens(r2.patron))) {
        if (t.length < 4) continue;
        if (!byToken.has(t)) byToken.set(t, []);
        byToken.get(t).push(r2);
      }
    }
    const existing = new Set(reglas.filter((r2) => r2.tipo === "contiene").map((r2) => r2.patron));
    const out = [];
    for (const [t, rs] of byToken) {
      if (rs.length < 2 || existing.has(t)) continue;
      const cats = new Set(rs.map((r2) => r2.categoria));
      if (cats.size !== 1) continue;
      out.push({ id: newId(), tipo: "contiene", patron: t, categoria: rs[0].categoria, quien: "", descripcion: t.charAt(0) + t.slice(1).toLowerCase(), origen: "agrupacion", usos: 0, creada: now, modificada: now });
    }
    return out;
  }

  // src/core/html.js
  var ENTITIES = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    aacute: "á",
    eacute: "é",
    iacute: "í",
    oacute: "ó",
    uacute: "ú",
    ntilde: "ñ",
    uuml: "ü",
    Aacute: "Á",
    Eacute: "É",
    Iacute: "Í",
    Oacute: "Ó",
    Uacute: "Ú",
    Ntilde: "Ñ",
    iexcl: "¡",
    iquest: "¿"
  };
  function htmlToText(html) {
    return String(html || "").replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div|td|tr|h\d|li)>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&([a-z]+);/gi, (m, n) => {
      var _a;
      return (_a = ENTITIES[n]) != null ? _a : m;
    }).replace(/\s+/g, " ").trim();
  }

  // apps-script/main.js
  var SENDER = "comunicaciones@itau.com.uy";
  var LABEL_OK = "Finanzas/Procesado";
  var LABEL_REVISAR = "Finanzas/Revisar";
  var DAILY_LOOKBACK = "newer_than:7d";
  var TIME_BUDGET_MS = 4 * 60 * 1e3;
  var PAGE = 20;
  var GROW_ROWS = 500;
  var TEXT_COLS = /* @__PURE__ */ new Set(["id", "fecha", "cuenta_destino", "numero", "patron", "creado", "modificado", "creada", "modificada", "fecha_hora"]);
  function sheet(tab) {
    const ss = SpreadsheetApp.getActive();
    let sh = ss.getSheetByName(tab.name);
    if (sh) {
      const header = sh.getRange(1, 1, 1, tab.columns.length).getValues()[0].map(String);
      if (header.join("|") !== tab.columns.join("|")) {
        throw new Error(`La pestaña "${tab.name}" ya existe con otras columnas. Renombrala y volvé a ejecutar Configurar.`);
      }
    }
    if (!sh) {
      sh = ss.insertSheet(tab.name);
      sh.getRange(1, 1, 1, tab.columns.length).setValues([tab.columns]).setFontWeight("bold");
      sh.setFrozenRows(1);
      tab.columns.forEach((c, i) => {
        if (TEXT_COLS.has(c)) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat("@");
      });
    }
    return sh;
  }
  function readAll(tab) {
    const sh = sheet(tab);
    const n = sh.getLastRow() - 1;
    if (n < 1) return [];
    const values = sh.getRange(2, 1, n, tab.columns.length).getValues();
    return values.map((row, i) => ({ ...rowToObj(tab.columns, row.map((v) => v instanceof Date ? Utilities.formatDate(v, "America/Montevideo", "yyyy-MM-dd") : v)), _row: i + 2 }));
  }
  function append(tab, objs) {
    if (!objs.length) return;
    const sh = sheet(tab);
    const first = sh.getLastRow() + 1;
    const need = first + objs.length - 1;
    if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), Math.max(objs.length, GROW_ROWS));
    tab.columns.forEach((c, i) => {
      if (TEXT_COLS.has(c)) sh.getRange(first, i + 1, objs.length, 1).setNumberFormat("@");
    });
    sh.getRange(first, 1, objs.length, tab.columns.length).setValues(objs.map((o) => objToRow(tab.columns, o)));
  }
  function updateRows(tab, objs) {
    const sh = sheet(tab);
    for (const o of objs) sh.getRange(o._row, 1, 1, tab.columns.length).setValues([objToRow(tab.columns, o)]);
  }
  function log(nivel, evento, detalle, ref) {
    try {
      append(TABS.log, [{ fecha_hora: nowMontevideoIso(), nivel, evento, detalle: String(detalle || "").slice(0, 500), ref: ref || "" }]);
    } catch (e) {
      console.error("log failed", e);
    }
  }
  function makeRateProvider() {
    let cache = readAll(TABS.cotizaciones);
    const tried = /* @__PURE__ */ new Set();
    return (fecha) => {
      const hit = pickRate(cache, fecha);
      if (hit && (hit.fecha === fecha || tried.has(fecha) || Date.now() - Date.parse(fecha) > 4 * 864e5)) return Number(hit.usd_uyu);
      if (tried.has(fecha)) return null;
      tried.add(fecha);
      const desde = new Date(Date.parse(fecha) - 10 * 864e5).toISOString().slice(0, 10);
      const res = UrlFetchApp.fetch(BCU_URL, {
        method: "post",
        contentType: "text/xml; charset=utf-8",
        headers: { SOAPAction: "" },
        payload: buildBcuRequest(desde, fecha),
        muteHttpExceptions: true
      });
      if (res.getResponseCode() !== 200) throw new Error(`BCU HTTP ${res.getResponseCode()}`);
      const known = new Set(cache.map((c) => c.fecha));
      const fresh = parseBcuResponse(res.getContentText()).filter((r3) => !known.has(r3.fecha)).map((r3) => ({ ...r3, fuente: "BCU 2222 TCV" }));
      append(TABS.cotizaciones, fresh);
      cache = cache.concat(fresh);
      const r2 = pickRate(cache, fecha);
      return r2 ? Number(r2.usd_uyu) : null;
    };
  }
  function label(name) {
    return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
  }
  function collect(query, start, max, deadline) {
    const threads = GmailApp.search(query, start, max);
    const msgs = [];
    let count = 0;
    for (const t of threads) {
      if (deadline && Date.now() > deadline && count > 0) break;
      count++;
      for (const m of t.getMessages()) {
        if (!String(m.getFrom()).toLowerCase().includes(SENDER) && !/^fwd?:/i.test(m.getSubject())) continue;
        msgs.push({ id: m.getId(), subject: m.getSubject(), body: htmlToText(m.getBody()), date: m.getDate().toISOString(), thread: t });
      }
    }
    return { msgs, count, total: threads.length };
  }
  function runBatch(msgs, origen) {
    const movs = readAll(TABS.movimientos);
    const ids = new Set(movs.map((m) => String(m.id)));
    const store = {
      reglas: readAll(TABS.reglas),
      cuentas: readAll(TABS.cuentas),
      hasId: (id) => ids.has(id),
      existing: movs,
      appendMovimientos: (rows) => append(TABS.movimientos, rows),
      log
    };
    const result = processMessages(msgs, store, makeRateProvider(), nowMontevideoIso(), origen);
    const revisar = new Set(result.revisar);
    const ok = label(LABEL_OK);
    const bad = label(LABEL_REVISAR);
    for (const m of msgs) (revisar.has(m.id) ? bad : ok).addToThread(m.thread);
    return result;
  }
  function mantenimiento() {
    const reglas = readAll(TABS.reglas);
    const nuevas = consolidate(reglas, nowMontevideoIso());
    append(TABS.reglas, nuevas);
    if (nuevas.length) log("info", "reglas_agrupadas", nuevas.map((r2) => `${r2.patron}→${r2.categoria}`).join(", "));
    const movs = readAll(TABS.movimientos);
    const cuentas = readAll(TABS.cuentas);
    const reclasificados = applyToSimilar(movs, reglas.concat(nuevas), cuentas);
    let conTasa = [];
    try {
      conTasa = fillMissingRates(movs, makeRateProvider());
    } catch (e) {
      log("aviso", "bcu", e.message);
    }
    const byRow = /* @__PURE__ */ new Map();
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
    if (!lock.tryLock(3e4)) {
      log("aviso", "lock", "Otra ejecución en curso");
      return null;
    }
    try {
      return fn();
    } finally {
      lock.releaseLock();
    }
  }
  function dailyQuery() {
    const last = PropertiesService.getScriptProperties().getProperty("LAST_OK");
    if (!last) return `from:${SENDER} ${DAILY_LOOKBACK}`;
    const d = new Date(Date.parse(last) - 2 * 864e5).toISOString().slice(0, 10).replace(/-/g, "/");
    return `from:${SENDER} after:${d}`;
  }
  function procesarDiario() {
    return withLock(() => {
      const q = dailyQuery();
      const msgs = [];
      for (let start = 0; ; start += 100) {
        const page = collect(q, start, 100);
        msgs.push(...page.msgs);
        if (page.total < 100) break;
      }
      const r2 = runBatch(msgs, "gmail");
      PropertiesService.getScriptProperties().setProperty("LAST_OK", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
      const m = mantenimiento();
      log("info", "ejecucion", `nuevos=${r2.nuevos} revisar=${r2.revisar.length} reglas=${m.reglas} reclasificados=${m.reclasificados}`);
      return r2;
    });
  }
  function procesarAhora() {
    const r2 = procesarDiario();
    if (!r2) {
      SpreadsheetApp.getUi().alert("Hay otra ejecución en curso. Probá en un minuto.");
      return;
    }
    SpreadsheetApp.getUi().alert(`Listo: ${r2.nuevos} movimientos nuevos, ${r2.revisar.length} mails para revisar.`);
  }
  function consolidarReglas() {
    const m = withLock(mantenimiento);
    if (!m) {
      SpreadsheetApp.getUi().alert("Hay otra ejecución en curso. Probá en un minuto.");
      return;
    }
    SpreadsheetApp.getUi().alert(`Reglas nuevas: ${m.reglas}. Reclasificados: ${m.reclasificados}.`);
  }
  function reconstruir() {
    const ui = SpreadsheetApp.getUi();
    const resp = ui.prompt("Reconstruir historial", "Desde qué fecha (AAAA-MM-DD):", ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    const desde = resp.getResponseText().trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      ui.alert("Fecha inválida");
      return;
    }
    PropertiesService.getScriptProperties().setProperty("BACKFILL", JSON.stringify({ desde, start: 0, nuevos: 0 }));
    continuarReconstruccion();
    ui.alert("Reconstrucción en marcha. Si hay muchos mails sigue sola en segundo plano; mirá la pestaña Log.");
  }
  function continuarReconstruccion() {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty("BACKFILL");
    const triggers = () => ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "continuarReconstruccion");
    triggers().forEach((t) => ScriptApp.deleteTrigger(t));
    if (!raw) return;
    ScriptApp.newTrigger("continuarReconstruccion").timeBased().after(2 * 60 * 1e3).create();
    const st = JSON.parse(raw);
    const deadline = Date.now() + TIME_BUDGET_MS;
    try {
      withLock(() => {
        const q = `from:${SENDER} after:${st.desde.replace(/-/g, "/")}`;
        while (Date.now() < deadline) {
          const { msgs, count } = collect(q, st.start, PAGE, deadline);
          if (!count) {
            st.done = true;
            break;
          }
          st.nuevos += runBatch(msgs, "historico").nuevos;
          st.start += count;
          props.setProperty("BACKFILL", JSON.stringify(st));
        }
      });
    } catch (e) {
      log("error", "reconstruccion_error", `${e.message} (start=${st.start}); se reintenta en 2 minutos`);
      return;
    }
    if (st.done) {
      triggers().forEach((t) => ScriptApp.deleteTrigger(t));
      props.deleteProperty("BACKFILL");
      withLock(mantenimiento);
      log("info", "reconstruccion_fin", `desde=${st.desde} nuevos=${st.nuevos}`);
    } else {
      log("info", "reconstruccion_parcial", `start=${st.start} nuevos=${st.nuevos}`);
    }
  }
  function configurar() {
    for (const tab of Object.values(TABS)) sheet(tab);
    if (!readAll(TABS.categorias).length) append(TABS.categorias, SEED_CATEGORIAS);
    if (!readAll(TABS.reglas).length) {
      const now = nowMontevideoIso();
      append(TABS.reglas, SEED_REGLAS.map((r2, i) => ({ id: `s${i + 1}`, quien: "", origen: "semilla", usos: 0, creada: now, modificada: now, ...r2 })));
    }
    label(LABEL_OK);
    label(LABEL_REVISAR);
    ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "procesarDiario").forEach((t) => ScriptApp.deleteTrigger(t));
    ScriptApp.newTrigger("procesarDiario").timeBased().atHour(6).everyDays(1).inTimezone("America/Montevideo").create();
    log("info", "configuracion", "Pestañas, semillas, etiquetas y disparador diario listos");
    SpreadsheetApp.getUi().alert("Configuración lista. Completá la pestaña Cuentas y después usá Finanzas → Reconstruir historial.");
  }
  function onOpen() {
    SpreadsheetApp.getUi().createMenu("Finanzas").addItem("Procesar ahora", "procesarAhora").addItem("Consolidar reglas", "consolidarReglas").addItem("Reconstruir historial…", "reconstruir").addSeparator().addItem("Configurar (primera vez)", "configurar").addToUi();
  }
  return __toCommonJS(main_exports);
})();

function procesarDiario() { return FH.procesarDiario.apply(null, arguments); }
function procesarAhora() { return FH.procesarAhora.apply(null, arguments); }
function consolidarReglas() { return FH.consolidarReglas.apply(null, arguments); }
function reconstruir() { return FH.reconstruir.apply(null, arguments); }
function continuarReconstruccion() { return FH.continuarReconstruccion.apply(null, arguments); }
function configurar() { return FH.configurar.apply(null, arguments); }
function onOpen() { return FH.onOpen.apply(null, arguments); }

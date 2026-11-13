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
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // apps-script/main.js
  var main_exports = {};
  __export(main_exports, {
    conciliarEstadosAhora: () => conciliarEstadosAhora,
    configurar: () => configurar,
    configurarPush: () => configurarPush,
    consolidarReglas: () => consolidarReglas,
    continuarReconstruccion: () => continuarReconstruccion,
    doPost: () => doPost,
    importarPlanillaVieja: () => importarPlanillaVieja,
    onOpen: () => onOpen,
    procesarAhora: () => procesarAhora,
    procesarDiario: () => procesarDiario,
    reconstruir: () => reconstruir,
    sincronizarInversiones: () => sincronizarInversiones
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
        "modificado",
        "parte"
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
    columns.forEach((c, i2) => {
      let v = row[i2];
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
  function celdaSegura(v) {
    if (typeof v !== "string") return v;
    return /^[=+@]/.test(v) || /^-[^\d.,\s]/.test(v) ? `'${v}` : v;
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
      "Ropa",
      "Deporte",
      "Educación",
      "Otros"
    ],
    "No es gasto": NO_GASTO,
    Ingresos: ["Sueldo", "Otros ingresos"]
  };
  var SEED_CATEGORIAS = Object.entries(CATS).flatMap(
    ([grupo, nombres]) => nombres.map((nombre) => ({ nombre, grupo, activa: true }))
  ).map((c, i2) => ({ ...c, orden: i2 + 1 }));
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
    const p = PARSERS.find((x2) => x2.subject.test(subject || ""));
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
    const c = last4 && cuentas.find((x2) => x2.tipo === "tarjeta_propia" && String(x2.numero) === last4);
    return c && c.titular || "Compartido";
  }
  function matchRule(comercio, reglas) {
    if (!comercio) return null;
    const exact = reglas.find((r3) => r3.tipo === "exacta" && r3.patron === comercio);
    if (exact) return { regla: exact, por: "regla_exacta" };
    const padded = ` ${comercio} `;
    const hits = reglas.filter((r3) => r3.tipo === "contiene" && r3.patron && padded.includes(` ${r3.patron} `));
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
      const c = cuentas.find((x2) => String(x2.numero) === String(mov.cuenta_destino));
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
    for (const r3 of rates) {
      const t = Date.parse(r3.fecha);
      if (t <= target && target - t <= MAX_DAYS_BACK * DAY && (!best || t > Date.parse(best.fecha))) best = r3;
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
    var _a2;
    const comercio = normalizeComercio(draft.comercio_raw);
    const base = { ...draft, comercio, bloqueado: false };
    const c = classify(base, { reglas, cuentas });
    return {
      ...base,
      ...c,
      comercio: (_a2 = c.comercio) != null ? _a2 : comercio,
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
    const pushes = (store.existing || []).filter((m) => m.origen === "push").map((m) => ({ m, usado: false }));
    const yaPorPush = (d) => {
      const p = pushes.find((x2) => !x2.usado && x2.m.medio === d.medio && Number(x2.m.monto_orig) === Number(d.monto_orig) && x2.m.moneda === d.moneda && Math.abs(Date.parse(x2.m.fecha) - Date.parse(d.fecha)) <= 864e5);
      if (p) p.usado = true;
      return !!p;
    };
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
        if (yaPorPush(d)) continue;
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
    for (const r3 of reglas.filter((x2) => x2.tipo === "exacta")) {
      if (seen.has(r3.patron)) continue;
      seen.add(r3.patron);
      for (const t of new Set(tokens(r3.patron))) {
        if (t.length < 4) continue;
        if (!byToken.has(t)) byToken.set(t, []);
        byToken.get(t).push(r3);
      }
    }
    const existing = new Set(reglas.filter((r3) => r3.tipo === "contiene").map((r3) => r3.patron));
    const out = [];
    for (const [t, rs] of byToken) {
      if (rs.length < 2 || existing.has(t)) continue;
      const cats = new Set(rs.map((r3) => r3.categoria));
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
      var _a2;
      return (_a2 = ENTITIES[n]) != null ? _a2 : m;
    }).replace(/\s+/g, " ").trim();
  }

  // src/core/legacy.js
  var CAT = {
    comidasocial: "ComidaSocial",
    diversion: "Diversión",
    transporte: "Transporte",
    trasporte: "Transporte",
    casa: "Casa",
    regalos: "Regalos y Cumpleaños",
    regalo: "Regalos y Cumpleaños",
    cumpleanos: "Regalos y Cumpleaños",
    "higiene/salud": "Salud",
    higiene: "Salud",
    salud: "Salud",
    "estetica/cosmetica": "Estética/Cosmética",
    donacion: "Donación",
    "servicios mensuales": "Servicios",
    subscripciones: "Suscripciones",
    suscripciones: "Suscripciones",
    tarjeta: "Bancos/Comisiones",
    ropa: "Ropa",
    deporte: "Deporte",
    estudio: "Educación",
    otro: "Otros",
    "": "Otros"
  };
  var key = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  function parseLegacyAmount(s) {
    let t = String(s != null ? s : "").trim();
    if (!t) return NaN;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    else if ((t.match(/\./g) || []).length > 1) {
      const i2 = t.lastIndexOf(".");
      t = t.slice(0, i2).replace(/\./g, "") + t.slice(i2);
    } else if (/^-?\d{1,3}\.\d{3}$/.test(t)) t = t.replace(".", "");
    return Number(t);
  }
  function legacyCategoria(cat, descripcion) {
    const k = key(cat);
    if (k === "alimentacion") return /pedidos ?ya|rappi/i.test(descripcion) ? "Delivery" : "Supermercado";
    return CAT[k] || "Otros";
  }
  function importLegacyRows(rows, { hasta, now }) {
    const movs = [];
    let omitidas = 0;
    rows.slice(1).forEach((r3, i2) => {
      const [anio, mes, quienRaw, desc, montoRaw, coment, cat] = r3;
      const fechaMes = `${anio}-${String(mes).padStart(2, "0")}`;
      const monto = parseLegacyAmount(montoRaw);
      if (!/^\d{4}-\d{2}$/.test(fechaMes) || !Number.isFinite(monto) || r3.length < 5) {
        omitidas++;
        return;
      }
      if (fechaMes > hasta || monto <= 0) {
        omitidas++;
        return;
      }
      const esTotal = /^total/i.test(String(cat || ""));
      const moneda = esTotal && /dol/i.test(desc) ? "USD" : "UYU";
      const quien = ["Juani", "Mili"].includes(String(quienRaw).trim()) ? String(quienRaw).trim() : "Compartido";
      const descripcion = esTotal ? `${desc} (total sin detalle)` : String(desc || "").trim();
      movs.push({
        id: `hist-${i2 + 2}`,
        fecha: `${fechaMes}-15`,
        tipo: "manual",
        medio: `Planilla (${String(coment || "").trim() || "sin dato"})`,
        comercio_raw: String(desc || "").trim(),
        comercio: normalizeComercio(desc),
        cuenta_destino: "",
        banco_destino: "",
        descripcion,
        monto_orig: monto,
        moneda,
        cotizacion: "",
        monto_uyu: moneda === "UYU" ? monto : "",
        monto_usd: moneda === "USD" ? monto : "",
        categoria: esTotal ? "Otros" : legacyCategoria(cat, desc),
        quien,
        clasificado_por: "manual",
        revisado: true,
        bloqueado: true,
        origen: "historico",
        nota: "Importado de Gastos Mensuales",
        creado: now,
        modificado: now
      });
    });
    return { movs, omitidas };
  }

  // src/core/inversiones.js
  var DAY2 = 864e5;
  var usd = (s) => Number(String(s != null ? s : "").replace(/[$\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  function parseDate(s) {
    const m = String(s || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
  }
  function inversionesToMovs(rows, existentes, now) {
    const start = rows.findIndex((r3) => String(r3[2]).trim() === "Depósitos" && String(r3[3]).trim() === "USD");
    if (start < 0) return [];
    const ids = new Set(existentes.map((m) => String(m.id)));
    const ahorros = existentes.filter((m) => m.categoria === "Ahorro/Inversión" && m.moneda === "USD");
    const out = [];
    for (const r3 of rows.slice(start + 1)) {
      const fecha = parseDate(r3[2]);
      const monto = usd(r3[3]);
      if (!fecha || !(monto > 0)) continue;
      const id = `inv-${fecha}-${monto}`;
      if (ids.has(id)) continue;
      const t = Date.parse(fecha);
      if (ahorros.some((m) => Number(m.monto_orig) === monto && Math.abs(Date.parse(m.fecha) - t) <= 3 * DAY2)) continue;
      ids.add(id);
      out.push({
        id,
        fecha,
        tipo: "manual",
        medio: "Planilla Inversiones",
        comercio_raw: "Depósito inversión",
        comercio: "DEPOSITO INVERSION",
        cuenta_destino: "",
        banco_destino: "",
        descripcion: "Depósito inversión (BROU)",
        monto_orig: monto,
        moneda: "USD",
        cotizacion: "",
        monto_uyu: "",
        monto_usd: monto,
        categoria: "Ahorro/Inversión",
        quien: "Compartido",
        clasificado_por: "manual",
        revisado: true,
        bloqueado: true,
        origen: "historico",
        nota: "Importado de Inversiones",
        creado: now,
        modificado: now
      });
    }
    return out;
  }

  // node_modules/fflate/esm/browser.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r3 = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r3[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r: r3 };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var hMap = (function(cd, mb, r3) {
    var s = cd.length;
    var i2 = 0;
    var l = new u16(mb);
    for (; i2 < s; ++i2) {
      if (cd[i2])
        ++l[cd[i2] - 1];
    }
    var le = new u16(mb);
    for (i2 = 1; i2 < mb; ++i2) {
      le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
    }
    var co;
    if (r3) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          var sv = i2 << 4 | cd[i2];
          var r_1 = mb - cd[i2];
          var v = le[cd[i2] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
        }
      }
    }
    return co;
  });
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
  var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
  var max = function(a) {
    var m = a[0];
    for (var i2 = 1; i2 < a.length; ++i2) {
      if (a[i2] > m)
        m = a[i2];
    }
    return m;
  };
  var bits = function(d, p, m) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
  };
  var bits16 = function(d, p) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
  };
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    // determined by compression function
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var inflt = function(dat, st, buf, dict) {
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
      return buf || new u8(0);
    var noBuf = !buf;
    var resize = noBuf || st.i != 2;
    var noSt = st.i;
    if (noBuf)
      buf = new u8(sl * 3);
    var cbuf = function(l2) {
      var bl = buf.length;
      if (l2 > bl) {
        var nbuf = new u8(Math.max(bl * 2, l2));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    var tbts = sl * 8;
    do {
      if (!lm) {
        final = bits(dat, pos, 1);
        var type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
          if (t > sl) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + l);
          buf.set(dat.subarray(s, t), bt);
          st.b = bt += l, st.p = pos = t * 8, st.f = final;
          continue;
        } else if (type == 1)
          lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
        else if (type == 2) {
          var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
          var tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          var ldt = new u8(tl);
          var clt = new u8(19);
          for (var i2 = 0; i2 < hcLen; ++i2) {
            clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
          }
          pos += hcLen * 3;
          var clb = max(clt), clbmsk = (1 << clb) - 1;
          var clm = hMap(clt, clb, 1);
          for (var i2 = 0; i2 < tl; ) {
            var r3 = clm[bits(dat, pos, clbmsk)];
            pos += r3 & 15;
            var s = r3 >> 4;
            if (s < 16) {
              ldt[i2++] = s;
            } else {
              var c = 0, n = 0;
              if (s == 16)
                n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
              else if (s == 17)
                n = 3 + bits(dat, pos, 7), pos += 3;
              else if (s == 18)
                n = 11 + bits(dat, pos, 127), pos += 7;
              while (n--)
                ldt[i2++] = c;
            }
          }
          var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
          lbt = max(lt);
          dbt = max(dt);
          lm = hMap(lt, lbt, 1);
          dm = hMap(dt, dbt, 1);
        } else
          err(1);
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
      }
      if (resize)
        cbuf(bt + 131072);
      var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
      var lpos = pos;
      for (; ; lpos = pos) {
        var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
        pos += c & 15;
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (!c)
          err(2);
        if (sym < 256)
          buf[bt++] = sym;
        else if (sym == 256) {
          lpos = pos, lm = null;
          break;
        } else {
          var add = sym - 254;
          if (sym > 264) {
            var i2 = sym - 257, b = fleb[i2];
            add = bits(dat, pos, (1 << b) - 1) + fl[i2];
            pos += b;
          }
          var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
          if (!d)
            err(3);
          pos += d & 15;
          var dt = fd[dsym];
          if (dsym > 3) {
            var b = fdeb[dsym];
            dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
          }
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + 131072);
          var end = bt + add;
          if (bt < dt) {
            var shift = dl - dt, dend = Math.min(dt, end);
            if (shift + bt < 0)
              err(3);
            for (; bt < dend; ++bt)
              buf[bt] = dict[shift + bt];
          }
          for (; bt < end; ++bt)
            buf[bt] = buf[bt - dt];
        }
      }
      st.l = lm, st.p = lpos, st.b = bt, st.f = final;
      if (lm)
        final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
  };
  var et = /* @__PURE__ */ new u8(0);
  var zls = function(d, dict) {
    if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31)
      err(6, "invalid zlib data");
    if ((d[1] >> 5 & 1) == +!dict)
      err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
    return (d[1] >> 3 & 4) + 2;
  };
  function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
  }
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }

  // src/core/pdf.js
  var WIN_ANSI_80 = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
  function latin1(bytes) {
    let s = "";
    for (let i2 = 0; i2 < bytes.length; i2 += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i2, i2 + 32768));
    return s;
  }
  var winAnsi = (code) => code >= 128 && code <= 159 ? WIN_ANSI_80[code - 128] : String.fromCharCode(code);
  function unescapePdfString(raw) {
    var _a2;
    let out = "";
    for (let i2 = 0; i2 < raw.length; i2++) {
      const c = raw[i2];
      if (c !== "\\") {
        out += winAnsi(raw.charCodeAt(i2));
        continue;
      }
      const n = raw[++i2];
      if (/[0-7]/.test(n)) {
        let oct = n;
        while (oct.length < 3 && /[0-7]/.test(raw[i2 + 1])) oct += raw[++i2];
        out += winAnsi(parseInt(oct, 8) & 255);
      } else out += (_a2 = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f" }[n]) != null ? _a2 : n;
    }
    return out;
  }
  function* streams(bytes) {
    const s = latin1(bytes);
    const re = /<<((?:(?!>>\s*stream)[\s\S])*?)>>\s*stream\r?\n/g;
    let m;
    while (m = re.exec(s)) {
      const dict = m[1];
      const start = m.index + m[0].length;
      const len = /\/Length (\d+)(?!\s+\d+\s+R)/.exec(dict);
      const end = len ? start + Number(len[1]) : s.indexOf("endstream", start);
      re.lastIndex = Math.max(re.lastIndex, end);
      if (/\/Subtype\s*\/Image/.test(dict) || !/\/FlateDecode/.test(dict)) continue;
      try {
        yield latin1(unzlibSync(bytes.subarray(start, end)));
      } catch (e) {
      }
    }
  }
  function pdfTextLines(bytes) {
    const out = [];
    for (const content of streams(bytes)) {
      const items = [];
      for (const bt of content.match(/BT[\s\S]*?ET/g) || []) {
        let x2 = 0, y = 0;
        const tok = /(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) Tm|(-?[\d.]+) (-?[\d.]+) T[dD]|\(((?:\\[\s\S]|[^\\)])*)\)\s*Tj/g;
        for (const t of bt.matchAll(tok)) {
          if (t[1] !== void 0) {
            x2 = Number(t[5]);
            y = Number(t[6]);
          } else if (t[7] !== void 0) {
            x2 += Number(t[7]);
            y += Number(t[8]);
          } else items.push({ y, x: x2, text: unescapePdfString(t[9]) });
        }
      }
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      out.push(...items.map((i2) => i2.text));
    }
    return out;
  }

  // src/core/estadoCuenta.js
  var AMOUNT = /-?[\d.]+,\d\d/g;
  var COL_USD = 114;
  var COL_UYU = 100;
  var VENTANA_DIAS = 7;
  var DAY3 = 864e5;
  var r2 = (n) => Math.round(n * 100) / 100;
  var num = (s) => Number(s.replace(/\./g, "").replace(",", "."));
  var fechaISO = (d, m, y) => `20${y}-${m}-${d}`;
  function montos(line) {
    const out = {};
    for (const m of line.matchAll(AMOUNT)) {
      const end = m.index + m[0].length;
      if (end >= COL_USD) out.USD = num(m[0]);
      else if (end >= COL_UYU) out.UYU = num(m[0]);
    }
    return out;
  }
  var CARGO_BANCO = /SEGURO DE VIDA|REDUC\.? IVA|INTERES|COMISION|RECARGO|IMPUESTO|IVA S\/?/i;
  function parseEstadoCuenta(lines) {
    let cierre = null;
    const items = [];
    for (const line of lines) {
      const c = /^\s*(\d\d)\/(\d\d)\/(\d\d)\s*$/.exec(line);
      if (c && !cierre) {
        cierre = fechaISO(c[1], c[2], c[3]);
        continue;
      }
      const m = /^\s*(\d\d) (\d\d) (\d\d)\s+(\d{4})\s+(.+?)(?:\s{2,}|$)/.exec(line);
      if (m) {
        const resto = line.slice(m.index + m[0].length);
        const primerMonto = resto.search(AMOUNT);
        const q = /(\d{1,2})\/\s?(\d{1,2})/.exec(primerMonto >= 0 ? resto.slice(0, primerMonto) : resto);
        const base = { fecha: fechaISO(m[1], m[2], m[3]), tarjeta: m[4], comercio: m[5].trim(), cuota: q ? { n: Number(q[1]), de: Number(q[2]) } : null };
        const a = montos(line);
        if (a.UYU !== void 0) items.push({ ...base, monto: a.UYU, moneda: "UYU" });
        else if (a.USD !== void 0) items.push({ ...base, monto: a.USD, moneda: "USD" });
        continue;
      }
      const lead = line.length - line.trimStart().length;
      const texto = line.trim();
      if (lead >= 26 && lead <= 30 && !/^SALDO|^PAGOS/.test(texto) && CARGO_BANCO.test(texto)) {
        const comercio = texto.replace(AMOUNT, "").trim();
        const a = montos(line);
        for (const moneda of ["UYU", "USD"]) if (a[moneda]) items.push({ fecha: null, tarjeta: "", comercio, cuota: null, monto: a[moneda], moneda });
      }
    }
    for (const i2 of items) if (!i2.fecha) i2.fecha = cierre;
    return { cierre, items };
  }
  var NO_CRUZAR = /* @__PURE__ */ new Set(["transferencia", "consumo_debito", "pago_tarjeta"]);
  var dias = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / DAY3;
  function conciliar(ec2, existentes, ctx) {
    const pool = existentes.filter((m) => !NO_CRUZAR.has(m.tipo)).map((m) => ({ m, usado: false }));
    const buscar = (moneda, monto, fecha, tol) => {
      let best = null;
      for (const p of pool) {
        if (p.usado || p.m.moneda !== moneda || Math.abs(Number(p.m.monto_orig) - monto) > tol) continue;
        const d = dias(p.m.fecha, fecha);
        if (d <= VENTANA_DIAS && (!best || d < best.d)) best = { p, d };
      }
      if (best) best.p.usado = true;
      return !!best;
    };
    let pendientes = [];
    for (const it of ec2.items) {
      if (!it.fecha || it.fecha < (ctx.desde || "")) continue;
      if (it.cuota && it.cuota.n > 1) continue;
      const total = it.cuota ? r2(it.monto * it.cuota.de) : it.monto;
      const tol = it.cuota ? it.cuota.de * 0.01 + 0.02 : 5e-3;
      if (!buscar(it.moneda, total, it.fecha, tol)) pendientes.push({ ...it, total });
    }
    const esIva = (i2) => /REDUC\.? IVA/i.test(i2.comercio);
    for (const iva of pendientes.filter(esIva)) {
      const compra = pendientes.find((c) => !esIva(c) && c.fecha === iva.fecha && c.moneda === iva.moneda && buscar(c.moneda, r2(c.total + iva.total), c.fecha, 0.01));
      if (compra) pendientes = pendientes.filter((i2) => i2 !== compra && i2 !== iva);
    }
    const porGrupo = (clave) => {
      const grupos = /* @__PURE__ */ new Map();
      for (const it of pendientes) grupos.set(clave(it), [...grupos.get(clave(it)) || [], it]);
      for (const g of grupos.values()) {
        if (g.length < 2) continue;
        const suma = r2(g.reduce((a, i2) => a + i2.total, 0));
        if (buscar(g[0].moneda, suma, g[0].fecha, 0.01 * g.length)) pendientes = pendientes.filter((i2) => !g.includes(i2));
      }
    };
    porGrupo((it) => `${it.fecha}|${it.moneda}|${it.comercio.split(/\s+/)[0]}`);
    porGrupo((it) => `${it.fecha}|${it.moneda}`);
    const nuevos = [];
    const vistos = /* @__PURE__ */ new Map();
    for (const it of pendientes) {
      const key2 = `${it.fecha}-${it.tarjeta || "banco"}-${it.total}-${it.moneda}`;
      const k = (vistos.get(key2) || 0) + 1;
      vistos.set(key2, k);
      const draft = {
        id: `edc-${key2}-${k}`,
        fecha: it.fecha,
        tipo: "consumo_credito",
        medio: it.tarjeta ? `Visa ${it.tarjeta}` : "Visa",
        comercio_raw: it.comercio,
        cuenta_destino: "",
        banco_destino: "",
        monto_orig: it.total,
        moneda: it.moneda
      };
      const rate = ctx.rateFor ? safe(() => ctx.rateFor(it.fecha)) : null;
      const mov = buildMovimiento(draft, ctx, rate, ctx.now || "", "estado_cuenta");
      if (!it.tarjeta || CARGO_BANCO.test(it.comercio)) Object.assign(mov, { categoria: "Bancos/Comisiones", clasificado_por: "regla_contiene", revisado: true });
      mov.nota = it.cuota ? `Compra en ${it.cuota.de} cuotas · agregado desde el estado de cuenta` : "Agregado desde el estado de cuenta (no llegó aviso)";
      nuevos.push(mov);
    }
    return nuevos;
  }
  function safe(f) {
    try {
      return f() || null;
    } catch (e) {
      return null;
    }
  }

  // src/core/push.js
  var MONEDA = { UYU: "UYU", $: "UYU", USD: "USD", U$S: "USD", "US$": "USD" };
  var CREDITO = /tarjeta\s+VISA\s+Nro\.?\s*\*+\s*(\d{4})\s+por\s+(UYU|USD|U\$S|US\$|\$)\s*([\d.,]+?)\s+en\s+(.+?)\.?\s*$/i;
  var num2 = (s) => Number(/,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));
  function parsePush(text, receivedAt) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    const m = CREDITO.exec(t);
    if (!m) return { ok: false, reason: "Formato de push no reconocido" };
    const monto = num2(m[3]);
    if (!Number.isFinite(monto)) return { ok: false, reason: `Monto inválido: ${m[3]}` };
    return {
      ok: true,
      mov: {
        fecha: toMontevideoDate(receivedAt),
        tipo: "consumo_credito",
        medio: `Visa ${m[1]}`,
        monto_orig: monto,
        moneda: MONEDA[m[2].toUpperCase()],
        comercio_raw: m[4].trim(),
        cuenta_destino: "",
        banco_destino: ""
      }
    };
  }
  function hash(s) {
    let h = 5381;
    for (let i2 = 0; i2 < s.length; i2++) h = (h * 33 ^ s.charCodeAt(i2)) >>> 0;
    return h.toString(36);
  }
  function pushToMovimiento(text, receivedAt, ctx, rate, now) {
    const p = parsePush(text, receivedAt);
    if (!p.ok) return p;
    const bucket = Math.floor(Date.parse(receivedAt) / 6e5);
    const id = `push-${hash(`${p.mov.medio}|${p.mov.monto_orig}|${p.mov.moneda}|${p.mov.comercio_raw}|${bucket}`)}`;
    return { ok: true, mov: buildMovimiento({ ...p.mov, id }, ctx, rate, now, "push") };
  }

  // apps-script/main.js
  var SENDER = "comunicaciones@itau.com.uy";
  var LABEL_OK = "Finanzas/Procesado";
  var REENVIADORES = ["juanmartinez.smc@gmail.com", "mmarizcurrena.smc@gmail.com"];
  var LABEL_REVISAR = "Finanzas/Revisar";
  var DAILY_LOOKBACK = "newer_than:7d";
  var EDC_SENDER = "info-mail@itau.com.uy";
  var LABEL_EDC = "Finanzas/EstadoCuenta";
  var EDC_DESDE = "2026-01-01";
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
      tab.columns.forEach((c, i2) => {
        if (TEXT_COLS.has(c)) sh.getRange(1, i2 + 1, sh.getMaxRows(), 1).setNumberFormat("@");
      });
    }
    return sh;
  }
  function readAll(tab) {
    const sh = sheet(tab);
    const n = sh.getLastRow() - 1;
    if (n < 1) return [];
    const values = sh.getRange(2, 1, n, tab.columns.length).getValues();
    return values.map((row, i2) => ({ ...rowToObj(tab.columns, row.map((v) => v instanceof Date ? Utilities.formatDate(v, "America/Montevideo", "yyyy-MM-dd") : v)), _row: i2 + 2 }));
  }
  function append(tab, objs) {
    if (!objs.length) return;
    const sh = sheet(tab);
    const first = sh.getLastRow() + 1;
    const need = first + objs.length - 1;
    if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), Math.max(objs.length, GROW_ROWS));
    tab.columns.forEach((c, i2) => {
      if (TEXT_COLS.has(c)) sh.getRange(first, i2 + 1, objs.length, 1).setNumberFormat("@");
    });
    sh.getRange(first, 1, objs.length, tab.columns.length).setValues(objs.map((o) => objToRow(tab.columns, o).map(celdaSegura)));
  }
  function updateRows(tab, objs) {
    const sh = sheet(tab);
    for (const o of objs) sh.getRange(o._row, 1, 1, tab.columns.length).setValues([objToRow(tab.columns, o).map(celdaSegura)]);
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
      const fresh = parseBcuResponse(res.getContentText()).filter((r4) => !known.has(r4.fecha)).map((r4) => ({ ...r4, fuente: "BCU 2222 TCV" }));
      append(TABS.cotizaciones, fresh);
      cache = cache.concat(fresh);
      const r3 = pickRate(cache, fecha);
      return r3 ? Number(r3.usd_uyu) : null;
    };
  }
  function label(name) {
    return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
  }
  function collect(query, start, max2, deadline) {
    const threads = GmailApp.search(query, start, max2);
    const msgs = [];
    let count = 0;
    for (const t of threads) {
      if (deadline && Date.now() > deadline && count > 0) break;
      count++;
      for (const m of t.getMessages()) {
        const from = String(m.getFrom()).toLowerCase();
        if (!from.includes(SENDER) && !(/^fwd?:/i.test(m.getSubject()) && REENVIADORES.some((r3) => from.includes(r3)))) continue;
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
  function conciliarEstados(deadline) {
    const q = `from:${EDC_SENDER} subject:"estado de cuenta Visa" has:attachment after:${EDC_DESDE.replace(/-/g, "/")} -label:${LABEL_EDC.replace("/", "-")}`;
    const threads = GmailApp.search(q, 0, 24);
    const msgs = [];
    for (const t of threads) for (const m of t.getMessages()) msgs.push({ m, t });
    msgs.sort((a, b) => a.m.getDate() - b.m.getDate());
    if (!msgs.length) return { estados: 0, agregados: 0 };
    let movs = readAll(TABS.movimientos);
    const ids = new Set(movs.map((m) => String(m.id)));
    const ctx = { reglas: readAll(TABS.reglas), cuentas: readAll(TABS.cuentas), desde: EDC_DESDE, now: nowMontevideoIso(), rateFor: makeRateProvider() };
    const ok = label(LABEL_EDC);
    let estados = 0, agregados = 0;
    for (const { m, t } of msgs) {
      if (deadline && Date.now() > deadline) break;
      const pdf = m.getAttachments().find((a) => /\.pdf$/i.test(a.getName()));
      if (!pdf) continue;
      const ec2 = parseEstadoCuenta(pdfTextLines(Uint8Array.from(pdf.getBytes(), (b) => b & 255)));
      if (!ec2.cierre || !ec2.items.length) {
        log("aviso", "estado_cuenta_no_leido", `No pude leer el estado de cuenta "${m.getSubject()}" del ${m.getDate().toISOString().slice(0, 10)}`, m.getId());
        label(LABEL_REVISAR).addToThread(t);
        continue;
      }
      const nuevos = conciliar(ec2, movs, ctx).filter((n) => !ids.has(n.id));
      append(TABS.movimientos, nuevos);
      for (const n of nuevos) ids.add(n.id);
      movs = movs.concat(nuevos);
      ok.addToThread(t);
      estados++;
      agregados += nuevos.length;
      log("info", "estado_cuenta", `cierre=${ec2.cierre} lineas=${ec2.items.length} agregados=${nuevos.length}`, m.getId());
    }
    return { estados, agregados };
  }
  function syncInversiones() {
    const sh = SpreadsheetApp.getActive().getSheetByName("Inversiones");
    if (!sh) return 0;
    const nuevos = inversionesToMovs(sh.getDataRange().getDisplayValues(), readAll(TABS.movimientos), nowMontevideoIso());
    append(TABS.movimientos, nuevos);
    if (nuevos.length) log("info", "inversiones", `depositos_nuevos=${nuevos.length}`);
    return nuevos.length;
  }
  function mantenimiento() {
    try {
      syncInversiones();
    } catch (e) {
      log("aviso", "inversiones", e.message);
    }
    const reglas = readAll(TABS.reglas);
    const nuevas = consolidate(reglas, nowMontevideoIso());
    append(TABS.reglas, nuevas);
    if (nuevas.length) log("info", "reglas_agrupadas", nuevas.map((r3) => `${r3.patron}→${r3.categoria}`).join(", "));
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
      const r3 = runBatch(msgs, "gmail");
      PropertiesService.getScriptProperties().setProperty("LAST_OK", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
      try {
        conciliarEstados(Date.now() + TIME_BUDGET_MS);
      } catch (e) {
        log("aviso", "estado_cuenta", e.message);
      }
      const m = mantenimiento();
      log("info", "ejecucion", `nuevos=${r3.nuevos} revisar=${r3.revisar.length} reglas=${m.reglas} reclasificados=${m.reclasificados}`);
      return r3;
    });
  }
  function procesarAhora() {
    const r3 = procesarDiario();
    if (!r3) {
      SpreadsheetApp.getUi().alert("Hay otra ejecución en curso. Probá en un minuto.");
      return;
    }
    SpreadsheetApp.getUi().alert(`Listo: ${r3.nuevos} movimientos nuevos, ${r3.revisar.length} mails para revisar.`);
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
      append(TABS.reglas, SEED_REGLAS.map((r3, i2) => ({ id: `s${i2 + 1}`, quien: "", origen: "semilla", usos: 0, creada: now, modificada: now, ...r3 })));
    }
    label(LABEL_OK);
    label(LABEL_REVISAR);
    ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "procesarDiario").forEach((t) => ScriptApp.deleteTrigger(t));
    ScriptApp.newTrigger("procesarDiario").timeBased().atHour(6).everyDays(1).inTimezone("America/Montevideo").create();
    log("info", "configuracion", "Pestañas, semillas, etiquetas y disparador diario listos");
    SpreadsheetApp.getUi().alert("Configuración lista. Completá la pestaña Cuentas y después usá Finanzas → Reconstruir historial.");
  }
  function importarPlanillaVieja() {
    const sh = SpreadsheetApp.getActive().getSheetByName("Gastos Mensuales");
    if (!sh) throw new Error('No encuentro la pestaña "Gastos Mensuales"');
    const rows = sh.getDataRange().getDisplayValues();
    const { movs, omitidas } = importLegacyRows(rows, { hasta: "2025-12", now: nowMontevideoIso() });
    const existing = new Set(readAll(TABS.movimientos).map((m) => String(m.id)));
    const nuevos = movs.filter((m) => !existing.has(m.id));
    append(TABS.movimientos, nuevos);
    const cats = new Set(readAll(TABS.categorias).map((c) => c.nombre));
    const faltan = SEED_CATEGORIAS.filter((c) => !cats.has(c.nombre));
    append(TABS.categorias, faltan);
    log("info", "importacion_planilla", `importados=${nuevos.length} omitidos=${omitidas} categorias_nuevas=${faltan.map((c) => c.nombre).join(",")}`);
    withLock(mantenimiento);
    return { importados: nuevos.length, omitidas };
  }
  function sincronizarInversiones() {
    const n = withLock(mantenimiento);
    return n;
  }
  function conciliarEstadosAhora() {
    const r3 = withLock(() => conciliarEstados(Date.now() + TIME_BUDGET_MS));
    if (!r3) {
      SpreadsheetApp.getUi().alert("Hay otra ejecución en curso. Probá en un minuto.");
      return;
    }
    SpreadsheetApp.getUi().alert(r3.estados ? `Listo: revisé ${r3.estados} estado(s) de cuenta y agregué ${r3.agregados} movimientos que no habían llegado por aviso.` : "No hay estados de cuenta nuevos para revisar.");
  }
  function doPost(e) {
    const out = (s) => ContentService.createTextOutput(s);
    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err2) {
      return out("json inválido");
    }
    const token = PropertiesService.getScriptProperties().getProperty("PUSH_TOKEN");
    if (!token || body.token !== token) return out("no autorizado");
    const text = [body.title, body.text].filter(Boolean).join(" ").trim();
    if (!text) return out("vacío");
    const at = (/* @__PURE__ */ new Date()).toISOString();
    return withLock(() => {
      let rate = null;
      try {
        rate = makeRateProvider()(toMontevideoDate(at));
      } catch (err2) {
      }
      const r3 = pushToMovimiento(text, at, { reglas: readAll(TABS.reglas), cuentas: readAll(TABS.cuentas) }, rate, nowMontevideoIso());
      if (!r3.ok) {
        if (/consumo|tarjeta|transferencia|d[eé]bito/i.test(text)) log("aviso", "push_no_leido", text.slice(0, 300));
        return out("ignorado");
      }
      if (readAll(TABS.movimientos).some((m) => String(m.id) === r3.mov.id)) return out("repetido");
      append(TABS.movimientos, [r3.mov]);
      log("info", "push", `${r3.mov.comercio_raw} ${r3.mov.moneda} ${r3.mov.monto_orig}`, r3.mov.id);
      return out("ok");
    }) || out("ocupado");
  }
  function configurarPush() {
    const props = PropertiesService.getScriptProperties();
    let token = props.getProperty("PUSH_TOKEN");
    if (!token) {
      token = Utilities.getUuid().replace(/-/g, "");
      props.setProperty("PUSH_TOKEN", token);
    }
    const url = ScriptApp.getService().getUrl() || "(todavía no publicaste la aplicación web)";
    SpreadsheetApp.getUi().alert(`Datos para MacroDroid

Dirección:
${url}

Clave:
${token}

No compartas la clave: con ella cualquiera podría agregar movimientos.`);
  }
  function onOpen() {
    SpreadsheetApp.getUi().createMenu("Finanzas").addItem("Procesar ahora", "procesarAhora").addItem("Consolidar reglas", "consolidarReglas").addItem("Reconstruir historial…", "reconstruir").addItem("Importar planilla vieja (hasta 2025)", "importarPlanillaVieja").addItem("Sincronizar Inversiones", "sincronizarInversiones").addItem("Conciliar estados de cuenta VISA", "conciliarEstadosAhora").addItem("Configurar push de Android", "configurarPush").addSeparator().addItem("Configurar (primera vez)", "configurar").addToUi();
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
function importarPlanillaVieja() { return FH.importarPlanillaVieja.apply(null, arguments); }
function sincronizarInversiones() { return FH.sincronizarInversiones.apply(null, arguments); }
function conciliarEstadosAhora() { return FH.conciliarEstadosAhora.apply(null, arguments); }
function doPost() { return FH.doPost.apply(null, arguments); }
function configurarPush() { return FH.configurarPush.apply(null, arguments); }

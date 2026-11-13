# CLAUDE.md — Finanzas del Hogar (Juani & Mili)

App familiar que toma los avisos de Itaú desde Gmail, los clasifica y los muestra en una PWA. Uso personal: la usan dos personas, Juani (Android) y Mili (iPhone), que comparten el 100% de sus finanzas. Se habla en español rioplatense: la UI, los commits y los mensajes al usuario van en ese idioma.

## Arquitectura

```
Gmail (avisos Itaú) ──► Apps Script (diario 06:00 MVD) ──► Google Sheets (la base) ◄── PWA (GitHub Pages)
                         └─ BCU (cotización USD)
```

- **`src/core/`**: toda la lógica, en JS puro y con pruebas. Lo usan el script y la app. **Toda lógica nueva va acá, con su prueba.**
  - `parsers.js`: lee los mails de Itaú (consumo de crédito y débito, transferencias, pagos de tarjeta).
  - `html.js`: los mails de Itaú son **solo HTML**, así que hay que convertirlos con `htmlToText(getBody())`.
  - `classify.js`: orden de clasificación: cuenta conocida → regla exacta → regla "contiene" → pendiente. También `quienFor` y `applyToSimilar`.
  - `learn.js`: cuando alguien edita en la app se crea una regla exacta o una cuenta. `consolidate` agrupa reglas exactas que se parecen en reglas "contiene". El aprendizaje se acumula; la idea es que cada vez haya menos para revisar a mano.
  - `money.js`: cotización BCU por SOAP (moneda 2222, TCV) y montos en UYU y USD.
  - `pipeline.js`: mails → movimientos, con detección de duplicados (`dupKey`).
  - `aggregate.js`: totales del mes y del año, acumulado por día, top de comercios.
  - `legacy.js`: importa la pestaña vieja "Gastos Mensuales" (jul 2024 a dic 2025).
  - `inversiones.js`: sincroniza la pestaña "Inversiones" (depósitos en USD) como Ahorro/Inversión.
  - `pdf.js` + `estadoCuenta.js`: leen el PDF mensual del estado de cuenta VISA (mail de info-mail@itau.com.uy) y agregan lo que no llegó por aviso. Itaú **no manda aviso** de muchos consumos (Mercado Pago, Uber exterior, tarjeta 1013, seguro de vida). Reglas del cruce: ventana ±7 días, cuotas 2..N se ignoran (la 1/N se compara contra cuota×N), compra + "REDUC. IVA" = monto neto del aviso, varias líneas del mismo día pueden sumar un solo aviso (eBay, propinas). Probado contra los estados de cuenta reales de 2026; **no commitear PDFs reales** (el repo es público).
  - `push.js`: notificaciones de la app de Itaú en el Android de Juani, reenviadas por MacroDroid a `doPost` (aplicación web del script, protegida con `PUSH_TOKEN` en Script Properties; menú "Configurar push de Android"). Entran al instante con `origen: push`; el mail posterior del mismo consumo se descarta en `pipeline.js` (misma tarjeta, monto y moneda, ±1 día). Formatos de push no reconocidos quedan en Log como `push_no_leido`.
- **`apps-script/main.js`**: los puntos de entrada del script, como el menú "Finanzas", `procesarDiario` y `continuarReconstruccion`. Se empaqueta con esbuild en **`dist/Code.gs`**, que es un archivo generado y no se edita a mano. Las funciones globales se declaran en `ENTRY_POINTS` de `scripts/build-gas.mjs`.
- **`app/`**: PWA en Preact + Vite. Entra con Google Identity Services y habla directo con la API de Sheets (lee con UNFORMATTED_VALUE y escribe con RAW). Con `?demo=1` usa datos de ejemplo, sin login.
  - Pantallas: Resumen (con selector Mes/Año) · Revisar (clasificación con un toque) · Categorías · Movimientos.
  - `app/src/config.js` tiene `ALLOWED_EMAILS` (Juani y Mili), el ID del cliente OAuth y el ID de la planilla.

## La planilla (base de datos)

ID: `1jyPGemEDElKxN4lxUPTmoHLAXvkbf249idA_bsWw9HI` ("Finanzas Juani-Mili"). Las columnas de cada pestaña están en `src/core/schema.js`.

| Pestaña | Contenido |
|---|---|
| Movimientos | Un movimiento por fila. `parte` (última columna) = fracción propia de un gasto dividido; vacía = todo. Los montos del banco no se tocan: todo total usa `efectivo()` de `money.js`. `origen`: gmail / push / estado_cuenta / historico / manual. `clasificado_por`: cuenta / regla_exacta / regla_contiene / manual / lote / pendiente |
| Reglas | `exacta` o `contiene` (por palabra entera sobre el comercio normalizado) |
| Cuentas | Tarjetas y cuentas propias (`tarjeta_propia`, `propia_interna`, `propia_ahorro`) y cuentas de terceros con nombre y categoría |
| Categorías | Grupos: Fijos, Variables, No es gasto, Ingresos |
| Cotizaciones | Caché del BCU |
| Log | Eventos del script. Se revisa para saber si "corrió bien" |
| Gastos Mensuales, Inversiones | Pestañas del usuario. **Solo lectura** |

## Comandos

```bash
npm test                 # vitest (core y app)
npm run build:gas        # genera dist/Code.gs y dist/appsscript.json
npm run deploy:gas       # build y clasp push al proyecto de Apps Script
npm run dev              # app local (abrir con ?demo=1)
npm run build:app        # build de la PWA
```

## Cómo publicar

- **App:** al hacer push a `main`, GitHub Actions (`.github/workflows/pages.yml`) la publica en https://juanimar.github.io/finanzas-hogar/. Los usuarios tienen que cerrar y reabrir la app para ver la versión nueva.
- **Script:** `npm run deploy:gas`. Antes hay que hacer, una sola vez: `npm i -g @google/clasp`, `clasp login` con la cuenta de Juani y activar la "API de Google Apps Script" en https://script.google.com/home/usersettings. El ID del proyecto está en `.clasp.json`, y `clasp push` reemplaza todos los archivos del proyecto con los de `dist/`. **Commitear siempre `dist/Code.gs`** junto con el cambio.

## Decisiones tomadas (no reabrir sin preguntar)

- Sin IA en la clasificación del MVP: se usan reglas acumulativas. Activarla más adelante queda a decisión del usuario, y la clave de API la carga él, nunca por chat.
- Lectura de Gmail una vez por día. Los ingresos no llegan por mail y se cargan a mano en la app (+ → Ingreso).
- Moneda: se guarda la original más la conversión con el BCU del día. La UI tiene un selector UYU/USD.
- Las compras con tarjeta cuentan en la fecha de compra.
- "Quién": Compartido por defecto; las tarjetas propias de Mili van como Mili.
- Circuito del dólar: los pesos que van a Mili (OCA Blue 7361576) son internos. El giro a BROU 00155919900004 es Ahorro/Inversión.
- Midinero = pago a la empleada doméstica (Servicio doméstico).
- Los mails de Mili llegan reenviados por un filtro de Gmail hacia la cuenta de Juani. El reenvío conserva el `From` de Itaú.

## Pendientes conocidos

Ver el doc de estado en el Project de claude.ai ("estado-mvp"). Principalmente:
- Los últimos 4 números de las tarjetas de Mili, para marcarlas como Mili en Cuentas.
- Corrida de Reconstruir historial desde la cuenta de Mili.
- Filtros en Movimientos.
- Renovación de sesión sin volver a entrar.

## Convenciones

- TDD para la lógica en `src/core`: primero la prueba que falla.
- Commits en español, con el formato `feat(app): …` / `fix(core): …`.
- Colores de gráficos: paleta categórica validada (`#2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4`) más gris `#b9bdb9` para "Resto".

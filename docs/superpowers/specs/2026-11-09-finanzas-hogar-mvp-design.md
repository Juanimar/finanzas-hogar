# Finanzas del Hogar Juani–Mili — Diseño del MVP

**Fecha:** 2026-11-09
**Estado:** Aprobada (2026-11-09). Cambio posterior: IA fuera del MVP.
**Autores:** Juani + Claude (brainstorming con grill-me + superpowers:brainstorming)

---

## 1. Propósito

Automatizar de punta a punta el seguimiento de las finanzas del hogar de Juani y Mili, que comparten el 100 % de sus finanzas y algunas tarjetas. La carga manual en la planilla "Finanzas Juani-Mili" se abandonó porque llevaba demasiado trabajo; este sistema la reemplaza con captura automática desde los mails de Itaú, clasificación que aprende sola y una app en el celular de cada uno.

### Criterios de éxito

1. Ver sin esfuerzo, cada mes, el **gasto por categoría** (grupos Fijos / Variables).
2. Ver la **evolución del ahorro e inversión** frente a los ingresos (después del MVP).
3. Los dos ven **la misma información**, sin preguntarse "¿esto lo pagaste vos?".
4. **≤ 10 minutos por semana** de revisión entre los dos.
5. La proporción de movimientos clasificados por **reglas** sube mes a mes, y la de **IA** y **manual** baja.

### Fuera de alcance (por ahora)

- Planificación y proyecciones (metas, cierre del mes estimado).
- Detección de gastos anómalos o suscripciones olvidadas.
- Lectura de notificaciones push en Android.
- Uso sin conexión con escritura.

---

## 2. Decisiones tomadas

| # | Tema | Decisión |
|---|---|---|
| Q1 | Objetivo | Control del gasto + ahorro + coordinación de pareja. ≤ 10 min/semana. |
| Q2 | Construir o adoptar | App propia: Google (Gmail + Apps Script + Sheets) para los datos y una app web instalable (PWA). Costo cero. |
| Q3 | Fuentes | Los avisos de Itaú llegan al Gmail de Juani. Mili crea un filtro en su Gmail que reenvía a Juani los avisos de **sus** tarjetas. Un único buzón procesado. |
| Q3b | "Quién" | Por defecto `Compartido`. Las tarjetas propias de Mili se marcan solas como `Mili`. Se puede editar a mano. La Visa 1025 la usan los dos → `Compartido`. |
| Q4 | Celulares | Juani Android, Mili iPhone → PWA, válida para los dos. Notificaciones de Android: opcional, más adelante. |
| Q5 | Fuera de tarjeta | Transferencias: se capturan solas y se clasifican con la **memoria de cuentas**. Midinero = pago a la empleada → `Servicio doméstico`. Efectivo (marginal): botón de carga rápida. |
| Q6 | Monedas | Cada movimiento guarda monto y moneda originales + cotización BCU del día + monto en UYU + monto en USD. Los totales tienen un toggle UYU/USD. |
| Q7 | Cuentas propias | Lista de cuentas propias con tipo `Ahorro/Inversión` o `Movimiento interno`. Nunca cuentan como gasto. La lista concreta se carga al configurar. |
| Q8 | Crédito | El gasto cuenta en la **fecha de compra**. El pago de la tarjeta se registra, pero no suma como gasto. Conciliación mensual contra el PDF y cuotas (una por mes): después del MVP. |
| Q9 | Categorías | Ver §5.4. |
| Q10 | Clasificación | Memoria de cuentas → reglas exactas → reglas por palabra contenida. **Sin IA en el MVP** (decisión del 2026-11-09): lo desconocido queda `pendiente` en "Para revisar" y cada corrección crea una regla. Aprendizaje acumulativo (§7). IA: después del MVP. |
| Q11 | Tienda | No aplica (no existe tienda). Sin categoría "Negocio". |
| Q12 | Historial | Reconstrucción hacia atrás desde los mails de Itaú. Importación de la planilla 2024 como gastos: después del MVP. |
| Q13 | Construcción | La construye Claude y Juani revisa y aprueba cada etapa. **MVP en ~2 días.** |
| — | Frecuencia | Lectura de Gmail **una vez por día** (06:00) + botón "Procesar ahora". |
| — | Arquitectura | Opción B: Apps Script para la captura + PWA propia en GitHub Pages con login de Google y acceso directo a la API de Sheets. |

---

## 3. Alcance del MVP

### Día 1: captura y clasificación
- Lectura diaria de los avisos de Itaú en Gmail (4 formatos).
- Conversión de moneda con la cotización del BCU.
- Memoria de cuentas, reglas exactas y reglas por palabra contenida. Lo desconocido queda pendiente de revisión.
- Lista inicial de unas 40 reglas de comercios uruguayos habituales.
- Reconstrucción hacia atrás desde los mails viejos, por lotes.
- Filtro de reenvío configurado en el Gmail de Mili.

### Día 2: app
- PWA con login de Google, restringida a los dos mails.
- Pantallas: Inicio, Para revisar, Categorías → Comercios → Movimientos, Movimientos, carga rápida (+).
- Instalada en el Android de Juani y el iPhone de Mili.

### Después del MVP (en el orden que se decida)
Clasificación con IA · Presupuesto por categoría · Tasa de ahorro automática · Conciliación mensual con el PDF + cuotas · Importación de la planilla 2024 · Vistas por semana y año · Totales por comercio a nivel anual · Lectura de notificaciones de Android · Escritura sin conexión.

---

## 4. Arquitectura

```
 Gmail de Mili ──(filtro de reenvío)──┐
                                      ▼
                             Gmail de Juani
                                      │  (diario 06:00 / "Procesar ahora")
                                      ▼
                ┌──────────── Apps Script (cuenta de Juani) ────────────┐
                │ lector de mails → normalizador → conversor de moneda │
                │ → clasificador → escritor   │   consolidador de reglas│
                └──────┬───────────────┬──────────────────┬──────────────┘
                       │               │                  │
                API del BCU      API de Claude      Google Sheets
                                (solo desconocidos)  "Finanzas Juani-Mili"
                                                          ▲
                                                          │ API de Sheets (OAuth del usuario)
                                              PWA en GitHub Pages
                                         (Android de Juani / iPhone de Mili)
```

**Principios**
- **La planilla es la única fuente de datos.** Si algo falla, se puede abrir y corregir a mano.
- **Unidades separadas, con una sola responsabilidad cada una:** lector, normalizador, conversor de moneda, clasificador, aprendizaje, consolidador y app. Cada una se prueba por separado.
- **Todo es idempotente:** reprocesar un mail no duplica nada.

---

## 5. Modelo de datos

Pestañas nuevas en la planilla existente. Las pestañas actuales no se tocan.

### 5.1 `Movimientos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | texto | ID del mensaje de Gmail, o `man-<uuid>` en las cargas manuales. **Único.** |
| `fecha` | fecha | Fecha de la operación (la del mail). |
| `tipo` | enum | `consumo_credito` · `consumo_debito` · `transferencia` · `pago_tarjeta` · `manual` |
| `medio` | texto | `Visa 1025` · `Débito 4590` · `Cuenta 2518` · `Efectivo` |
| `comercio_raw` | texto | Texto original del banco. |
| `comercio` | texto | Nombre normalizado (§7.1). |
| `cuenta_destino` | texto | Solo en transferencias. |
| `banco_destino` | texto | Solo en transferencias. |
| `descripcion` | texto | Texto legible y editable. |
| `monto_orig` | número | |
| `moneda` | enum | `UYU` · `USD` |
| `cotizacion` | número | UYU por USD del BCU en `fecha` (o el último día hábil anterior). |
| `monto_uyu` | número | |
| `monto_usd` | número | |
| `categoria` | texto | Referencia a `Categorías`. |
| `quien` | enum | `Compartido` · `Juani` · `Mili` |
| `clasificado_por` | enum | `cuenta` · `regla_exacta` · `regla_contiene` · `ia` · `manual` · `pendiente` |
| `confianza_ia` | número | 0–1, solo si `clasificado_por = ia`. |
| `revisado` | booleano | `false` → aparece en "Para revisar". |
| `bloqueado` | booleano | `true` después de una edición manual: ningún proceso automático lo vuelve a tocar. |
| `origen` | enum | `gmail` · `manual` · `historico` |
| `nota` | texto | |
| `creado` / `modificado` | fecha y hora | |

**Reglas de cálculo**
- `pago_tarjeta`, `Ahorro/Inversión` y `Movimiento interno` **nunca** suman como gasto.
- Grupo de una categoría = el que tiene en `Categorías`. No se guarda en el movimiento.

### 5.2 `Reglas`

| Campo | Notas |
|---|---|
| `id` | |
| `tipo` | `exacta` · `contiene` |
| `patron` | Sobre el comercio normalizado. |
| `categoria` | |
| `quien` | Opcional. |
| `descripcion` | Opcional (por ejemplo, `PEDIDOSYA` → "PedidosYa"). |
| `origen` | `semilla` · `confirmacion` · `correccion` · `agrupacion` |
| `usos` | Contador. |
| `creada` / `modificada` | |

### 5.3 `Cuentas`

| Campo | Notas |
|---|---|
| `numero` | Número de cuenta o los últimos 4 dígitos de la tarjeta. |
| `banco` | |
| `nombre` | "Peluquería", "OCA Blue ahorro", "Visa 1025". |
| `tipo` | `tercero` · `propia_ahorro` · `propia_interna` · `tarjeta_propia` |
| `titular` | `Juani` · `Mili` · `Compartido` (para tarjetas y cuentas propias). |
| `categoria` | Por defecto, para cuentas de terceros. |
| `quien` | Opcional. |

`tarjeta_propia` define el "Quién" automático: las tarjetas de Mili tienen `titular = Mili`, la 1025 tiene `Compartido`.

### 5.4 `Categorías`

| Grupo | Categorías |
|---|---|
| **Fijos** | Vivienda · Servicios · Servicio doméstico · Suscripciones · Bancos/Comisiones |
| **Variables** | Supermercado · Delivery · ComidaSocial · Transporte · Casa · Estética/Cosmética · Salud · Diversión · Regalos y Cumpleaños · Donación · Viajes · Otros |
| **No es gasto** | Ahorro/Inversión · Movimiento interno |

Columnas: `nombre`, `grupo`, `orden`, `activa`. Se puede editar sin tocar código.

### 5.5 `Cotizaciones`
`fecha`, `usd_uyu`, `fuente`. Guarda la cotización de cada día para no consultarla dos veces.

### 5.6 `Log`
`fecha_hora`, `nivel` (`info`·`aviso`·`error`), `evento`, `detalle`, `ref` (ID del mail o del movimiento). Registra cada ejecución, cada mail que no se pudo leer y cada cambio de reglas.

---

## 6. Captura (Apps Script)

### 6.1 Disparo
- Disparador diario a las 06:00 (hora de Montevideo).
- Función `procesarAhora()`, expuesta como botón en la app.

### 6.2 Flujo
1. Buscar en Gmail: `from:comunicaciones@itau.com.uy -label:Finanzas/Procesado -label:Finanzas/Revisar`. El reenvío automático de Gmail conserva el remitente original, así que entran también los de Mili.
2. Para cada mensaje, elegir el **lector** según el asunto:

| Asunto | Patrón del cuerpo |
|---|---|
| Aviso de consumo aprobado con tarjeta de crédito | `VISA nro. ***(\d{4}) Importe: ([\d.]+) (UYU\|USD) Comercio: (.+?) Además` |
| Aviso de consumo aprobado con tarjeta de débito | `terminada en (\d{4}) \. Realizado en (.+?) Monto: ([\d.]+) (Pesos\|Dólares)` |
| Aviso transferencia realizada | `desde la cuenta \*+(\d{4}) Importe: ([\d.]+) (URGP\|UYU\|USD\|…) Cuenta destino: (\d+) Banco/Institución destino: (.+?) Además` |
| Aviso de pago de tarjeta de credito | `terminada en (\d{4})\. Pago en pesos: ([\d.]+) pesos Pago en dólares: ([\d.]+) dólares` |

   Los patrones son orientativos. La versión final se ajusta con las muestras reales del set de pruebas. Normalización de moneda: `URGP` y `Pesos` → `UYU`; `Dólares` y `USD` → `USD`.
3. **Quién:** buscar `medio` en `Cuentas` (`tarjeta_propia`) y tomar su `titular`. Si no está, `Compartido`.
4. **Moneda:** pedir la cotización a `Cotizaciones`, y si no está, al BCU. Si es fin de semana o feriado, usar el último día hábil anterior. Calcular `monto_uyu` y `monto_usd`.
5. **Clasificar** (§7).
6. **Escribir** la fila, agregar la etiqueta `Finanzas/Procesado` en Gmail y anotar en el `Log`.

### 6.3 Errores
| Caso | Comportamiento |
|---|---|
| El asunto o el cuerpo no coincide con ningún lector | Etiqueta `Finanzas/Revisar`, se anota en el `Log` y la app muestra "N mails no se pudieron leer". |
| BCU no disponible | Se guarda con `cotizacion` vacía y `clasificado_por` sin tocar. La próxima ejecución completa los movimientos sin cotización. |
| IA no disponible | `categoria = Otros`, `clasificado_por = pendiente`. Se reintenta en la próxima ejecución. |
| Falla general del script | Google manda un mail automático (notificación de fallos del disparador). |
| Límite de 6 min por ejecución | Proceso por lotes con un punto de continuación guardado en `PropertiesService`. |

### 6.4 Reconstrucción hacia atrás
`backfill(desde)` usa el mismo flujo sobre todos los mails de Itaú desde la fecha `desde`, en lotes de unos 100 mensajes encadenados con disparadores temporales hasta terminar. Los movimientos llevan `origen = historico` (y `revisado = false` solo si la IA tuvo confianza baja). La idempotencia evita duplicados.

### 6.5 A verificar al construir
- Que exista una fuente automática y estable de la cotización oficial del BCU. Si no, usar otra fuente pública de la cotización oficial y registrarla en `fuente`.
- Formatos de mail de los avisos de las otras tarjetas de Mili en Itaú. Se agregan lectores si son distintos.

---

## 7. Clasificación y aprendizaje

### 7.1 Normalización del comercio
- Pasar a mayúsculas, sacar acentos y espacios repetidos.
- Quitar prefijos de procesadores de pago: `MERPAGO*`, `DLO*`, `PAYU*`, etc.
- Quitar sufijos sin significado: `VIS3`, `MONTE`, `MONTEVIDEO`, `UY`, números de terminal.
- Ejemplos: `MERPAGO*MACROMERCADO MONTE` → `MACROMERCADO`; `DLO*PedidosYa Envio VIS3` → `PEDIDOSYA ENVIO`.
- La lista de palabras a ignorar (`stopwords`) se puede ajustar.

### 7.2 Orden de búsqueda (el primero que coincide gana)
1. Si `bloqueado = true`, no se toca.
2. **Cuenta** (transferencias): `cuenta_destino` en `Cuentas` → su categoría y su "Quién". Si es `propia_*`, la categoría es `Ahorro/Inversión` o `Movimiento interno`.
3. **Regla exacta:** `comercio == patron`.
4. **Regla por palabra contenida:** `comercio` contiene `patron`. Si coinciden varias, gana el patrón más largo.
5. **Sin coincidencia:** `categoria = Otros`, `clasificado_por = pendiente`, `revisado = false`. (La IA queda para después del MVP.)
6. Transferencia a una cuenta desconocida → `pendiente`, y la app pide un nombre y una categoría.

**Al aprender (app):** después de una corrección, la app aplica la regla nueva a los demás movimientos pendientes y no bloqueados del mismo comercio o cuenta, para que confirmar un comercio resuelva todos sus pendientes de una vez.

### 7.3 Aprendizaje acumulativo
| Evento (en la app) | Efecto inmediato |
|---|---|
| Confirmar una sugerencia de la IA | Se crea la regla `exacta` comercio → categoría (`origen = confirmacion`). |
| Corregir la categoría | Se crea o actualiza la regla `exacta` (`origen = correccion`). El movimiento queda `bloqueado`. |
| Poner nombre y categoría a una cuenta nueva | Se crea la entrada en `Cuentas` (`tipo = tercero`). |
| Cambiar el "Quién" | Si el mismo comercio o cuenta tuvo el mismo "Quién" 2 veces seguidas, la regla o la cuenta guarda ese `quien`. |

**Consolidación diaria (Apps Script):**
- **Agrupación:** si hay ≥ 2 reglas `exacta` con una misma palabra (que no esté en `stopwords`, con ≥ 4 letras) y la misma categoría, se crea la regla `contiene` con esa palabra (`origen = agrupacion`), siempre que no choque con una regla existente que la contenga y vaya a otra categoría.
- **Reclasificación:** los movimientos no bloqueados con `clasificado_por = pendiente` se vuelven a pasar por §7.2 con las reglas nuevas.
- **Conflictos:** manual > regla > IA. Lo más reciente le gana a lo anterior. Cada cambio se anota en el `Log`.

### 7.4 Reglas iniciales
Unas 40 reglas para comercios uruguayos habituales: supermercados (Devoto, Disco, Géant, Tienda Inglesa, Macromercado, Ta-Ta), Ancap, PedidosYa, Rappi, Uber, Cabify, STM, UTE, OSE, Antel, Movistar, Claro, Netflix, Spotify, Anthropic, farmacias (San Roque, Farmashop), Midinero (→ Servicio doméstico), entre otros. Después la reconstrucción hacia atrás, con la revisión de una sola vez, completa la base.

### 7.5 Métrica
`% reglas / % IA / % manual` del mes, a partir de `clasificado_por` (se cuentan como "reglas" `cuenta`, `regla_exacta` y `regla_contiene`).

---

## 8. App (PWA)

### 8.1 Tecnología
- Sitio estático (HTML/CSS/JS con Vite), alojado en **GitHub Pages**.
- `manifest.webmanifest` + service worker: se instala en pantalla completa en Android e iOS y guarda la última lectura para verla sin conexión.
- **Login:** Google Identity Services. Cliente OAuth en un proyecto de Google Cloud en "modo de prueba" con 2 usuarios de prueba. Alcance: `spreadsheets`. Lista de mails permitidos dentro de la app (Juani y Mili).
- **Datos:** API de Google Sheets con el token del usuario. Al abrir, lee `Movimientos` del mes actual y el anterior, más `Categorías`, `Reglas` y `Cuentas`. Los totales se calculan en el celular.
- **Escritura:** actualizaciones de una sola fila (`values.update`) y altas (`values.append`) en `Reglas` y `Cuentas`.
- **Procesar ahora:** menú "Finanzas" en la planilla (Procesar ahora / Consolidar reglas / Reconstruir historial). La app no lo dispara en el MVP.
- **Alojamiento:** GitHub Pages requiere repositorio público en cuentas gratis; el repo no contiene datos ni secretos. Alternativa: Cloudflare Pages.
- **Toggle UYU/USD:** se guarda por dispositivo (`localStorage`).

### 8.2 Pantallas
1. **Inicio:** total gastado en el mes (grande) · toggle UYU/USD · curva acumulada del mes contra el mes anterior · Fijos y Variables · tarjeta "📥 N para revisar" · aviso de "mails sin leer" · métrica de aprendizaje.
2. **Para revisar:** una tarjeta por movimiento, con ✓ confirmar · cambiar categoría · cambiar "Quién". Las cuentas nuevas piden nombre y categoría. El contador baja hasta "todo revisado".
3. **Categorías:** lista agrupada por Fijos y Variables con sus totales → comercios con el total del mes y del año → movimientos.
4. **Movimientos:** lista completa con buscador y filtros de mes, categoría y quién. Cualquier movimiento se puede editar (y queda `bloqueado`).
5. **Botón +:** monto, moneda, descripción, categoría (sugerida por las reglas aplicadas a la descripción) y quién. Se guarda con `origen = manual`.

### 8.3 Principios de diseño
- La bandeja de pendientes, siempre a la vista en Inicio (no escondida detrás de un filtro).
- Tono neutro: "12 % por encima del mes pasado", sin rojos alarmantes.
- Las acciones frecuentes, a un toque. Sin menús profundos.
- Referentes: la revisión tipo "inbox zero" de Origin, los grupos fijo/flexible de Monarch y la curva acumulada de Copilot.

### 8.4 Limitaciones conocidas
- Con OAuth en "modo de prueba", cada tanto hay que volver a iniciar sesión.
- Sin conexión, solo se puede consultar.

---

## 9. Seguridad y privacidad
- Los datos quedan en la cuenta de Google de Juani. La planilla está compartida solo con Mili.
- La app no tiene servidor propio ni base de datos externa.
- Solo se guardan los últimos 4 dígitos de las tarjetas. Los números de cuenta de terceros quedan solo en la planilla.
- El repositorio de la app no contiene datos, claves ni números de cuenta. Las muestras de mails para pruebas se anonimizan.

---

## 10. Pruebas

| Unidad | Pruebas |
|---|---|
| Lectores de mails | Muestras reales anonimizadas de los 4 formatos (UYU y USD, montos con decimales). Un formato desconocido termina en `Finanzas/Revisar`. |
| Normalizador | Tabla de entradas y salidas esperadas (MERPAGO*, DLO*, VIS3, MONTE…). |
| Conversor de moneda | Día hábil, fin de semana y feriado (usa el último día hábil); USD→UYU y UYU→USD cuadran. |
| Clasificador | Prioridades (§7.2); gana el patrón más largo; nunca toca un movimiento `bloqueado`. |
| Aprendizaje | Confirmar y corregir crean la regla correcta; la agrupación DEVOTO funciona; las stopwords no generan reglas. |
| Integridad | Procesar dos veces no duplica; `pago_tarjeta` y las cuentas propias no suman como gasto. |
| Aceptación | Reconstruir octubre 2026 y comparar el total de la Visa 1025 contra el estado de cuenta de octubre (las diferencias se explican por tipo de cambio o por cargos sin aviso). |
| App | Prueba manual de humo: login de los dos usuarios, toggle, revisión, carga rápida, instalación en Android e iOS. |

---

## 11. Configuración inicial (una sola vez)
1. Juani: dar permisos al Apps Script (Gmail, Sheets, solicitudes externas).
3. Crear el proyecto de Google Cloud y el cliente OAuth (modo de prueba, 2 usuarios). Guiado paso a paso.
4. Mili: crear el filtro de Gmail que reenvía `from:comunicaciones@itau.com.uy` al Gmail de Juani (y confirmar la dirección de reenvío).
5. Completar `Cuentas`: tarjetas propias con su titular (1025 → Compartido; las de Mili → Mili), cuentas propias (OCA Blue, etc.) con su tipo.
6. Correr `backfill(desde)` y hacer la primera revisión de comercios.
7. Instalar la PWA en los dos celulares.

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Itaú cambia el formato de los mails | Lectores con pruebas; un formato desconocido termina en `Finanzas/Revisar` y genera un aviso en la app; nada se pierde. |
| No hay una fuente del BCU accesible | Fuente alternativa de la cotización oficial; cotización pendiente y reintento. |
| Límites de cuota y tiempo de Apps Script | Lotes con continuación; lectura diaria (bajo volumen). |
| Login en modo de prueba incómodo | Se acepta para el MVP; se puede pasar a producción más adelante. |
| Gastos de la 1025 sin aviso por mail (débitos automáticos, comisiones) | Conciliación mensual con el PDF (después del MVP). |

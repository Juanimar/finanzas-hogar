# Finanzas del Hogar — Juani & Mili

Los avisos de Itaú que llegan a Gmail se pasan solos a la planilla "Finanzas Juani-Mili". Una app instalable en los dos celulares permite revisar, clasificar y ver el mes.

- **`src/core/`**: la lógica (lectura de mails, monedas, clasificación, aprendizaje y totales), con pruebas.
- **`apps-script/`**: el script que corre en Google todos los días a las 06:00. Se empaqueta en un único `dist/Code.gs`.
- **`app/`**: la app web (PWA), publicada en GitHub Pages.

Diseño: `docs/superpowers/specs/` · Plan: `docs/superpowers/plans/` · Contexto para Claude Code: `CLAUDE.md`

> Para actualizar el script después de la instalación: `npm run deploy:gas` (ver `CLAUDE.md`).

---

## Instalación (una sola vez)

### 1. El script en la planilla
1. Abrí la planilla **Finanzas Juani-Mili** y andá a **Extensiones → Apps Script**.
2. En **⚙️ Configuración del proyecto**, tildá *Mostrar el archivo de manifiesto "appsscript.json"*.
3. En el editor:
   - Reemplazá el contenido de `appsscript.json` por el de `dist/appsscript.json`.
   - Reemplazá todo el contenido de `Código.gs` por el de `dist/Code.gs`.
   - Guardá (💾).
4. Volvé a la planilla y recargala. Aparece el menú **Finanzas**.
5. Andá a **Finanzas → Configurar (primera vez)**. Google pide permisos: Gmail, la planilla y conexiones externas (para la cotización del BCU). Aceptalos.
   - Si aparece *"Google no verificó esta app"*: tocá **Configuración avanzada → Ir a Finanzas Hogar**. Es tu propio script.
6. Se crean las pestañas `Movimientos`, `Reglas`, `Cuentas`, `Categorías`, `Cotizaciones` y `Log`, más las etiquetas de Gmail y el disparador diario de las 06:00.

### 2. Completar la pestaña `Cuentas`
Una fila por cada tarjeta o cuenta propia:

| numero | banco | nombre | tipo | titular |
|---|---|---|---|---|
| 1025 | Itaú | Visa 1025 | tarjeta_propia | Compartido |
| (últimos 4 de cada tarjeta de Mili) | Itaú | … | tarjeta_propia | Mili |
| (n.º de la cuenta OCA Blue) | OCA Blue | OCA Blue ahorro | propia_ahorro | |

`tipo` puede ser `tarjeta_propia`, `propia_ahorro` (cuenta como ahorro) o `propia_interna` (movimiento entre cuentas propias, no suma como gasto ni como ahorro). Las cuentas de terceros (peluquería, etc.) se van agregando solas a medida que las nombran en la app.

### 3. Reconstruir el historial
Andá a **Finanzas → Reconstruir historial…** y poné una fecha, por ejemplo `2026-01-01`. Si hay muchos mails, el proceso sigue solo en segundo plano. El avance se ve en la pestaña `Log`.

### 4. La app
1. En GitHub, andá a **Settings → Pages → Source: GitHub Actions**. Cada push a `main` publica la app en `https://juanimar.github.io/finanzas-hogar/`.
2. En `app/src/config.js`, agregá el mail de Mili a `ALLOWED_EMAILS`. Además tiene que estar como usuaria de prueba en la pantalla de consentimiento de OAuth de Google Cloud.
3. Instalarla en el celular:
   - **Android (Chrome):** abrí la URL, tocá ⋮ → **Instalar app**.
   - **iPhone (Safari):** abrí la URL, tocá Compartir → **Agregar a inicio**.

### 5. Reenvío desde el Gmail de Mili
Configurá un filtro con `De: comunicaciones@itau.com.uy` y la acción **Reenviar a** `juanmartinez.smc@gmail.com`.

---

## Uso diario
- **Revisar:** lo que el sistema no reconoce espera ahí. Cada categoría que confirmás se convierte en una regla, y los demás movimientos pendientes del mismo comercio se resuelven solos.
- **Botón +:** carga rápida de efectivo.
- **Menú Finanzas** en la planilla: *Procesar ahora* (sin esperar a las 06:00) y *Consolidar reglas*.
- **Si Itaú cambia el formato de sus mails:** los mails afectados quedan con la etiqueta `Finanzas/Revisar` en Gmail y se registran en `Log`. No se pierde nada.

## Desarrollo
```bash
npm install
npm test                 # pruebas de la lógica
npm run build:gas        # genera dist/Code.gs
npm run dev              # app en http://localhost:5173/finanzas-hogar/?demo=1 (datos de prueba)
```

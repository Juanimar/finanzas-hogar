# Arquitectura: debilidades de escalabilidad

Revisión del 18/11/2026, hecha sobre el código de `main` (14bc3c3) y la planilla real.

## Resumen

**El volumen de datos no es un problema.** Hoy hay unos 1.600 movimientos acumulados en 2,5 años, entre la planilla vieja, los mails, los estados de cuenta y Mili. Eso es del orden de 700 por año. Google Sheets admite 10 millones de celdas; con las 25 columnas de Movimientos eso da para unas 400.000 filas, o sea siglos de uso.

Las debilidades reales son de otro tipo:

- **Concurrencia:** tres escritores (el script, Juani y Mili) escriben filas completas con datos que pueden estar viejos.
- **Acoplamiento:** la planilla es al mismo tiempo la base de datos y algo que la gente edita a mano, y los formatos de Itaú pueden cambiar sin aviso.
- **Una sola persona:** todo corre con la cuenta de Juani y el script se publica a mano.

## Debilidades, de mayor a menor riesgo

### 1. Se pierden cambios cuando dos escriben la misma fila · riesgo alto, pasa hoy

- **Qué pasa:** la app escribe **la fila completa** con lo que tenía en memoria al abrirse (`sheets.js › updateRows`). El mantenimiento diario del script hace lo mismo con lo que leyó al empezar (`main.js › mantenimiento`).
- **Ejemplo:** Mili abrió la app ayer a la noche. A las 06:00 el script completa la cotización de un gasto o lo reclasifica con una regla nueva. Mili categoriza ese gasto a la mañana sin recargar: la app escribe la fila vieja entera y **pisa** la cotización. Lo mismo pasa entre Juani y Mili si editan el mismo movimiento.
- **Cómo arreglarlo:**
  - Escribir **solo las columnas que cambiaron**, no la fila completa.
  - Usar la columna `modificado`, que ya existe, como control optimista: si en la planilla cambió desde que se leyó, recargar y avisar en vez de pisar.

### 2. El script ubica las filas por número · riesgo medio

- **Qué pasa:** la app ya vuelve a buscar cada `id` antes de escribir (`rows.js › resolveRows`). El script no: usa el `_row` que leyó al inicio de la corrida, que dura unos 20 segundos y hasta 6 minutos en una reconstrucción. Si alguien ordena, filtra con orden o borra filas en la planilla durante una corrida, el script escribe **en la fila equivocada**.
- **Cómo arreglarlo:** usar en `updateRows` del script la misma resolución por `id` que usa la app.

### 3. Lo que se edita a mano en la planilla puede romper la app · riesgo medio

- **Qué pasa:** el esquema depende de la **posición** de las columnas (`schema.js`). El script valida los encabezados y corta con un error claro, pero **la app no los valida**. Si alguien inserta o mueve una columna en Movimientos, la app lee y escribe datos corridos sin que nadie se entere.
- **Cómo arreglarlo:**
  - Que la app lea la fila 1 y compare los encabezados antes de escribir, igual que el script.
  - Proteger las pestañas del sistema (Movimientos, Reglas, Cuentas) con protección de rango de Sheets, con una advertencia al editar.

### 4. Si Itaú cambia un formato, la carga se corta en silencio · riesgo medio

- **Qué pasa:** hay tres lectores atados a formatos que no controlamos:
  - el HTML de los mails;
  - el PDF del estado de cuenta, con un lector propio;
  - el texto de las notificaciones push.

  Si Itaú cambia una plantilla, los movimientos dejan de entrar y el único rastro queda en la pestaña Log, que nadie mira. Ya pasó con el push: las notificaciones llegaron como "[notification_title]".
- **Cómo arreglarlo:** un aviso en la app, que ya carga el Log, cuando ocurra alguna de estas cosas:
  - hay más de 2 días sin movimientos de `gmail`;
  - aparece algún `push_no_leido` o `estado_cuenta_no_leido`;
  - el `LAST_OK` está atrasado.

  Además, guardar ejemplos anonimizados de cada formato como pruebas de regresión.

### 5. Una sola persona sostiene todo · riesgo medio

- **Qué pasa:** el script, la lectura de Gmail, la aplicación web del push y la app OAuth publicada dependen de la **cuenta de Juani**. Si se revoca un permiso, cambia la contraseña con cierre de sesiones o vence la autorización, todo se detiene. Además, el script se publica pegando `dist/Code.gs` en el editor desde el navegador, porque `clasp` está configurado pero sin login.
- **Cómo arreglarlo:**
  - Hacer el `clasp login` una vez y agregar una GitHub Action que publique el script en cada push, como ya se hace con la app.
  - Sumar a la alerta del punto 4 el caso "el script no corrió".

### 6. Se pierden avisos push cuando el script está ocupado · riesgo bajo a medio

- **Qué pasa:** `doPost` espera el lock global como máximo 30 segundos. Si llega un push mientras corre el proceso diario o una reconstrucción, responde `ocupado` y **se pierde**, porque MacroDroid no reintenta. Por cada push, además, lee Movimientos completa para ver si está repetido, así que se hace más lento a medida que crece el historial.
- **Cómo arreglarlo:**
  - Si no consigue el lock, guardar el push en una cola (PropertiesService o una pestaña `Entrada`) y procesarlo en la próxima corrida.
  - Controlar repetidos solo contra los últimos 30 días.

### 7. El proceso diario recorre todo el historial · riesgo bajo, crece con los años

- **Qué pasa:**
  - Cada corrida lee Movimientos completa hasta 6 veces.
  - Reclasifica y busca cotizaciones sobre **todo** el historial.
  - Escribe una llamada `setValues` **por fila**.

  Hoy tarda unos 20 segundos. Una regla nueva que reclasifica cientos de filas, o algunos años más de datos, lo acercan al límite de 6 minutos de Apps Script.
- **Cómo arreglarlo:**
  - Leer una sola vez por corrida.
  - Agrupar las escrituras en bloques contiguos.
  - Limitar la reclasificación automática a los movimientos pendientes y al año actual.

### 8. La app descarga todo al abrir · riesgo bajo

- **Qué pasa:** cada vez que se abre, la app baja todas las pestañas completas y recalcula los totales en cada pantalla. Con 1.600 filas no se nota. Con unas 5.000 filas, en 4G y en el iPhone, va a empezar a tardar.
- **Cómo arreglarlo, cuando haga falta:**
  - Guardar una copia local (IndexedDB) y bajar solo las filas nuevas.
  - Memorizar los totales por mes.

### 9. La lectura de "Inversiones" depende de cómo se ve la pestaña · riesgo bajo

- **Qué pasa:** la app la lee con valores formateados (`FORMATTED_VALUE`), entre A1 y L300. Busca los encabezados por su texto ("Depósitos", "Balance Maiorano", "Tasa de Retorno"). Si cambian los títulos, la configuración regional o se pasa de 300 filas, deja de leerla sin avisar.
- **Cómo arreglarlo:** leer valores sin formato y avisar en la pantalla cuando no encuentre los encabezados.

### 10. La sesión de la app vence a la hora · molestia, ya estaba pendiente

El token de Google dura una hora y no se renueva solo.

## Lo que no hace falta cambiar

- **Sheets como base de datos:** para dos personas y unos 700 movimientos por año alcanza de sobra. Migrar a Firebase o Supabase sumaría costo y mantenimiento sin una ganancia real. Primero hay que arreglar los puntos 1 a 3, que también se aplicarían con cualquier otra base.
- **La lógica en `src/core`, pura y con pruebas,** es lo más sólido del proyecto. Mantener la regla de que todo lo nuevo va ahí.
- **Las cuotas de Gmail y UrlFetch** están muy lejos de su límite.

## Orden sugerido

1. Escrituras parciales con control por `modificado` en la app y en el script (puntos 1 y 2), y validación de encabezados en la app (punto 3).
2. Aviso de "algo dejó de entrar" en la app (puntos 4 y 5).
3. Publicación automática del script con clasp y GitHub Actions (punto 5).
4. Cola para los push (punto 6).
5. Optimizar el proceso diario y la carga de la app cuando el volumen lo pida (puntos 7 y 8).

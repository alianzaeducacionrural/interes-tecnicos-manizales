# SETUP — Interés en técnicos profesionales (Manizales rural)

El código ya está escrito, subido y desplegado. **Solo falta un clic manual**
(el paso 1 de abajo) — es la pared de seguridad de Google, no algo que
`clasp` o un agente puedan saltarse.

## Estado actual

- **Spreadsheet**: ya creado dentro de la carpeta de Drive indicada por el usuario.
  - Carpeta: https://drive.google.com/drive/folders/10b2snCAFttAZxvOVIfoDl9sWYRfTv1PG
  - Spreadsheet: https://docs.google.com/spreadsheets/d/1kmBUDkYM3YlKrVU1CnxoKyVuLBSfvaS_7OaNbGqbR44/edit
  - Su ID ya está en `RESULTS_SHEET_ID` (`gas/Code.gs`).
- **Proyecto de Apps Script**: ya existe (lo creó el usuario), `gas/Code.gs` y
  `gas/appsscript.json` ya están subidos (`clasp push`).
  - Editor: https://script.google.com/d/111hel45IshMroRo3eUhrRQ25cx6PAmuQNfRI0rppICIer1jynAEj66CP/edit
- **Web App**: ya desplegada y la URL ya está en `js/config.js`
  (`CONFIG.GAS_URL`). `CONFIG.ADMIN_TOKEN` ya coincide con `TOKEN_ADMIN` en
  `gas/Code.gs` (`mzl-tecnicos-2026`).
- **Pendiente**: la URL responde `403 Acceso denegado` — el script nunca se
  ha autorizado a sí mismo a tocar Sheets/Drive. Google exige que esa
  autorización se conceda a mano desde el editor, así sea una sola vez;
  ninguna llamada por API (`clasp run`, `clasp deploy`) puede completarla.

## 1. Autorizar permisos (el único paso que falta)

1. Abre el editor: https://script.google.com/d/111hel45IshMroRo3eUhrRQ25cx6PAmuQNfRI0rppICIer1jynAEj66CP/edit
2. En el menú de funciones (arriba, junto a "Depurar"), elige **`inicializar`** y pulsa **Ejecutar**.
3. Google pedirá autorizar permisos (Hojas de cálculo y Drive) — acepta con la cuenta dueña del script (`edurural.osorio.alejandro@gmail.com`).
4. Vuelve a pulsar **Ejecutar** después de autorizar (la primera corrida se interrumpe justo en el paso de permisos).
5. Confirma en el spreadsheet que apareció la pestaña `respuestas` con el encabezado (`id, Marca temporal, Estudiante, Institución, Opción 1, Área 1, Opción 2, Área 2, Opción 3, Área 3`).

Con eso, la URL que ya está en `js/config.js` empieza a responder — no hace
falta volver a desplegar ni tocar nada más. Verifícalo con:
```bash
curl -s "https://script.google.com/macros/s/AKfycbz9ubSnljiK9l11DJKvOZHR0BFnbZrONW8d2jIIruxLhU_SLEn9n3rjUTGyIUd1VtJUdA/exec?accion=todosLosRegistros&t=mzl-tecnicos-2026"
```
Debe responder `{"ok":true,"data":[]}` (lista vacía si aún no hay respuestas).
Sin el `t` correcto debe responder `{"ok":false,"error":"Enlace no válido."}`.

## Si cambias `Code.gs` más adelante

```bash
cd gas
clasp push --force
clasp deployments                          # copiar el deploymentId activo (no @HEAD)
clasp deploy -i <deploymentId> -d "descripción del cambio"   # publica en la misma URL /exec
```

## 3. Probar el formulario en local

Sitio estático sin build:

```bash
npx serve .
```

o abre [index.html](index.html) directo en el navegador. Llena una respuesta
completa (nombre, institución, top 3) y confirma que aparece en la pestaña
`respuestas` del spreadsheet. Luego recarga la página: debe mostrar la
pantalla "ya respondiste" en vez del formulario en blanco.

Abre [dashboard.html](dashboard.html)?t=mzl-tecnicos-2026 (o el token que
hayas puesto) y confirma que los KPIs, el ranking y la matriz reflejan esa
respuesta de prueba.

## Publicar en GitHub Pages

1. Crear el repositorio en la organización `alianzaeducacionrural` (o donde
   corresponda).
2. `git init`, `git add -A`, primer commit, `git push` a `main`.
3. En **Settings → Pages** del repo: fuente = rama `main`, carpeta `/ (root)`.
4. El sitio queda en `https://<org>.github.io/<repo>/` y
   `https://<org>.github.io/<repo>/dashboard.html?t=<token>`.

GitHub Pages tarda uno o dos minutos en reflejar cada push.

## Enlaces por institución (opcional pero recomendado)

`index.html?ie=la-linda` preselecciona la institución (slug = nombre en
minúsculas con espacios reemplazados por guiones) y salta el select — útil
para repartir un enlace distinto a cada rector o para generar los QR de cada
salón. Ejemplos:

- `?ie=la-linda` → La Linda
- `?ie=jose-antonio-galan` → José Antonio Galán
- `?ie=serafico-san-antonio-de-padua` → Seráfico San Antonio de Padua

(el slug se normaliza sin tildes al comparar, así que `?ie=jose-antonio-galan` también funciona sin acentos)

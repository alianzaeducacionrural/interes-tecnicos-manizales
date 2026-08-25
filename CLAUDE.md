# CLAUDE.md — Interés en técnicos profesionales (Manizales rural)

Encuesta para las 13 instituciones educativas rurales de Manizales: cada
estudiante elige su top 3 de programas técnicos profesionales entre los 18
que se pueden ofertar en el municipio (filtrados del Excel de "Programas que
se pueden ofertar en el departamento de Caldas y Manizales"). El objetivo es
un dato accionable — cuántos estudiantes pondrían cada programa de primera
opción, y en qué instituciones — para decidir qué cohortes abrir.

Sitio estático sin build (GitHub Pages) + Google Apps Script (backend) +
Google Sheets (almacenamiento). Mismo patrón que `Encuesta desarrollo de
acciones por departamento` y `Encuesta Daños por sismo`, del mismo equipo.

## Estructura

```
index.html              formulario del estudiante (3 pasos, mobile-first)
dashboard.html           panel de administrador (desktop-first)
css/tokens.css           paleta (teal + lima) + reset + fuentes
css/formulario.css
css/dashboard.css
js/config.js             CONFIG.GAS_URL + CONFIG.ADMIN_TOKEN
js/texto.js              nombrePropio() — normalización de nombres
js/catalogo.js           los 18 programas + las 13 instituciones (dato estático)
js/formulario.js         lógica del formulario público
js/dashboard.js          lógica del panel de administrador
gas/Code.gs              backend Apps Script
gas/appsscript.json      manifiesto
favicon.svg
```

## Reglas duras (no cambiar sin razón)

- **`POST` con `Content-Type: text/plain`** (js/formulario.js `postGAS`,
  js/dashboard.js no tiene POST) — evita el preflight CORS que Apps Script
  no maneja. No cambiar a `application/json`.
- **`js/catalogo.js` es la única fuente del catálogo en el frontend.**
  `gas/Code.gs` mantiene un espejo mínimo (`PROGRAMAS = {id: {area}}`) para
  derivar el área de cada opción sin confiar en lo que mande el cliente. Si
  agregas o quitas un programa, actualiza los dos archivos.
- **Mobile-first en `css/formulario.css`**, porque la inmensa mayoría de
  respuestas llegan desde el celular de un estudiante, muchas veces con
  conectividad baja. Sin frameworks, sin CDN de JS, solo Google Fonts + SVG
  inline — cualquier librería nueva pesa contra ese objetivo.
- **`css/dashboard.css` es desktop-first** a propósito — lo usa el equipo
  desde computador, no los estudiantes.
- El panel de administrador **no tiene login**. Se protege con
  `dashboard.html?t=<token>`, validado en `doGet` (`TOKEN_ADMIN` en
  `gas/Code.gs`, `CONFIG.ADMIN_TOKEN` en `js/config.js` — deben coincidir).
  Es una barrera de obscuridad, no autenticación real: el filtrado ocurre en
  el servidor para que un enlace sin token nunca haga viajar un solo dato
  por la red, pero cualquiera con el token correcto ve todo.

## Anti-duplicado

Tres capas (ver `gas/Code.gs` → `guardarRespuesta_` y `verificar_`,
`js/formulario.js` → `revisarDuplicado`):

1. Chequeo en vivo (`GET accion=verificar`) al llenar nombre + institución:
   si ya existe, ofrece "Ya respondí" (bloquea) o "Soy otra persona" (marca
   `permitirHomonimo` y deja continuar).
2. Defensa real: `guardarRespuesta_` re-verifica la clave natural
   `Nombre|Institución` dentro de un `LockService`, y solo la salta si llega
   `permitirHomonimo: true`.
3. `localStorage` (`interes_tecnicos_enviado`): al recargar, muestra la
   pantalla "ya respondiste" en vez de un formulario en blanco. Es
   conveniencia, no seguridad — un estudiante puede borrar su localStorage y
   volver a intentar; la capa 2 es la que realmente lo detiene.

No hay documento de identidad en el formulario (decisión explícita del
usuario: solo nombre + institución), así que dos homónimos reales en la
misma institución dependen del botón "Soy otra persona". Si eso genera
fricción en campo, la solución más simple es agregar un campo `grado` al
catálogo y al Sheet — no requiere tocar la lógica de duplicados.

## Extra ya incluido

`index.html?ie=la-linda` preselecciona la institución (slug sin tildes,
`js/formulario.js` → `slugInstitucion`/`quitarTildes`) y salta el select —
pensado para repartir un enlace distinto por institución o generar QR por
salón. Ver el listado de slugs en `SETUP.md`.

## Verificación rápida tras cualquier cambio

```bash
curl -s "<GAS_URL>/exec?accion=todosLosRegistros&t=<ADMIN_TOKEN>"
```
Debe responder `{"ok":true,"data":[...]}`. Con token vacío o incorrecto,
`{"ok":false,"error":"Enlace no válido."}`.

## Estado del despliegue

Script (`gas/.clasp.json` → `scriptId`), spreadsheet y Web App ya existen;
`js/config.js` ya tiene la URL real. Lo único pendiente es un clic manual
que ningún tooling puede automatizar: el script nunca se ha autorizado a sí
mismo a tocar Sheets/Drive, así que la Web App responde `403 Acceso
denegado` hasta que alguien ejecute `inicializar()` una vez desde el editor
y acepte el permiso de Google. Ver el paso 1 de `SETUP.md`.

Ver `SETUP.md` para el flujo completo de despliegue.

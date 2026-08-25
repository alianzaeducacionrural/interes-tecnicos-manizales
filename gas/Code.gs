/**
 * ============================================================
 * Encuesta de interés en programas técnicos profesionales — Manizales rural
 * Backend Google Apps Script (standalone, no vinculado a un Sheet)
 * ============================================================
 * Desplegar como Web App:
 *   Implementar → Nueva implementación → Aplicación web
 *   Ejecutar como: Yo (tu cuenta de Google)
 *   Quién tiene acceso: Cualquier usuario
 * Copiar la URL /exec resultante a js/config.js como GAS_URL.
 *
 * El spreadsheet de resultados ya está creado (RESULTS_SHEET_ID abajo, dentro
 * de la carpeta de Drive del proyecto). Antes de usar el formulario, ejecutar
 * UNA vez inicializar() desde este editor (menú de funciones → inicializar →
 * Ejecutar) para autorizar permisos y asegurar la pestaña "respuestas" con su
 * encabezado. Ver SETUP.md para el detalle.
 * ============================================================
 */

// ─── Configuración ──────────────────────────────────────────

// ID del spreadsheet de resultados. Ya creado directamente en CARPETA_DRIVE_ID
// (ver SETUP.md) — inicializar() solo necesita asegurar la pestaña "respuestas"
// y su encabezado, no crear el archivo.
var RESULTS_SHEET_ID = '1kmBUDkYM3YlKrVU1CnxoKyVuLBSfvaS_7OaNbGqbR44';

// Carpeta de Drive donde debe quedar el spreadsheet — indicada por el usuario.
// https://drive.google.com/drive/folders/10b2snCAFttAZxvOVIfoDl9sWYRfTv1PG
var CARPETA_DRIVE_ID = '10b2snCAFttAZxvOVIfoDl9sWYRfTv1PG';

var HEADERS_RESPUESTAS = [
  'id', 'Marca temporal',
  'Estudiante', 'Institución',
  'Opción 1', 'Área 1',
  'Opción 2', 'Área 2',
  'Opción 3', 'Área 3',
];

// Índices 1-based de columnas.
var COL = {
  ID: 1, FECHA: 2,
  ESTUDIANTE: 3, INSTITUCION: 4,
  OPCION1: 5, AREA1: 6,
  OPCION2: 7, AREA2: 8,
  OPCION3: 9, AREA3: 10,
};

// Catálogo de programas espejado del frontend (js/catalogo.js) — el
// backend necesita id → {nombre, area} para validar lo que llega y para
// derivar la columna de área sin confiar en lo que mande el cliente.
var PROGRAMAS = {
  'proyectos-agropecuarios': { area: 'agro' },
  'produccion-agricola': { area: 'agro' },
  'produccion-cafetera': { area: 'agro' },
  'gestion-comercial-agropecuario': { area: 'agro' },
  'saneamiento-ambiental': { area: 'ambiente' },
  'manejo-ambiental-sostenibilidad': { area: 'ambiente' },
  'seguridad-laboral': { area: 'ambiente' },
  'internet-de-las-cosas': { area: 'tecnologia' },
  'programacion-computadores': { area: 'tecnologia' },
  'comercio-electronico': { area: 'tecnologia' },
  'mantenimiento-mecanico': { area: 'industria' },
  'control-industrial': { area: 'industria' },
  'procesos-manufactura': { area: 'industria' },
  'procesos-contables-financieros': { area: 'administracion' },
  'atencion-al-cliente': { area: 'administracion' },
  'archivistica': { area: 'administracion' },
  'analisis-de-alimentos': { area: 'alimentos-turismo' },
  'operacion-empresas-turisticas': { area: 'alimentos-turismo' },
};

var INSTITUCIONES_VALIDAS = [
  'Giovanni Montini', 'Granada', 'José Antonio Galán', 'La Cabaña', 'La Linda',
  'La Trinidad', 'La Violeta', 'Maltería', 'María Goretti', 'Miguel Antonio Caro',
  'Rafael Pombo', 'San Peregrino', 'Seráfico San Antonio de Padua',
];

// Token de acceso al panel de administrador (dashboard.html?t=...). Ver la
// nota de seguridad en todosLosRegistros_ más abajo: esto es una barrera de
// obscuridad, no autenticación real, pero evita que cualquiera con la URL
// del sitio llegue a los datos.
var TOKEN_ADMIN = 'mzl-tecnicos-2026';

// ─── Router HTTP ────────────────────────────────────────────

function doGet(e) {
  try {
    var accion = (e && e.parameter && e.parameter.accion) || '';
    if (accion === 'verificar') {
      return jsonResponse(verificar_(
        (e.parameter && e.parameter.nombre) || '',
        (e.parameter && e.parameter.institucion) || ''
      ));
    }
    if (accion === 'todosLosRegistros') {
      var token = (e.parameter && e.parameter.t) || '';
      if (!token || token !== TOKEN_ADMIN) {
        return errorResponse('Enlace no válido.');
      }
      return jsonResponse(todosLosRegistros_());
    }
    return errorResponse('Acción no reconocida: ' + accion);
  } catch (err) {
    return errorResponse(err.message);
  }
}

function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);
    var accion = datos.accion || '';
    switch (accion) {
      case 'guardarRespuesta':
        return jsonResponse(guardarRespuesta_(datos));
      default:
        return errorResponse('Acción no reconocida: ' + accion);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Normalización "Nombre Propio" ──────────────────────────
// Misma lógica vive espejada en js/texto.js (nombrePropio) — duplicada aquí
// porque el backend es la última línea de defensa: nada entra al Sheet sin
// pasar por ella, sin importar qué llegue por POST.

var CONECTORES_ = ['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'a', 'al', 'en', 'con', 'para', 'por', 'un', 'una'];

function nombrePropio_(texto) {
  if (texto === null || texto === undefined) return '';
  var limpio = String(texto).trim().replace(/\s+/g, ' ');
  if (!limpio) return '';

  var esPrimeraPalabra = true;
  var palabras = limpio.split(' ').map(function (palabra) {
    if (!palabra) return palabra;
    var segmentos = palabra.split(/([.-])/).map(function (parte) {
      if (parte === '.' || parte === '-') return parte;
      if (!parte) return parte;
      var out = capitalizarSegmento_(parte, esPrimeraPalabra);
      esPrimeraPalabra = false;
      return out;
    });
    return segmentos.join('');
  });
  return palabras.join(' ');
}

function capitalizarSegmento_(segmento, esPrimeraPalabra) {
  var minusc = segmento.toLowerCase();
  if (!esPrimeraPalabra && CONECTORES_.indexOf(minusc) !== -1) return minusc;
  return capitalizarPalabra_(segmento);
}

function capitalizarPalabra_(palabra) {
  if (!palabra) return palabra;
  if (palabra.length <= 5 && /^[ivxlcdm]+$/i.test(palabra)) return palabra.toUpperCase();
  return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
}

// ─── Claves naturales ───────────────────────────────────────

function claveRespuesta_(nombre, institucion) {
  return [nombre, institucion].map(normalizarClave_).join('|');
}

function normalizarClave_(s) {
  return String(s || '').trim().toLowerCase();
}

// ─── GET ?accion=verificar&nombre=...&institucion=... ───────
// ¿Ya existe una respuesta con ese nombre en esa institución? La usa el
// formulario para avisar en vivo antes de dejar avanzar al estudiante. No es
// la defensa real (se puede saltar armando el POST a mano) — esa vive en
// guardarRespuesta_, dentro del lock.

function verificar_(nombre, institucion) {
  var sheet = getSheet_('respuestas');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || !nombre || !institucion) return { existe: false };

  var clave = claveRespuesta_(nombre, institucion);
  var filas = sheet.getRange(2, 1, lastRow - 1, HEADERS_RESPUESTAS.length).getValues();
  for (var i = 0; i < filas.length; i++) {
    var claveFila = claveRespuesta_(filas[i][COL.ESTUDIANTE - 1], filas[i][COL.INSTITUCION - 1]);
    if (claveFila === clave) return { existe: true };
  }
  return { existe: false };
}

// ─── GET ?accion=todosLosRegistros&t=<token> ────────────────
// Todas las filas — la consume el panel de administrador. Todo el cálculo
// (ranking, matriz, KPIs) se hace en memoria en el cliente; aquí solo se
// exige el token antes de dejar salir un solo dato por la red.

function todosLosRegistros_() {
  var sheet = getSheet_('respuestas');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var filas = sheet.getRange(2, 1, lastRow - 1, HEADERS_RESPUESTAS.length).getValues();
  return filas.map(filaAObjeto_);
}

function filaAObjeto_(f) {
  return {
    id: f[COL.ID - 1],
    fecha: f[COL.FECHA - 1],
    estudiante: f[COL.ESTUDIANTE - 1],
    institucion: f[COL.INSTITUCION - 1],
    opcion1: f[COL.OPCION1 - 1], area1: f[COL.AREA1 - 1],
    opcion2: f[COL.OPCION2 - 1], area2: f[COL.AREA2 - 1],
    opcion3: f[COL.OPCION3 - 1], area3: f[COL.AREA3 - 1],
  };
}

function siguienteId_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .map(function (f) { return parseInt(f[0], 10); })
    .filter(function (n) { return !isNaN(n); });
  return ids.length ? Math.max.apply(null, ids) + 1 : 1;
}

// ─── POST accion=guardarRespuesta ───────────────────────────
// Nombre + institución son obligatorios; opción 1 también (la 2 y 3 son
// opcionales). El área de cada opción se deriva aquí del catálogo, nunca se
// confía en lo que mande el cliente. Rechaza duplicados por clave natural
// Nombre|Institución salvo que venga permitirHomonimo:true (el estudiante
// confirmó explícitamente que es otra persona con el mismo nombre).

function guardarRespuesta_(datos) {
  var estudiante = nombrePropio_(datos.estudiante);
  var institucion = String(datos.institucion || '').trim();
  var opcion1 = String(datos.opcion1 || '').trim();
  var opcion2 = String(datos.opcion2 || '').trim();
  var opcion3 = String(datos.opcion3 || '').trim();
  var permitirHomonimo = datos.permitirHomonimo === true;

  if (!estudiante) throw new Error('Falta el nombre del estudiante.');
  if (INSTITUCIONES_VALIDAS.indexOf(institucion) === -1) throw new Error('Institución no válida: ' + institucion);
  if (!opcion1 || !PROGRAMAS[opcion1]) throw new Error('Falta elegir al menos un programa como 1ra opción.');
  if (opcion2 && !PROGRAMAS[opcion2]) throw new Error('Programa no válido en la 2da opción.');
  if (opcion3 && !PROGRAMAS[opcion3]) throw new Error('Programa no válido en la 3ra opción.');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet_('respuestas');
    asegurarEncabezadoRespuestas_(sheet);

    var clave = claveRespuesta_(estudiante, institucion);
    if (!permitirHomonimo) {
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        var filas = sheet.getRange(2, 1, lastRow - 1, HEADERS_RESPUESTAS.length).getValues();
        for (var i = 0; i < filas.length; i++) {
          var claveFila = claveRespuesta_(filas[i][COL.ESTUDIANTE - 1], filas[i][COL.INSTITUCION - 1]);
          if (claveFila === clave) {
            throw new Error('Ya hay una respuesta a nombre de ' + estudiante + ' en ' + institucion + '.');
          }
        }
      }
    }

    var fila = [
      siguienteId_(sheet), new Date(),
      estudiante, institucion,
      opcion1, PROGRAMAS[opcion1].area,
      opcion2, opcion2 ? PROGRAMAS[opcion2].area : '',
      opcion3, opcion3 ? PROGRAMAS[opcion3].area : '',
    ];
    sheet.appendRow(fila);
    return { id: fila[0] };
  } finally {
    lock.releaseLock();
  }
}

// ─── Funciones auxiliares para leer/escribir el spreadsheet ─

function getResultsSpreadsheet_() {
  if (!RESULTS_SHEET_ID) throw new Error('RESULTS_SHEET_ID está vacío. Ejecuta inicializar() primero.');
  return SpreadsheetApp.openById(RESULTS_SHEET_ID);
}

function getSheet_(nombre) {
  var ss = getResultsSpreadsheet_();
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) sheet = ss.insertSheet(nombre);
  return sheet;
}

// Crea el encabezado de "respuestas" si la pestaña está vacía, o lo
// reescribe si cambió HEADERS_RESPUESTAS y todavía no hay filas de datos
// reales. Nunca toca una pestaña con datos.
function asegurarEncabezadoRespuestas_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_RESPUESTAS);
    return;
  }
  if (sheet.getLastRow() === 1) {
    var actual = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].join('|');
    if (actual !== HEADERS_RESPUESTAS.join('|')) {
      sheet.clearContents();
      sheet.appendRow(HEADERS_RESPUESTAS);
    }
  }
}

// ─── Inicialización (ejecutar UNA vez a mano) ───────────────

function inicializar() {
  var ss;
  if (RESULTS_SHEET_ID) {
    ss = SpreadsheetApp.openById(RESULTS_SHEET_ID);
  } else {
    ss = SpreadsheetApp.create('Interés en técnicos profesionales — Manizales — Registro');
    moverArchivoACarpeta_(ss.getId(), CARPETA_DRIVE_ID);
    Logger.log('Spreadsheet creado en la carpeta de Drive indicada. Copia este ID a RESULTS_SHEET_ID en Code.gs: ' + ss.getId());
  }

  var hResp = ss.getSheetByName('respuestas') || ss.insertSheet('respuestas');
  asegurarEncabezadoRespuestas_(hResp);

  var hojaPorDefecto = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hojaPorDefecto && ss.getSheets().length > 1) ss.deleteSheet(hojaPorDefecto);

  Logger.log('Listo. URL del spreadsheet: ' + ss.getUrl());
}

// SpreadsheetApp.create() siempre deja el archivo en la raíz de "Mi unidad";
// esto lo mueve a la carpeta de Drive del proyecto justo después de crearlo.
function moverArchivoACarpeta_(fileId, carpetaId) {
  var archivo = DriveApp.getFileById(fileId);
  var carpetaDestino = DriveApp.getFolderById(carpetaId);
  carpetaDestino.addFile(archivo);
  DriveApp.getRootFolder().removeFile(archivo);
}

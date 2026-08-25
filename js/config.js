// ================================================
// CONFIGURACIÓN — URL del backend en Google Apps Script
// ================================================
const CONFIG = {
  // Web app desplegada (gas/.clasp.json → scriptId 111hel45IshMroRo3eUhrRQ25cx6PAmuQNfRI0rppICIer1jynAEj66CP).
  // Todavía no responde: el script nunca se ha autorizado a sí mismo (Sheets +
  // Drive). Falta el paso manual de SETUP.md — ejecutar inicializar() una vez
  // desde el editor y aceptar el permiso — después de eso esta URL funciona
  // tal cual, sin volver a desplegar.
  GAS_URL: 'https://script.google.com/macros/s/AKfycbz9ubSnljiK9l11DJKvOZHR0BFnbZrONW8d2jIIruxLhU_SLEn9n3rjUTGyIUd1VtJUdA/exec',

  // Token del panel de administrador (ver TOKEN_ADMIN en gas/Code.gs).
  // Se usa como dashboard.html?t=<este valor>. No es autenticación real
  // — es una barrera de obscuridad, igual que en los proyectos anteriores.
  ADMIN_TOKEN: 'mzl-tecnicos-2026',
};

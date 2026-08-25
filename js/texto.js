// ================================================
// TEXTO.JS — normalización "Nombre Propio"
// ================================================
// Misma lógica vive espejada en gas/Code.gs (función nombrePropio_) porque el
// backend es la última línea de defensa: nada entra al Sheet sin pasar por
// ella, sin importar qué llegue por POST.
//
// Si cambias las reglas, cámbialas en los dos sitios.

// Conectores que quedan en minúscula salvo que sean la primera palabra.
const CONECTORES = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'a', 'al',
  'en', 'con', 'para', 'por', 'un', 'una',
]);

// Números romanos comunes en nombres propios (Juan Pablo II, Siglo XXI...).
const ROMANO = /^[IVXLCDM]+$/;

function capitalizarPalabra(palabra) {
  if (!palabra) return palabra;
  // Números romanos van en mayúscula completa.
  if (ROMANO.test(palabra.toUpperCase()) && palabra.length <= 5) {
    return palabra.toUpperCase();
  }
  const primera = palabra.charAt(0).toUpperCase();
  const resto = palabra.slice(1).toLowerCase();
  return primera + resto;
}

// Capitaliza cada segmento separado por guion o punto, para que
// "san jose" -> "San Jose" y "juan-carlos" -> "Juan-Carlos" se comporten bien.
function capitalizarSegmento(segmento, esPrimeraPalabra) {
  const minusc = segmento.toLowerCase();
  if (!esPrimeraPalabra && CONECTORES.has(minusc)) {
    return minusc;
  }
  return capitalizarPalabra(segmento);
}

/**
 * Normaliza un texto a formato "Nombre Propio": cada palabra capitalizada,
 * conectores (de, del, la, el...) en minúscula salvo al inicio, tildes y
 * ñ conservadas, números romanos en mayúscula, guiones y puntos respetados.
 *
 *   nombrePropio('JUAN PEREZ GOMEZ')  -> 'Juan Perez Gomez'
 *   nombrePropio('la esperanza')      -> 'La Esperanza'
 */
function nombrePropio(texto) {
  if (texto == null) return '';
  const limpio = String(texto).trim().replace(/\s+/g, ' ');
  if (!limpio) return '';

  let esPrimeraPalabra = true;
  return limpio
    .split(' ')
    .map((palabra) => {
      if (!palabra) return palabra;
      const resultado = palabra
        .split(/([.-])/)
        .map((parte) => {
          if (parte === '.' || parte === '-') return parte;
          if (!parte) return parte;
          const out = capitalizarSegmento(parte, esPrimeraPalabra);
          esPrimeraPalabra = false;
          return out;
        })
        .join('');
      return resultado;
    })
    .join(' ');
}

// Exponer tanto para <script> plano (navegador) como para import (Node/ESM).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { nombrePropio };
}

// ================================================
// FORMULARIO.JS — lógica de la encuesta de interés en técnicos
// ================================================
// Formulario de una sola página (sin pasos ni navegación forzada): los
// datos del estudiante y la galería de programas están siempre visibles;
// la barra flotante inferior (podio + botón de envío) acompaña todo el
// scroll y valida al momento de enviar, no antes.

const ICONO_AREA = {
  agro: 'icono-hoja',
  ambiente: 'icono-escudo',
  tecnologia: 'icono-chip',
  industria: 'icono-engranaje',
  administracion: 'icono-maletin',
  'alimentos-turismo': 'icono-plato',
};

const MEDALLAS = ['🥇', '🥈', '🥉'];
const CLAVE_ENVIADO = 'interes_tecnicos_enviado';

const estado = {
  nombre: '',
  institucion: '',
  permitirHomonimo: false,
  duplicadoSinResolver: false,
  filtroArea: 'todas',
  podio: [null, null, null], // ids de PROGRAMAS, en orden 1ra/2da/3ra
  programaModalId: null,
  elementoDisparadorModal: null,
};

// ─── Comunicación con el backend ────────────────────────────

async function postGAS(payload) {
  if (!CONFIG.GAS_URL) throw new Error('El backend todavía no está configurado (CONFIG.GAS_URL vacío).');
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // evita el preflight CORS que Apps Script no maneja
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function getGAS(params) {
  if (!CONFIG.GAS_URL) throw new Error('El backend todavía no está configurado (CONFIG.GAS_URL vacío).');
  const url = `${CONFIG.GAS_URL}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

// ─── Utilidades ──────────────────────────────────────────────

function normalizarClave(s) { return String(s || '').trim().toLowerCase(); }
function claveLocal(nombre, institucion) { return normalizarClave(nombre) + '|' + normalizarClave(institucion); }

// Quita tildes para comparar slugs de URL (?ie=jose-antonio-galan) sin
// obligar a nadie a escribir "é" o "á" en un enlace que van a compartir.
function quitarTildes(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function slugInstitucion(nombre) {
  return quitarTildes(normalizarClave(nombre)).replace(/\s+/g, '-');
}

// programaPorId() y areaPorId() viven en js/catalogo.js — las comparte con
// dashboard.js.

// Convierte el texto crudo del perfil (frases separadas por ";") en viñetas
// legibles: recorta espacios, capitaliza la primera letra y quita el punto
// final de cada una.
function formatearPerfil(perfil) {
  if (!perfil) return [];
  return perfil
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\.$/, ''))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

function aplicarColorArea(el, areaId) {
  el.style.setProperty('--color-area', `var(--area-${areaId})`);
  el.style.setProperty('--bg-area', `var(--area-${areaId}-bg)`);
}

// ─── Inicialización ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (revisarSiYaRespondio()) return;
  poblarInstituciones();
  poblarFiltros();
  renderGaleria();
  wireEventos();
  renderPodio();
});

function revisarSiYaRespondio() {
  let guardado;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE_ENVIADO) || 'null'); } catch (e) { guardado = null; }
  if (!guardado) return false;
  document.getElementById('app').classList.add('oculto');
  document.getElementById('podioFlotante').classList.add('oculto');
  document.getElementById('pantallaYaRespondio').classList.remove('oculto');
  return true;
}

function poblarInstituciones() {
  const select = document.getElementById('selectInstitucion');
  INSTITUCIONES.forEach((nombre) => {
    const opt = new Option(nombre, nombre);
    select.appendChild(opt);
  });
  // Preselección por enlace: index.html?ie=la-linda
  const ieParam = new URLSearchParams(location.search).get('ie');
  if (ieParam) {
    const encontrada = INSTITUCIONES.find((n) => slugInstitucion(n) === quitarTildes(normalizarClave(ieParam)));
    if (encontrada) {
      select.value = encontrada;
      select.dispatchEvent(new Event('change'));
    }
  }
}

function poblarFiltros() {
  const cont = document.getElementById('filtrosArea');
  const pildoraTodas = crearPildora('todas', 'Todas', true);
  cont.appendChild(pildoraTodas);
  AREAS.forEach((area) => cont.appendChild(crearPildora(area.id, area.nombre, false)));
}

function crearPildora(id, texto, activa) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pildora-filtro' + (activa ? ' activa' : '');
  btn.textContent = texto;
  btn.dataset.area = id;
  btn.addEventListener('click', () => {
    estado.filtroArea = id;
    document.querySelectorAll('.pildora-filtro').forEach((p) => p.classList.toggle('activa', p.dataset.area === id));
    renderGaleria();
  });
  return btn;
}

function renderGaleria() {
  const cont = document.getElementById('galeriaProgramas');
  cont.innerHTML = '';
  const lista = estado.filtroArea === 'todas'
    ? PROGRAMAS
    : PROGRAMAS.filter((p) => p.area === estado.filtroArea);

  lista.forEach((prog, i) => {
    const area = areaPorId(prog.area);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'tarjeta-programa';
    card.style.animationDelay = `${Math.min(i, 10) * 0.04}s`;
    aplicarColorArea(card, area.id);
    card.dataset.id = prog.id;

    const slotAsignado = estado.podio.indexOf(prog.id);
    if (slotAsignado !== -1) card.classList.add('elegida');

    card.innerHTML = `
      <div class="tarjeta-programa-icono"><svg class="icono-svg"><use href="#${ICONO_AREA[area.id]}"/></svg></div>
      <div class="tarjeta-programa-nombre">${prog.nombre}</div>
      <div class="tarjeta-programa-meta">
        <span class="chip-area">${area.nombre}</span>
        <span class="chip-horas"><svg class="icono-svg"><use href="#icono-reloj"/></svg> ${prog.horas} h/semana</span>
      </div>
      ${slotAsignado !== -1 ? `<span class="medalla-tarjeta">${MEDALLAS[slotAsignado]}</span>` : ''}
    `;
    card.addEventListener('click', () => abrirModal(prog.id, card));
    cont.appendChild(card);
  });
}

// ─── Modal de detalle ────────────────────────────────────────

function abrirModal(idPrograma, elementoDisparador) {
  const prog = programaPorId(idPrograma);
  const area = areaPorId(prog.area);
  estado.programaModalId = idPrograma;
  estado.elementoDisparadorModal = elementoDisparador;

  const modal = document.getElementById('modal');
  aplicarColorArea(modal, area.id);

  const chip = document.getElementById('modalChipArea');
  chip.textContent = area.nombre;
  chip.style.background = `var(--bg-area)`;
  chip.style.color = `var(--color-area)`;

  document.getElementById('modalTitulo').textContent = prog.nombre;
  document.getElementById('modalHoras').textContent = `${prog.horas} horas de clase semanales`;

  const perfilEl = document.getElementById('modalPerfil');
  const viñetas = formatearPerfil(prog.perfil);
  perfilEl.innerHTML = viñetas.length
    ? viñetas.map((v) => `<li>${v}</li>`).join('')
    : `<li class="perfil-vacio">Perfil profesional en construcción — muy pronto tendremos más detalles de este programa.</li>`;

  actualizarBotonesModal();

  document.getElementById('modalFondo').classList.remove('oculto');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('modalFondo').classList.add('oculto');
  document.body.style.overflow = '';
  if (estado.elementoDisparadorModal) estado.elementoDisparadorModal.focus();
  estado.programaModalId = null;
}

function actualizarBotonesModal() {
  [1, 2, 3].forEach((n) => {
    const btn = document.querySelector(`.btn-opcion[data-opcion="${n}"]`);
    btn.classList.toggle(`marcada-${n}`, estado.podio[n - 1] === estado.programaModalId);
  });
}

function elegirOpcion(numero) {
  const idx = numero - 1;
  const idPrograma = estado.programaModalId;

  if (estado.podio[idx] === idPrograma) {
    // Ya estaba en ese puesto: lo quita (toggle).
    estado.podio[idx] = null;
  } else {
    // Si el programa ya ocupaba otro puesto, lo libera primero.
    const otroIdx = estado.podio.indexOf(idPrograma);
    if (otroIdx !== -1) estado.podio[otroIdx] = null;
    estado.podio[idx] = idPrograma;
  }

  renderPodio();
  renderGaleria();
  cerrarModal();
}

// ─── Podio flotante ──────────────────────────────────────────

function renderPodio() {
  const cont = document.getElementById('podioSlots');
  cont.innerHTML = '';

  estado.podio.forEach((idPrograma, i) => {
    const slot = document.createElement('div');
    slot.className = 'podio-slot' + (idPrograma ? ' lleno' : '');
    if (idPrograma) {
      const prog = programaPorId(idPrograma);
      slot.innerHTML = `
        <span class="podio-slot-medalla">${MEDALLAS[i]}</span>
        <span class="podio-slot-texto" title="${prog.nombre}">${prog.nombre}</span>
        <button type="button" class="quitar-slot" aria-label="Quitar" data-slot="${i}">
          <svg class="icono-svg"><use href="#icono-equis"/></svg>
        </button>
      `;
      slot.querySelector('.quitar-slot').addEventListener('click', (e) => {
        e.stopPropagation();
        estado.podio[i] = null;
        renderPodio();
        renderGaleria();
      });
    } else {
      slot.innerHTML = `<span class="podio-slot-medalla">${MEDALLAS[i]}</span><span class="podio-slot-texto">Toca un programa…</span>`;
    }
    cont.appendChild(slot);
  });

  const elegidos = estado.podio.filter(Boolean).length;
  document.getElementById('podioContador').textContent = `${elegidos}/3`;
}

// ─── Anti-duplicado (se revisa al llenar los datos, no bloquea el scroll) ──

async function revisarDuplicado() {
  const nombre = document.getElementById('inputNombre').value.trim();
  const institucion = document.getElementById('selectInstitucion').value;
  const aviso = document.getElementById('avisoDuplicado');

  estado.nombre = nombre;
  estado.institucion = institucion;

  if (estado.permitirHomonimo) {
    aviso.classList.add('oculto');
    estado.duplicadoSinResolver = false;
    return;
  }

  const valido = nombre.split(' ').filter(Boolean).length >= 2 && institucion;
  if (!valido) {
    aviso.classList.add('oculto');
    estado.duplicadoSinResolver = false;
    return;
  }

  try {
    const resultado = await getGAS({ accion: 'verificar', nombre, institucion });
    if (resultado.existe) {
      document.getElementById('avisoDuplicadoTexto').textContent =
        `Ya hay una respuesta a nombre de ${nombre} en ${institucion}. ¿Eres tú?`;
      aviso.classList.remove('oculto');
      estado.duplicadoSinResolver = true;
    } else {
      aviso.classList.add('oculto');
      estado.duplicadoSinResolver = false;
    }
  } catch (err) {
    // Backend no configurado o sin conexión: no bloquea el flujo, solo no
    // se puede verificar en vivo — la defensa real está en el servidor al
    // momento de guardar.
    console.warn('No se pudo verificar duplicado:', err.message);
    aviso.classList.add('oculto');
    estado.duplicadoSinResolver = false;
  }
}

// ─── Validación + envío ──────────────────────────────────────

function limpiarErrores() {
  ['errorNombre', 'errorInstitucion', 'errorEnvio'].forEach((id) => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.add('oculto');
  });
}

function mostrarError(id, mensaje) {
  const el = document.getElementById(id);
  el.textContent = mensaje;
  el.classList.remove('oculto');
}

function validarFormulario() {
  limpiarErrores();
  const nombre = document.getElementById('inputNombre').value.trim();
  const institucion = document.getElementById('selectInstitucion').value;
  let primerError = null;

  if (nombre.split(' ').filter(Boolean).length < 2) {
    mostrarError('errorNombre', 'Escribe tu nombre y apellido completos.');
    primerError = primerError || document.getElementById('inputNombre');
  }
  if (!institucion) {
    mostrarError('errorInstitucion', 'Selecciona tu institución educativa.');
    primerError = primerError || document.getElementById('selectInstitucion');
  }
  if (estado.duplicadoSinResolver) {
    mostrarError('errorEnvio', 'Resuelve el aviso de arriba: ¿ya respondiste o eres otra persona?');
    primerError = primerError || document.getElementById('avisoDuplicado');
  }
  if (!estado.podio[0]) {
    mostrarError('errorEnvio', 'Elige al menos tu 1ra opción de programa técnico.');
    primerError = primerError || document.getElementById('galeriaProgramas');
  }

  if (primerError) {
    primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof primerError.focus === 'function') primerError.focus({ preventScroll: true });
    return false;
  }
  return true;
}

async function enviarRespuesta() {
  if (!validarFormulario()) return;

  const btn = document.getElementById('btnEnviar');
  const btnTexto = document.getElementById('btnEnviarTexto');
  btn.disabled = true;
  btnTexto.innerHTML = '<span class="spinner-sm"></span> Enviando…';

  try {
    await postGAS({
      accion: 'guardarRespuesta',
      estudiante: estado.nombre,
      institucion: estado.institucion,
      opcion1: estado.podio[0] || '',
      opcion2: estado.podio[1] || '',
      opcion3: estado.podio[2] || '',
      permitirHomonimo: estado.permitirHomonimo,
    });

    try {
      localStorage.setItem(CLAVE_ENVIADO, JSON.stringify({
        clave: claveLocal(estado.nombre, estado.institucion),
        fecha: new Date().toISOString(),
      }));
    } catch (e) { /* almacenamiento no disponible: no es crítico */ }

    mostrarExito();
  } catch (err) {
    mostrarError('errorEnvio', err.message || 'No se pudo enviar. Verifica tu conexión e intenta de nuevo.');
    btn.disabled = false;
    btnTexto.textContent = 'Enviar mis respuestas';
  }
}

function mostrarExito() {
  document.getElementById('exitoNombre').textContent = estado.nombre.split(' ')[0];
  const cont = document.getElementById('exitoPodio');
  cont.innerHTML = estado.podio
    .map((id, i) => {
      if (!id) return '';
      const prog = programaPorId(id);
      return `<div class="resumen-podio-item"><span>${MEDALLAS[i]}</span><span>${prog.nombre}</span></div>`;
    })
    .join('');

  document.querySelectorAll('#app > .tarjeta-paso:not(#pasoExito)').forEach((el) => el.classList.add('oculto'));
  document.getElementById('podioFlotante').classList.add('oculto');
  document.getElementById('pasoExito').classList.remove('oculto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Cableado de eventos ─────────────────────────────────────

function wireEventos() {
  const inputNombre = document.getElementById('inputNombre');
  const selectInstitucion = document.getElementById('selectInstitucion');

  inputNombre.addEventListener('blur', revisarDuplicado);
  selectInstitucion.addEventListener('change', () => {
    const saludo = document.getElementById('saludoInstitucion');
    if (selectInstitucion.value) {
      saludo.textContent = `¡Hola, estudiante de ${selectInstitucion.value}! 👋`;
      saludo.classList.remove('oculto');
    } else {
      saludo.classList.add('oculto');
    }
    revisarDuplicado();
  });

  document.getElementById('btnEsMio').addEventListener('click', () => {
    try {
      localStorage.setItem(CLAVE_ENVIADO, JSON.stringify({
        clave: claveLocal(estado.nombre, estado.institucion),
        fecha: new Date().toISOString(),
      }));
    } catch (e) { /* no crítico */ }
    document.getElementById('app').classList.add('oculto');
    document.getElementById('podioFlotante').classList.add('oculto');
    document.getElementById('pantallaYaRespondio').classList.remove('oculto');
  });

  document.getElementById('btnSoyOtro').addEventListener('click', () => {
    estado.permitirHomonimo = true;
    estado.duplicadoSinResolver = false;
    document.getElementById('avisoDuplicado').classList.add('oculto');
  });

  document.getElementById('btnEnviar').addEventListener('click', enviarRespuesta);

  document.getElementById('modalCerrar').addEventListener('click', cerrarModal);
  document.getElementById('modalFondo').addEventListener('click', (e) => {
    if (e.target.id === 'modalFondo') cerrarModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('modalFondo').classList.contains('oculto')) cerrarModal();
  });
  document.querySelectorAll('.btn-opcion').forEach((btn) => {
    btn.addEventListener('click', () => elegirOpcion(parseInt(btn.dataset.opcion, 10)));
  });
}

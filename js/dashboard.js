// ================================================
// PANEL DE ADMINISTRADOR — Interés en técnicos profesionales
// ================================================
// Sin login: la URL trae ?t=<token>, que el backend valida en doGet antes
// de entregar un solo dato (ver TOKEN_ADMIN en gas/Code.gs). Es una barrera
// de obscuridad, no autenticación real — igual que en los proyectos
// anteriores del equipo — pero evita que cualquiera con la URL del sitio
// público llegue a los resultados.
//
// Todo el cálculo (ranking, semáforo, matriz, KPIs) se hace en memoria en
// el cliente a partir de un único GET ?accion=todosLosRegistros&t=...

const PESO_OPCION = { 1: 3, 2: 2, 3: 1 };
const UMBRAL_STORAGE_KEY = 'interes_tecnicos_umbral';

let respuestas = [];
let orden = { campo: 'fechaTiempo', dir: 'desc' };

document.addEventListener('DOMContentLoaded', iniciar);

function iniciar() {
  const umbralGuardado = localStorage.getItem(UMBRAL_STORAGE_KEY);
  if (umbralGuardado) document.getElementById('inputUmbral').value = umbralGuardado;

  document.getElementById('btnActualizar').addEventListener('click', cargarDatos);
  document.getElementById('btnReintentar').addEventListener('click', cargarDatos);
  document.getElementById('btnDescargarCsv').addEventListener('click', descargarCsv);
  document.getElementById('inputUmbral').addEventListener('input', debounce(() => {
    localStorage.setItem(UMBRAL_STORAGE_KEY, document.getElementById('inputUmbral').value);
    renderSemaforo(respuestas);
  }, 250));
  document.getElementById('filtroTexto').addEventListener('input', debounce(renderTabla, 200));
  document.getElementById('filtroInstitucion').addEventListener('change', renderTabla);
  document.querySelectorAll('.tabla-respuestas thead th[data-orden]').forEach((th) => {
    th.addEventListener('click', () => {
      const campo = th.dataset.orden;
      if (orden.campo === campo) orden.dir = orden.dir === 'asc' ? 'desc' : 'asc';
      else { orden = { campo, dir: 'asc' }; }
      renderTabla();
    });
  });

  cargarDatos();
}

// ─── Utilidades ──────────────────────────────────────────────

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function escaparHtml(s) {
  const div = document.createElement('div');
  div.textContent = String(s == null ? '' : s);
  return div.innerHTML;
}

function tokenDeUrl() {
  return new URLSearchParams(location.search).get('t') || '';
}

async function getGAS(params) {
  if (!CONFIG.GAS_URL) throw new Error('El backend todavía no está configurado (CONFIG.GAS_URL vacío).');
  const url = `${CONFIG.GAS_URL}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

function formatearFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Carga ───────────────────────────────────────────────────

async function cargarDatos() {
  document.getElementById('panelCargando').classList.remove('oculto');
  document.getElementById('panelError').classList.add('oculto');
  document.getElementById('panelContenido').classList.add('oculto');

  try {
    const data = await getGAS({ accion: 'todosLosRegistros', t: tokenDeUrl() });
    respuestas = data.map((r) => ({ ...r, fechaTiempo: r.fecha ? (new Date(r.fecha).getTime() || 0) : 0 }));

    poblarFiltroInstitucion();
    renderizarTodo();

    document.getElementById('panelActualizado').textContent =
      'Actualizado ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('panelCargando').classList.add('oculto');
    document.getElementById('panelContenido').classList.remove('oculto');
  } catch (err) {
    document.getElementById('panelCargando').classList.add('oculto');
    document.getElementById('panelError').classList.remove('oculto');
    document.getElementById('panelErrorMensaje').textContent = err.message || 'No se pudo cargar la información.';
  }
}

function poblarFiltroInstitucion() {
  const sel = document.getElementById('filtroInstitucion');
  const anterior = sel.value;
  sel.innerHTML = '<option value="">Todas las instituciones</option>';
  INSTITUCIONES.forEach((i) => sel.add(new Option(i, i)));
  if (INSTITUCIONES.indexOf(anterior) !== -1) sel.value = anterior;
}

function renderizarTodo() {
  renderKpis(respuestas);
  renderRanking(respuestas);
  renderSemaforo(respuestas);
  renderCobertura(respuestas);
  renderMatriz(respuestas);
  renderTabla();
}

// ─── Cálculos compartidos ────────────────────────────────────

// Puntaje ponderado y conteo crudo de 1ras opciones por programa.
function calcularRanking(lista) {
  const porPrograma = {};
  PROGRAMAS.forEach((p) => { porPrograma[p.id] = { id: p.id, puntaje: 0, primeras: 0, segundas: 0, terceras: 0 }; });

  lista.forEach((r) => {
    [[r.opcion1, 1], [r.opcion2, 2], [r.opcion3, 3]].forEach(([id, n]) => {
      if (!id || !porPrograma[id]) return;
      porPrograma[id].puntaje += PESO_OPCION[n];
      if (n === 1) porPrograma[id].primeras++;
      if (n === 2) porPrograma[id].segundas++;
      if (n === 3) porPrograma[id].terceras++;
    });
  });

  return Object.values(porPrograma).sort((a, b) => b.puntaje - a.puntaje);
}

// ─── KPIs ────────────────────────────────────────────────────

function renderKpis(lista) {
  document.getElementById('kpiTotal').textContent = lista.length;

  const claves = new Set(lista.map((r) => `${(r.estudiante || '').trim().toLowerCase()}|${r.institucion}`));
  document.getElementById('kpiUnicos').textContent = claves.size;

  const instituciones = new Set(lista.map((r) => r.institucion));
  document.getElementById('kpiInstituciones').textContent = `${instituciones.size} / ${INSTITUCIONES.length}`;

  const ranking = calcularRanking(lista);
  const top = ranking.find((r) => r.puntaje > 0);
  document.getElementById('kpiTop').textContent = top ? programaPorId(top.id).nombre : 'Aún sin datos';
}

// ─── Ranking (barras horizontales) ──────────────────────────

function renderBarrasSimple(contenedorId, entradas, { color = 'var(--teal-500)', vacio = 'Todavía no hay respuestas.', formatoValor = (v) => v } = {}) {
  const cont = document.getElementById(contenedorId);
  if (!entradas.length) {
    cont.innerHTML = `<p class="tabla-vacia">${vacio}</p>`;
    return;
  }
  const max = Math.max(...entradas.map((e) => e.total), 1);
  cont.innerHTML = entradas.map((e) => `
    <div class="fila-barra">
      <span class="etiqueta-barra" title="${escaparHtml(e.etiqueta)}">${escaparHtml(e.etiqueta)}</span>
      <div class="pista-barra"><div class="segmento" style="width:${Math.round((e.total / max) * 100)}%; background:${e.color || color};"></div></div>
      <span class="valor-barra">${escaparHtml(formatoValor(e.total))}</span>
    </div>`).join('');
}

function renderRanking(lista) {
  const ranking = calcularRanking(lista).filter((r) => r.puntaje > 0);
  const entradas = ranking.map((r) => {
    const prog = programaPorId(r.id);
    const area = areaPorId(prog.area);
    return {
      clave: r.id,
      etiqueta: prog.nombre,
      total: r.puntaje,
      color: `var(--area-${area.id})`,
    };
  });
  renderBarrasSimple('graficoRanking', entradas, {
    formatoValor: (v) => `${v} pts`,
  });
}

// ─── Semáforo de viabilidad ──────────────────────────────────

function renderSemaforo(lista) {
  const umbral = Math.max(1, parseInt(document.getElementById('inputUmbral').value, 10) || 25);
  const ranking = calcularRanking(lista).sort((a, b) => b.primeras - a.primeras);
  const cont = document.getElementById('listaSemaforo');

  if (!ranking.some((r) => r.primeras > 0)) {
    cont.innerHTML = '<p class="tabla-vacia">Todavía no hay respuestas.</p>';
    return;
  }

  cont.innerHTML = ranking.map((r) => {
    const prog = programaPorId(r.id);
    let estado = 'rojo', etiqueta = 'No alcanza';
    if (r.primeras >= umbral) { estado = 'verde'; etiqueta = 'Viable'; }
    else if (r.primeras >= umbral * 0.6) { estado = 'amarillo'; etiqueta = 'Al límite'; }
    return `
      <div class="fila-semaforo">
        <span class="semaforo-punto semaforo-${estado}"></span>
        <span class="semaforo-nombre" title="${escaparHtml(prog.nombre)}">${escaparHtml(prog.nombre)}</span>
        <span class="semaforo-conteo">${r.primeras} de ${umbral}</span>
        <span class="semaforo-badge semaforo-badge-${estado}">${etiqueta}</span>
      </div>`;
  }).join('');
}

// ─── Cobertura por institución ───────────────────────────────

function renderCobertura(lista) {
  const conteo = {};
  INSTITUCIONES.forEach((i) => { conteo[i] = 0; });
  lista.forEach((r) => { if (conteo[r.institucion] != null) conteo[r.institucion]++; });

  const entradas = INSTITUCIONES
    .map((i) => ({ clave: i, etiqueta: i, total: conteo[i] }))
    .sort((a, b) => b.total - a.total);

  renderBarrasSimple('graficoInstituciones', entradas, { color: 'var(--lima-600)' });
}

// ─── Matriz programa × institución ───────────────────────────

function renderMatriz(lista) {
  const conteo = {}; // conteo[programaId][institucion] = n
  PROGRAMAS.forEach((p) => { conteo[p.id] = {}; INSTITUCIONES.forEach((i) => { conteo[p.id][i] = 0; }); });

  lista.forEach((r) => {
    [r.opcion1, r.opcion2, r.opcion3].forEach((id) => {
      if (id && conteo[id] && conteo[id][r.institucion] != null) conteo[id][r.institucion]++;
    });
  });

  let max = 1;
  Object.values(conteo).forEach((porInst) => Object.values(porInst).forEach((n) => { if (n > max) max = n; }));

  const tabla = document.getElementById('tablaMatriz');
  const encabezado = `<thead><tr><th class="matriz-col-programa">Programa</th>${INSTITUCIONES.map((i) => `<th title="${escaparHtml(i)}">${escaparHtml(i.length > 10 ? i.slice(0, 9) + '…' : i)}</th>`).join('')}</tr></thead>`;
  const filas = PROGRAMAS.map((p) => {
    const celdas = INSTITUCIONES.map((i) => {
      const n = conteo[p.id][i];
      const intensidad = n === 0 ? 0 : 0.15 + (n / max) * 0.75;
      return `<td style="${n ? `background:rgba(18,144,127,${intensidad.toFixed(2)});` : ''}">${n || ''}</td>`;
    }).join('');
    return `<tr><td class="matriz-col-programa" title="${escaparHtml(p.nombre)}">${escaparHtml(p.nombre)}</td>${celdas}</tr>`;
  }).join('');

  tabla.innerHTML = encabezado + `<tbody>${filas}</tbody>`;
}

// ─── Tabla de respuestas ─────────────────────────────────────

function obtenerFiltrados() {
  const texto = document.getElementById('filtroTexto').value.trim().toLowerCase();
  const institucion = document.getElementById('filtroInstitucion').value;

  let lista = respuestas.filter((r) => {
    if (institucion && r.institucion !== institucion) return false;
    if (texto && !(r.estudiante || '').toLowerCase().includes(texto)) return false;
    return true;
  });

  lista.sort((a, b) => {
    const va = a[orden.campo], vb = b[orden.campo];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va || '').localeCompare(String(vb || ''), 'es');
    return orden.dir === 'asc' ? cmp : -cmp;
  });

  return lista;
}

function nombreOpcion(id) {
  if (!id) return '—';
  const prog = programaPorId(id);
  return prog ? prog.nombre : id;
}

function renderTabla() {
  const filtrados = obtenerFiltrados();
  document.getElementById('notaTabla').textContent = `${filtrados.length} respuesta${filtrados.length === 1 ? '' : 's'}`;

  const tbody = document.getElementById('tablaRespuestasBody');
  const vacia = document.getElementById('tablaVacia');

  if (!filtrados.length) {
    tbody.innerHTML = '';
    vacia.classList.remove('oculto');
    return;
  }
  vacia.classList.add('oculto');

  tbody.innerHTML = filtrados.map((r) => `
    <tr>
      <td>${escaparHtml(r.estudiante)}</td>
      <td>${escaparHtml(r.institucion)}</td>
      <td>${escaparHtml(nombreOpcion(r.opcion1))}</td>
      <td>${escaparHtml(nombreOpcion(r.opcion2))}</td>
      <td>${escaparHtml(nombreOpcion(r.opcion3))}</td>
      <td>${escaparHtml(formatearFecha(r.fecha))}</td>
    </tr>`).join('');
}

// ─── Exportar CSV ────────────────────────────────────────────

function descargarCsv() {
  const filtrados = obtenerFiltrados();
  const encabezados = ['Estudiante', 'Institución', '1ra opción', '2da opción', '3ra opción', 'Fecha'];
  const csvEscapar = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;

  const lineas = [encabezados.map(csvEscapar).join(',')];
  filtrados.forEach((r) => {
    lineas.push([
      r.estudiante, r.institucion,
      nombreOpcion(r.opcion1), nombreOpcion(r.opcion2), nombreOpcion(r.opcion3),
      formatearFecha(r.fecha),
    ].map(csvEscapar).join(','));
  });

  // BOM al inicio para que Excel detecte UTF-8 y no dañe las tildes/ñ.
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interes-tecnicos-manizales-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ================================================
// CATÁLOGO — programas técnicos e instituciones educativas
// ================================================
// Transcrito a mano desde "Programas que se pueden ofertar en el
// departamento de Caldas y Manizales (1).xlsx" (hoja única, filas 6-28).
// Solo quedan los programas ofertables en Manizales: columna E dice
// "Manizales", "Manizales y área metropolitana" o "Cualquier municipio",
// más los 4 programas de la Universidad de Caldas (que según el equipo
// también se pueden ofertar en Manizales aunque el Excel no lo liste ahí).
// La columna "Universidad" del Excel se omite a propósito: el formulario
// muestra el programa técnico, nunca quién lo dicta.
//
// Cada `perfil` es el texto crudo del Excel (limpio de saltos de línea y
// typos), con las frases separadas por ";" — js/formulario.js las separa en
// viñetas al vuelo con formatearPerfil(). Los dos programas que llegaron sin
// perfil profesional en el Excel quedan con `perfil: null`.
//
// `municipios` se conserva por si el catálogo se reutiliza en otro
// municipio, pero el formulario actual no lo muestra: a un estudiante de
// Manizales no le aporta ver la lista de los demás municipios.

const AREAS = [
  { id: 'agro', nombre: 'Agro y Producción', icono: 'hoja' },
  { id: 'ambiente', nombre: 'Ambiente y Seguridad', icono: 'escudo' },
  { id: 'tecnologia', nombre: 'Tecnología y Digital', icono: 'chip' },
  { id: 'industria', nombre: 'Industria y Manufactura', icono: 'engranaje' },
  { id: 'administracion', nombre: 'Administración y Negocios', icono: 'maletin' },
  { id: 'alimentos-turismo', nombre: 'Alimentos y Turismo', icono: 'plato' },
];

const PROGRAMAS = [
  {
    id: 'proyectos-agropecuarios',
    nombre: 'Técnico Profesional en Formulación e Implementación de Proyectos Agropecuarios',
    area: 'agro',
    horas: 8,
    perfil: 'Capacitado para participar en procesos de formulación e implementación de proyectos agropecuarios; desarrollar competencias prácticas vinculadas con el saber hacer; utilizar herramientas relacionadas con la gestión de proyectos; reconocer el emprendimiento como campo de actuación; valorar y aprovechar los recursos y potencialidades locales; actuar en función de las necesidades y oportunidades de los territorios rurales.',
    municipios: 'Aguadas, La Dorada, Anserma, Chinchiná, La Merced, Manzanares, Neira, Norcasia, Pácora, Palestina, Riosucio, Salamina, Samaná, San José y Victoria (Caldas)',
  },
  {
    id: 'produccion-agricola',
    nombre: 'Técnico Profesional en Producción Agrícola',
    area: 'agro',
    horas: 8,
    perfil: 'Capacitado para aplicar procedimientos de calidad en los procesos agrícolas; implementar procesos de trazabilidad; contribuir a la prevención de riesgos laborales y ambientales; utilizar herramientas administrativas para mejorar la eficiencia productiva; ejecutar procesos necesarios para el desarrollo de una producción agrícola sostenible; registrar, organizar y procesar información relacionada con la producción; elaborar cuadros resumen y apoyar la gestión de información productiva.',
    municipios: 'Aguadas, Aránzazu, Belalcázar, Chinchiná, Filadelfia, La Dorada, La Merced, Manzanares, Samaná, Riosucio, Salamina, Anserma, Risaralda (Caldas)',
  },
  {
    id: 'produccion-cafetera',
    nombre: 'Técnico Profesional en Producción Cafetera',
    area: 'agro',
    horas: 8,
    perfil: 'Capacitado y especializado en el sector cafetero; formación vinculada con las realidades productivas del territorio; desarrollo de competencias para el desempeño laboral; articulación en ciclos propedéuticos; continuidad hacia la Tecnología en Gestión de Empresa Cafetera; relación explícita con la permanencia de los jóvenes en sus territorios rurales.',
    municipios: 'Aguadas, Pácora, Salamina, Aránzazu, Filadelfia, Neira, Villamaría, Palestina, Chinchiná, Risaralda, Anserma, Belalcázar, Viterbo, San José, Supía, Riosucio, Marmato, La Merced, Manzanares, Marquetalia, Pensilvania, Samaná, Victoria y Marulanda (Caldas)',
  },
  {
    id: 'gestion-comercial-agropecuario',
    nombre: 'Técnico Profesional en Gestión Comercial del Sector Agropecuario',
    area: 'agro',
    horas: 8,
    perfil: 'Capacidad de contribuir a la identificación y emprendimiento de nuevas iniciativas productivas; aprovechar oportunidades del entorno para desarrollar nuevos negocios agropecuarios; manejar e interpretar operaciones básicas productivas, comerciales y financieras de una empresa agropecuaria; apoyar la integración entre producción y ventas; aplicar estrategias de distribución según las condiciones del mercado y las características del producto; contribuir a la determinación de precios competitivos; participar en el manejo de costos de mercadeo; aportar al establecimiento de relaciones comerciales y de negociación eficientes.',
    municipios: 'Cualquier municipio',
  },
  {
    id: 'saneamiento-ambiental',
    nombre: 'Técnico Profesional en Saneamiento Ambiental',
    area: 'ambiente',
    horas: 8,
    perfil: 'Capacitado para realizar labores de saneamiento y conservación ambiental; responder técnicamente a necesidades ambientales de los territorios; apoyar actividades de inspección, vigilancia y control; intervenir en la identificación y control de factores de riesgo ambiental; apoyar procesos relacionados con la calidad del agua; contribuir al control de condiciones higiénicas y sanitarias de alimentos y bebidas; participar en procesos de manejo y control de desechos; apoyar la vigilancia y control de riesgos de carácter ocupacional; trabajar desde competencias cognoscitivas, procedimentales y actitudinales; desarrollar capacidades de cooperación, solidaridad y trabajo en equipo.',
    municipios: 'La Dorada, Aguadas, Aránzazu, Belalcázar, Chinchiná, Filadelfia, La Merced, Manzanares, Samaná, Riosucio, Salamina, Anserma, Risaralda (Caldas)',
  },
  {
    id: 'manejo-ambiental-sostenibilidad',
    nombre: 'Técnico Profesional en Manejo Ambiental y Sostenibilidad',
    area: 'ambiente',
    horas: 8,
    perfil: null,
    municipios: 'Manizales, Aguadas, Anserma, Chinchiná, La Merced, Manzanares, Palestina, Pensilvania, Marmato y Samaná (Caldas) y en Jardín y Jericó (Antioquia)',
  },
  {
    id: 'seguridad-laboral',
    nombre: 'Técnico Profesional en Seguridad Laboral',
    area: 'ambiente',
    horas: 8,
    perfil: null,
    municipios: 'Manizales, Marmato, Riosucio, Chinchiná, Anserma, Aguadas, Manzanares y Pensilvania',
  },
  {
    id: 'internet-de-las-cosas',
    nombre: 'Técnico Profesional en Internet de las Cosas',
    area: 'tecnologia',
    horas: 8,
    perfil: 'Capacitado para seleccionar sensores y dispositivos para proyectos IoT; instalar y poner en funcionamiento sistemas interconectados; programar dispositivos y soluciones tecnológicas; establecer y gestionar la conectividad entre dispositivos; realizar mantenimiento técnico; apoyar la operación de sistemas basados en electrónica y telecomunicaciones; gestionar información generada por sistemas IoT; contribuir a la optimización de procesos empresariales; desarrollar soluciones frente a problemas del entorno con orientación hacia el beneficio social.',
    municipios: 'Manizales y área metropolitana (Villamaría, Palestina, Neira, Chinchiná)',
  },
  {
    id: 'programacion-computadores',
    nombre: 'Técnico Profesional en Programación de Computadores',
    area: 'tecnologia',
    horas: 8,
    perfil: 'Capacitado para el desarrollo de soluciones mediante programación; aplicación de fundamentos de programación orientada a objetos; creación de aplicaciones y herramientas digitales; desarrollo de páginas y servicios web; análisis y solución de problemas mediante herramientas computacionales; participación en proyectos de desarrollo de software; adaptación a necesidades tecnológicas de organizaciones y usuarios.',
    municipios: 'Manizales',
  },
  {
    id: 'comercio-electronico',
    nombre: 'Técnica Profesional en Configuración de Servicios para Comercio Electrónico',
    area: 'tecnologia',
    horas: 8,
    perfil: 'Capacidad de configurar servicios digitales utilizados por una organización, siguiendo especificaciones técnicas y normas de seguridad; dar soporte a la operación y mantenimiento de bases de datos de acuerdo con políticas institucionales; ejecutar procedimientos para poner en marcha estrategias digitales coherentes con la estrategia comercial de la empresa, incluyendo posicionamiento de marca y ventas en línea.',
    municipios: 'Cualquier municipio',
  },
  {
    id: 'mantenimiento-mecanico',
    nombre: 'Técnico Profesional en Mantenimiento Mecánico',
    area: 'industria',
    horas: 8,
    perfil: 'Capacidades para apoyar procesos de mantenimiento de equipos y sistemas mecánicos; participar en actividades de mantenimiento preventivo y correctivo; interpretar elementos y especificaciones técnicas; apoyar procesos de diseño mecánico; participar en el análisis y solución de problemas mecánicos; trabajar con procesos y tecnologías propias de entornos industriales; contribuir al funcionamiento, disponibilidad y mejoramiento de equipos y procesos.',
    municipios: 'Manizales',
  },
  {
    id: 'control-industrial',
    nombre: 'Técnico Profesional en Control Industrial',
    area: 'industria',
    horas: 8,
    perfil: 'Capacidades para apoyar la automatización de procesos industriales; operar y programar sistemas de control; trabajar con PLC y otros dispositivos de automatización; participar en el montaje y funcionamiento de sistemas industriales; identificar problemas en procesos automatizados; contribuir a la implementación de soluciones tecnológicas; aplicar conocimientos de electrónica y programación al control de procesos.',
    municipios: 'Manizales',
  },
  {
    id: 'procesos-manufactura',
    nombre: 'Técnico Profesional en Procesos de Manufactura',
    area: 'industria',
    horas: 8,
    perfil: 'Capacitado para interpretar planos técnicos; operar maquinaria convencional; operar y programar máquinas de control numérico computarizado (CNC); configurar procesos de producción; aplicar procesos de manufactura asistida por computador (CAM); controlar la calidad de los productos; aplicar criterios de mejora continua; contribuir a la optimización de procesos productivos; trabajar colaborativamente en entornos industriales; adaptarse a nuevas tecnologías aplicadas a la productividad.',
    municipios: 'Manizales',
  },
  {
    id: 'procesos-contables-financieros',
    nombre: 'Técnico Profesional en Procesos Contables y Financieros',
    area: 'administracion',
    horas: 8,
    perfil: 'Capacidades relacionadas con apoyo a los procesos contables; apoyo a la gestión financiera; organización y manejo de información contable y financiera; desarrollo de actividades con precisión y responsabilidad; contribución al funcionamiento administrativo de organizaciones.',
    municipios: 'Cualquier municipio',
  },
  {
    id: 'atencion-al-cliente',
    nombre: 'Técnica Profesional en Atención al Cliente',
    area: 'administracion',
    horas: 8,
    perfil: 'Capacidad de gestionar la relación con el cliente; apoyar procesos comerciales; analizar información; resolver situaciones relacionadas con el servicio; comunicarse de manera efectiva; contribuir al fortalecimiento de la experiencia del cliente y de la competitividad organizacional.',
    municipios: 'Cualquier municipio',
  },
  {
    id: 'archivistica',
    nombre: 'Técnica Profesional en Archivística',
    area: 'administracion',
    horas: 8,
    perfil: 'Capacidad de apoyar procesos de organización documental; clasificación de documentos; conservación; digitalización; administración de documentos físicos y electrónicos; implementación de procesos de gestión documental; manejo de archivos; descripción documental; transferencia documental; preservación de la información.',
    municipios: 'Cualquier municipio',
  },
  {
    id: 'analisis-de-alimentos',
    nombre: 'Técnico Profesional en Análisis de Alimentos',
    area: 'alimentos-turismo',
    horas: 8,
    perfil: 'Capacitado para realizar actividades operativas e instrumentales en laboratorios; analizar materias primas y alimentos; verificar el cumplimiento de regulaciones y requisitos aplicables; apoyar procesos de inocuidad alimentaria; participar en actividades de control y aseguramiento de la calidad; analizar muestras mediante procedimientos de laboratorio; acompañar procesos administrativos del sector agroalimentario; actuar con responsabilidad y compromiso ético.',
    municipios: 'Chinchiná, Aránzazu, Manzanares, Supía, Anserma, Pácora y Manizales área metropolitana (Villamaría, Palestina, Neira, Chinchiná)',
  },
  {
    id: 'operacion-empresas-turisticas',
    nombre: 'Técnico Profesional en Operación de Empresas Turísticas',
    area: 'alimentos-turismo',
    horas: 8,
    perfil: 'Capacidades para desarrollar procesos operativos que dinamicen la actividad económica en empresas prestadoras de servicios turísticos; operar servicios turísticos a partir del potencial de los destinos, sus manifestaciones culturales, recursos naturales y patrimonio; formular proyectos que promuevan el desarrollo turístico y la conservación del ambiente, los bienes y los valores culturales.',
    municipios: 'Aguadas, Anserma, Belalcázar, Chinchiná, Filadelfia, La Merced, Manizales, Neira, Pácora, Palestina, Riosucio, Salamina, San José, Risaralda, Supía, Villamaría, Viterbo y microcredenciales en el resto del departamento',
  },
];

// Instituciones educativas rurales de Manizales, orden alfabético.
const INSTITUCIONES = [
  'Giovanni Montini',
  'Granada',
  'José Antonio Galán',
  'La Cabaña',
  'La Linda',
  'La Trinidad',
  'La Violeta',
  'Maltería',
  'María Goretti',
  'Miguel Antonio Caro',
  'Rafael Pombo',
  'San Peregrino',
  'Seráfico San Antonio de Padua',
];

function programaPorId(id) { return PROGRAMAS.find((p) => p.id === id); }
function areaPorId(id) { return AREAS.find((a) => a.id === id); }
function areaDe(idPrograma) {
  const p = programaPorId(idPrograma);
  return p ? areaPorId(p.area) : null;
}

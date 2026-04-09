export const getCurrentYear = () => new Date().getFullYear();

// Retorna los valores iniciales del formulario segun el tipo de solicitud.
// Esto nos permite enviar a nomina datos consistentes desde el primer registro.
export const getInitialForm = (requestType = 'VACACIONES') => {
  const sharedFields = {
    fecha_inicio: '',
    fecha_fin: '',
    sub_tipo: '',
    comentario_empleado: '',
    documento_soporte: '',
    es_remunerado: 'SI',
    porcentaje_pago: '100',
    origen_novedad: '',
    horas_solicitadas: ''
  };

  if (requestType === 'PERMISO') {
    return {
      ...sharedFields,
      es_remunerado: 'SI',
      porcentaje_pago: '100'
    };
  }

  if (requestType === 'INCAPACIDAD') {
    return {
      ...sharedFields,
      origen_novedad: 'COMUN',
      porcentaje_pago: '66.67'
    };
  }

  if (requestType === 'LICENCIA') {
    return {
      ...sharedFields,
      es_remunerado: 'SI',
      porcentaje_pago: '100'
    };
  }

  return {
    ...sharedFields,
    es_remunerado: 'SI',
    porcentaje_pago: '100'
  };
};

export const REQUEST_TYPE_OPTIONS = {
  VACACIONES: {
    key: 'VACACIONES',
    label: 'Vacaciones',
    endpoint: 'vacaciones',
    helperText: 'Registra el rango de dias que deseas tomar y agrega una observacion breve si aplica.',
    commentLabel: 'Comentario',
    commentPlaceholder: 'Agrega un contexto breve para la solicitud',
    subtypeLabel: 'Subtipo',
    subtypePlaceholder: 'Ejemplo: Vacaciones disfrutadas',
    subtypeOptions: []
  },
  PERMISO: {
    key: 'PERMISO',
    label: 'Permisos',
    endpoint: 'permisos',
    helperText: 'Usa permisos para solicitudes cortas, asuntos personales o diligencias.',
    commentLabel: 'Motivo del permiso',
    commentPlaceholder: 'Describe el motivo del permiso y cualquier detalle relevante',
    subtypeLabel: 'Clase de permiso',
    subtypePlaceholder: 'Selecciona o escribe la clase de permiso',
    subtypeOptions: [
      'Permiso personal',
      'Permiso medico',
      'Permiso academico',
      'Permiso remunerado',
      'Permiso no remunerado'
    ],
    payrollConfig: {
      showRemunerationToggle: true,
      showHoursField: true,
      showOriginField: false,
      remunerationHelpText: 'Indica si el permiso debe pagarse o descontarse en nomina.',
      percentageHelpText: 'Usa 100 para permiso pago completo o 0 para permiso no remunerado.'
    }
  },
  INCAPACIDAD: {
    key: 'INCAPACIDAD',
    label: 'Incapacidades',
    endpoint: 'incapacidades',
    helperText: 'Registra incapacidades medicas indicando el origen o tipo para facilitar su revision.',
    commentLabel: 'Detalle de la incapacidad',
    commentPlaceholder: 'Describe el origen, diagnostico general o informacion importante',
    subtypeLabel: 'Origen o clase',
    subtypePlaceholder: 'Selecciona o escribe el origen de la incapacidad',
    subtypeOptions: [
      'Origen comun',
      'Origen laboral',
      'Accidente',
      'Enfermedad general'
    ],
    payrollConfig: {
      showRemunerationToggle: false,
      showHoursField: false,
      showOriginField: true,
      remunerationHelpText: 'La incapacidad afecta nomina segun el origen y el porcentaje reconocido.',
      percentageHelpText: 'Por defecto se usa 66.67 para origen comun y 100 para origen laboral.'
    }
  },
  LICENCIA: {
    key: 'LICENCIA',
    label: 'Licencias',
    endpoint: 'licencias',
    helperText: 'Usa licencias para maternidad, paternidad, luto, calamidad u otras novedades similares.',
    commentLabel: 'Detalle de la licencia',
    commentPlaceholder: 'Explica el contexto de la licencia y cualquier observacion importante',
    subtypeLabel: 'Tipo de licencia',
    subtypePlaceholder: 'Selecciona o escribe el tipo de licencia',
    subtypeOptions: [
      'Maternidad',
      'Paternidad',
      'Luto',
      'Calamidad domestica',
      'Estudio'
    ],
    payrollConfig: {
      showRemunerationToggle: true,
      showHoursField: false,
      showOriginField: false,
      remunerationHelpText: 'Define si la licencia se paga o si debe generar descuento en nomina.',
      percentageHelpText: 'Usa 100 para licencias pagas y 0 para licencias no remuneradas.'
    }
  }
};

export const YES_NO_OPTIONS = [
  { value: 'SI', label: 'Si' },
  { value: 'NO', label: 'No' }
];

export const ORIGIN_OPTIONS = [
  { value: 'COMUN', label: 'Comun' },
  { value: 'LABORAL', label: 'Laboral' }
];

export const getDefaultPayrollValuesByType = (requestType, changes = {}) => {
  if (requestType === 'INCAPACIDAD') {
    const origin = changes.origen_novedad || 'COMUN';

    return {
      es_remunerado: 'SI',
      origen_novedad: origin,
      porcentaje_pago: origin === 'LABORAL' ? '100' : '66.67'
    };
  }

  if (requestType === 'PERMISO' || requestType === 'LICENCIA') {
    const remunerated = changes.es_remunerado || 'SI';

    return {
      es_remunerado: remunerated,
      porcentaje_pago: remunerated === 'SI' ? '100' : '0'
    };
  }

  return {
    es_remunerado: 'SI',
    porcentaje_pago: '100',
    origen_novedad: ''
  };
};

import api from '../../../services/api';

export const getToday = () => new Date().toISOString().split('T')[0];

export const toBase64 = (file) => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64Content = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })
);

export const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
};

export const getSupportFileUrl = (supportPath) => {
  if (!supportPath) return '';
  if (supportPath.startsWith('http://') || supportPath.startsWith('https://')) {
    return supportPath;
  }

  const apiBaseUrl = api.defaults.baseURL || '';
  const origin = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${origin}${supportPath}`;
};

export const getStatusClass = (status) => {
  switch (status) {
    case 'APROBADA':
      return 'approved';
    case 'RECHAZADA':
      return 'rejected';
    case 'CANCELADA':
      return 'cancelled';
    default:
      return 'pending';
  }
};

export const JORNADA_LUNES_VIERNES = 'LUNES_VIERNES';
export const JORNADA_LUNES_SABADO = 'LUNES_SABADO';

export const esDiaHabil = (fecha, jornada = JORNADA_LUNES_VIERNES) => {
  const diaSemana = fecha.getDay();
  if (diaSemana === 0) return false;
  if (jornada === JORNADA_LUNES_VIERNES && diaSemana === 6) return false;
  return true;
};

export const contarDiasHabilesEnRango = (fechaInicio, fechaFin, jornada = JORNADA_LUNES_VIERNES) => {
  if (!fechaInicio || !fechaFin) return { calendario: 0, habiles: 0, noHabiles: 0 };
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  if (end < start) return { calendario: 0, habiles: 0, noHabiles: 0 };
  let habiles = 0;
  let current = new Date(start);
  while (current <= end) {
    if (esDiaHabil(current, jornada)) {
      habiles++;
    }
    current.setDate(current.getDate() + 1);
  }
  const diffTime = Math.abs(end - start);
  const calendario = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return { calendario, habiles, noHabiles: calendario - habiles };
};

export const calcularFechaRegreso = (fechaFin, diasHabiles = 1, jornada = JORNADA_LUNES_VIERNES) => {
  if (!fechaFin) return null;
  const fecha = new Date(fechaFin);
  let contados = 0;
  while (contados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    if (esDiaHabil(fecha, jornada)) {
      contados++;
    }
  }
  return fecha;
};

export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
};

export const fetchGlobalJornada = async () => {
  try {
    const res = await api.get('/liquidacion/config/jornada-laboral');
    return res.data.data.jornada_laboral || JORNADA_LUNES_VIERNES;
  } catch {
    return JORNADA_LUNES_VIERNES;
  }
};

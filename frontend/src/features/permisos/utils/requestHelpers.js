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

export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  // Diferencia en milisegundos
  const diffTime = Math.abs(end - start);
  // Diferencia en dias (+1 para incluir el dia inicial)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
};

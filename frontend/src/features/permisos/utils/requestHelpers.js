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

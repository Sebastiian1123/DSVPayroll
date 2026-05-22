import axios from 'axios';
// CREAR INSTANCIA DE AXIOS

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000, // 10 segundos de timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// INTERCEPTOR DE REQUEST

// Se ejecuta ANTES de cada petición
api.interceptors.request.use(
    (config) => {
        // Obtener el token del localStorage
        const token = localStorage.getItem('token');

        // Si hay token, agregarlo al header Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// INTERCEPTOR DE RESPONSE

// Se ejecuta DESPUÉS de cada respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status } = error.response;
            switch (status) {
                case 401:
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    console.error('No autorizado');
                    break;
                case 500:
                    console.error('Error interno del servidor');
                    break;
                default:
                    console.error('Error:', status);
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('Timeout del servidor');
        } else if (error.request) {
            console.error('Servidor no disponible');
        } else {
            console.error(error.message);
        }
        return Promise.reject(error);
    }
);

// ============================================
// EXPORTAR INSTANCIA
// ============================================

export default api;

// ============================================
// NOTAS DE USO
// ============================================

/*
CÓMO USAR ESTE ARCHIVO:

1. Importar en otros archivos:
import api from './services/api';

2. Hacer peticiones:
 
// GET
const response = await api.get('/employees');
 
// POST
const response = await api.post('/auth/login', { username, password });
 
// PUT
const response = await api.put('/employees/5', { nombres: 'Juan' });
 
// DELETE
const response = await api.delete('/employees/5');

3. Los interceptors automáticamente:
✅ Agregan el token a cada petición
✅ Manejan errores de autenticación
✅ Redirigen al login si el token expira
✅ Muestran logs en consola

VENTAJAS:
- No necesitas agregar el token manualmente en cada petición
- Manejo centralizado de errores
- Redirección automática si el token expira
- Logs para debugging
*/
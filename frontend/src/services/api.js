// ============================================
// CONFIGURACIÓN DE AXIOS
// Archivo: src/services/api.js
// ============================================

import axios from 'axios';

// ============================================
// CREAR INSTANCIA DE AXIOS
// ============================================

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000, // 10 segundos de timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// INTERCEPTOR DE REQUEST
// ============================================

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

// ============================================
// INTERCEPTOR DE RESPONSE
// ============================================

// Se ejecuta DESPUÉS de cada respuesta
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Manejar diferentes tipos de errores
        if (error.response) {
            // El servidor respondió con un código de error
            const { status, data } = error.response;
            
            
            // Si el token expiró o es inválido (401)
            if (status === 401) {
                // Limpiar el localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Redirigir al login
                window.location.href = '/login';
            }
            
            // Si no tiene permisos (403)
            if (status === 403) {
            }
            
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
        } else {
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
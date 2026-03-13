// ============================================
// SERVICIO DE AUTENTICACIÓN
// Archivo: src/services/authService.js
// ============================================

import api from './api';

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

const authService = {
    
    // ========================================
    // 1. LOGIN
    // ========================================
    login: async (username, password) => {
        try {
            const response = await api.post('/auth/login', {
                username,
                password
            });
            
            const { token, user } = response.data;
            
            // Guardar token y usuario en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al iniciar sesión' };
        }
    },
    
    // ========================================
    // 2. LOGOUT
    // ========================================
    logout: () => {
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir al login
        window.location.href = '/login';
    },
    
    // ========================================
    // 3. REGISTRAR USUARIO
    // ========================================
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al registrar usuario' };
        }
    },
    
    // ========================================
    // 4. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
    // ========================================
    requestPasswordReset: async (email) => {
        try {
            const response = await api.post('/auth/request-reset', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al solicitar recuperación' };
        }
    },
    
    // ========================================
    // 5. RESTABLECER CONTRASEÑA
    // ========================================
    resetPassword: async (email, token, newPassword) => {
        try {
            const response = await api.post('/auth/reset-password', {
                email,
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al restablecer contraseña' };
        }
    },
    
    // ========================================
    // 6. OBTENER PERFIL
    // ========================================
    getProfile: async () => {
        try {
            const response = await api.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener perfil' };
        }
    },
    
    // ========================================
    // 7. OBTENER USUARIO ACTUAL (desde localStorage)
    // ========================================
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // ========================================
    // 8. OBTENER TOKEN (desde localStorage)
    // ========================================
    getToken: () => {
        return localStorage.getItem('token');
    },
    
    // ========================================
    // 9. VERIFICAR SI ESTÁ AUTENTICADO
    // ========================================
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        return !!token; // Retorna true si hay token, false si no
    },
    
    // ========================================
    // 10. VERIFICAR ROL DEL USUARIO
    // ========================================
    hasRole: (requiredRole) => {
        const user = authService.getCurrentUser();
        if (!user) return false;
        
        return user.rol === requiredRole;
    },
    
    // ========================================
    // 11. VERIFICAR SI ES ADMIN O RRHH
    // ========================================
    isAdminOrRRHH: () => {
        const user = authService.getCurrentUser();
        if (!user) return false;
        
        return user.rol === 'ADMINISTRADOR' || user.rol === 'RRHH';
    },
    
    // ========================================
    // 12. VERIFICAR SI ES ADMIN
    // ========================================
    isAdmin: () => {
        const user = authService.getCurrentUser();
        if (!user) return false;
        
        return user.rol === 'ADMINISTRADOR';
    }
};

// ============================================
// EXPORTAR SERVICIO
// ============================================

export default authService;

// ============================================
// NOTAS DE USO
// ============================================

/*
CÓMO USAR ESTE SERVICIO:

1. Importar:
   import authService from '../services/authService';

2. Login:
   try {
     const data = await authService.login('admin', 'Admin123!');
     console.log('Usuario:', data.user);
     console.log('Token:', data.token);
   } catch (error) {
     console.error(error.message);
   }

3. Logout:
   authService.logout();

4. Verificar autenticación:
   if (authService.isAuthenticated()) {
     console.log('Usuario autenticado');
   }

5. Obtener usuario actual:
   const user = authService.getCurrentUser();
   console.log('Usuario:', user.username);
   console.log('Rol:', user.rol);

6. Verificar rol:
   if (authService.isAdminOrRRHH()) {
     console.log('Puede registrar usuarios');
   }

ALMACENAMIENTO:
- Token: localStorage.getItem('token')
- Usuario: localStorage.getItem('user')

SEGURIDAD:
✅ Token se agrega automáticamente a cada petición (gracias a api.js)
✅ Si el token expira, se redirige al login automáticamente
✅ Validación de roles en el cliente
✅ Limpieza de datos al hacer logout
*/
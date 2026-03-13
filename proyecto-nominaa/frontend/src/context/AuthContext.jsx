// ============================================
// CONTEXTO DE AUTENTICACIÓN
// Archivo: src/context/AuthContext.jsx
// ============================================

import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

// ============================================
// CREAR CONTEXTO
// ============================================

const AuthContext = createContext();

// ============================================
// PROVEEDOR DEL CONTEXTO
// ============================================

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ========================================
    // CARGAR USUARIO AL INICIAR
    // ========================================
    useEffect(() => {
        const loadUser = () => {
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        };

        loadUser();
    }, []);

    // ========================================
    // FUNCIÓN DE LOGIN
    // ========================================
    const login = async (username, password) => {
        try {
            const data = await authService.login(username, password);
            setUser(data.user);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // ========================================
    // FUNCIÓN DE LOGOUT
    // ========================================
    const logout = () => {
        authService.logout();
        setUser(null);
    };

    // ========================================
    // VERIFICAR SI ESTÁ AUTENTICADO
    // ========================================
    const isAuthenticated = () => {
        return !!user;
    };

    // ========================================
    // VERIFICAR ROLES
    // ========================================
    const hasRole = (role) => {
        return user?.rol === role;
    };

    const isAdminOrRRHH = () => {
        return user?.rol === 'ADMINISTRADOR' || user?.rol === 'RRHH';
    };

    const isAdmin = () => {
        return user?.rol === 'ADMINISTRADOR';
    };

    // ========================================
    // VALOR DEL CONTEXTO
    // ========================================
    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole,
        isAdminOrRRHH,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================
// HOOK PERSONALIZADO PARA USAR EL CONTEXTO
// ============================================

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    
    return context;
};

// ============================================
// EXPORTAR CONTEXTO (para casos especiales)
// ============================================

export default AuthContext;

// ============================================
// NOTAS DE USO
// ============================================

/*
¿QUÉ ES UN CONTEXTO?
- Es una forma de compartir datos entre componentes sin pasar props
- Como una "variable global" accesible desde cualquier componente

CÓMO USAR:

1. ENVOLVER LA APP CON EL PROVIDER (en main.jsx):
   import { AuthProvider } from './context/AuthContext';
   
   <AuthProvider>
     <App />
   </AuthProvider>

2. USAR EN CUALQUIER COMPONENTE:
   import { useAuth } from '../context/AuthContext';
   
   function MiComponente() {
     const { user, login, logout, isAuthenticated } = useAuth();
     
     return (
       <div>
         {isAuthenticated() ? (
           <>
             <p>Hola, {user.username}</p>
             <button onClick={logout}>Cerrar Sesión</button>
           </>
         ) : (
           <p>No autenticado</p>
         )}
       </div>
     );
   }

VENTAJAS:
✅ Estado global de autenticación
✅ Accesible desde cualquier componente
✅ No necesitas pasar props por múltiples niveles
✅ Reactivo: cuando cambia el user, todos los componentes se actualizan

DATOS DISPONIBLES:
- user: Objeto con información del usuario
- loading: true mientras carga el usuario inicial
- login(username, password): Función para iniciar sesión
- logout(): Función para cerrar sesión
- isAuthenticated(): Verifica si está autenticado
- hasRole(role): Verifica un rol específico
- isAdminOrRRHH(): Verifica si es Admin o RRHH
- isAdmin(): Verifica si es Admin
*/
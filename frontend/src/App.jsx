// ============================================
// COMPONENTE PRINCIPAL - APP
// Archivo: src/App.jsx
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Importar páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Users from './pages/Users';
import ForgotPassword from './pages/ForgotPassword';
import { Nomina } from './pages/Nomina';
import { Directory } from './pages/Directory';


function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ========================================
          RUTAS PÚBLICAS
          ========================================== */}
      
      {/* Ruta raíz - Redirige según autenticación */}
      <Route 
        path="/" 
        element={
          isAuthenticated() ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Recuperar contraseña */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ========================================
          RUTAS PRIVADAS
          ========================================== */}

      {/* Dashboard - Todos los usuarios autenticados */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      {/* Vista principal nomina y gestion de la misma de empleados */}
       <Route
        path="/nomina"
        element={
          <PrivateRoute>
            <Nomina />
          </PrivateRoute>
        }
      />
        {/* Vista directorio de empleados*/}
       <Route
        path="/directory"
        element={
          <PrivateRoute>
            <Directory />
          </PrivateRoute>
        }
      />

      {/* Empleados - Todos los usuarios autenticados */}
      <Route
        path="/employees"
        element={
          <PrivateRoute>
            <Employees />
          </PrivateRoute>
        }
      />

      {/* Usuarios - Solo Admin y RRHH */}
      <Route
        path="/users"
        element={
          <PrivateRoute requiredRole="ADMINISTRADOR">
            <Users />
          </PrivateRoute>
        }
      />

      {/* ========================================
          RUTA 404 - NO ENCONTRADA
          ========================================== */}
      <Route 
        path="*" 
        element={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>404 - Página no encontrada</h1>
            <p>La página que buscas no existe.</p>
            <a href="/">Volver al inicio</a>
          </div>
        } 
      />
    </Routes>
  );
}

export default App;

// ============================================
// NOTAS
// ============================================

/*
ESTRUCTURA DE RUTAS:

PÚBLICAS (sin autenticación):
- / → Redirige a /login o /dashboard según autenticación
- /login → Página de inicio de sesión
- /forgot-password → Recuperación de contraseña

PRIVADAS (requieren autenticación):
- /dashboard → Panel principal (todos)
- /employees → Gestión de empleados (todos)
- /users → Gestión de usuarios (solo Admin y RRHH)

404:
- * → Cualquier ruta no definida muestra error 404

CÓMO FUNCIONA:
1. Usuario accede a una URL
2. <Routes> busca la ruta que coincida
3. Si es privada, <PrivateRoute> verifica autenticación
4. Si no está autenticado, redirige a /login
5. Si está autenticado pero no tiene el rol, muestra error
6. Si todo OK, muestra el componente

NAVEGACIÓN:
- Usa <Link to="/ruta"> en lugar de <a href="/ruta">
- Usa navigate('/ruta') para redirección programática
- El historial del navegador funciona correctamente

PRÓXIMAS PÁGINAS A CREAR:
✅ Login.jsx (ya creado)
⏳ Dashboard.jsx
⏳ Employees.jsx
⏳ Users.jsx
⏳ ForgotPassword.jsx
*/

import { Routes, Route, Navigate, Link } from 'react-router-dom';
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
import PermisosPage from './features/permisos';
import ReportsPage from './features/reports';
import { Parametros } from './pages/Parametros.jsx';
import Prestaciones from './pages/Prestaciones.jsx';
import Liquidacion from './pages/Liquidacion.jsx';
import MiPerfil from './pages/MiPerfil.jsx';


function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>

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

      {/* Usuarios - Solo ADMINISTRADOR */}
      <Route
        path="/users"
        element={
          <PrivateRoute requiredRole="ADMINISTRADOR">
            <Users />
          </PrivateRoute>
        }
      />

      {/* Reportes*/}
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <ReportsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/parametros"
        element={
          <PrivateRoute>
            <Parametros />
          </PrivateRoute>
        }
      />

      <Route
        path="/permisos"
        element={
          <PrivateRoute>
            <PermisosPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/solicitudes-laborales"
        element={
          <PrivateRoute>
            <Navigate to="/permisos" replace />
          </PrivateRoute>
        }
      />

      <Route
        path="/prestaciones"
        element={
          <PrivateRoute>
            <Prestaciones />
          </PrivateRoute>
        }
      />

      <Route
        path="/liquidacion"
        element={
          <PrivateRoute>
            <Liquidacion />
          </PrivateRoute>
        }
      />

      <Route
        path="/mi-perfil"
        element={
          <PrivateRoute>
            <MiPerfil />
          </PrivateRoute>
        }
      />

      
      <Route
        path="*"
        element={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>404 - Página no encontrada</h1>
            <p>La página que buscas no existe.</p>
            <Link to="/">Volver al inicio</Link>
          </div>
        }
      />
    </Routes>
  );
}

export default App;

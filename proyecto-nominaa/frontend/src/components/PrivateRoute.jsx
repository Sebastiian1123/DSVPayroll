// ============================================
// COMPONENTE DE RUTA PRIVADA
// Archivo: src/components/PrivateRoute.jsx
// ============================================

// ============================================
// NOTAS DE USO
// ============================================

/*
¿QUÉ HACE ESTE COMPONENTE?
- Protege rutas para que solo usuarios autenticados puedan acceder
- Opcionalmente, verifica que el usuario tenga un rol específico
- Redirige al login si no está autenticado
- Muestra mensaje de error si no tiene el rol requerido

CÓMO USAR EN App.jsx:

1. RUTA SOLO PARA AUTENTICADOS (cualquier rol):
   <Route 
     path="/dashboard" 
     element={
       <PrivateRoute>
         <Dashboard />
       </PrivateRoute>
     } 
   />

2. RUTA PARA ROL ESPECÍFICO:
   <Route 
     path="/usuarios" 
     element={
       <PrivateRoute requiredRole="ADMINISTRADOR">
         <Users />
       </PrivateRoute>
     } 
   />

3. RUTA PARA MÚLTIPLES ROLES:
   <Route 
     path="/empleados" 
     element={
       <PrivateRoute requiredRole={['ADMINISTRADOR', 'RRHH']}>
         <Employees />
       </PrivateRoute>
     } 
   />

FLUJO:
1. Usuario intenta acceder a una ruta protegida
2. PrivateRoute verifica si está autenticado
3. Si no → Redirige al login
4. Si sí → Verifica el rol (si se requiere)
5. Si no tiene el rol → Muestra mensaje de error
6. Si todo OK → Muestra el componente

VENTAJAS:
✅ Seguridad en el frontend
✅ UX clara (mensajes de error)
✅ Reutilizable
✅ Fácil de mantener
*/

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

//Componente PRIVATEROUTE

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  //mostrar loading mientras verifica autenticacion
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Cargando...</div>
      </div>
    );
  }

  //Si no esta autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  //Si requiere rol especifico, verificar

  if (requiredRole) {
    // Si requiredRole es un array, verificar si el usuario tiene alguno de esos roles
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user.rol)) {
        return (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h2>⛔ Acceso Denegado</h2>
            <p>No tienes permisos para acceder a esta página.</p>
            <p>Tu rol: {user.rol}</p>
            <p>Roles requeridos: {requiredRole.join(", ")}</p>
          </div>
        );
      }
    } else {
      // Si es un solo rol
      if (user.rol !== requiredRole) {
        return (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h2>⛔ Acceso Denegado</h2>
            <p>No tienes permisos para acceder a esta página.</p>
            <p>Tu rol: {user.rol}</p>
            <p>Rol requerido: {requiredRole}</p>
          </div>
        );
      }
    }
  }

  // Si todo está bien, mostrar el componente
  return children;
};
export default PrivateRoute;

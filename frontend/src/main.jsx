// ============================================
// ARCHIVO PRINCIPAL DE REACT
// Archivo: src/main.jsx
// ============================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

// ============================================
// RENDERIZAR LA APLICACIÓN
// ============================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// ============================================
// EXPLICACIÓN
// ============================================

/*
¿QUÉ HACE CADA COSA?

1. ReactDOM.createRoot():
   - Crea la raíz de la aplicación React
   - Se conecta al elemento HTML con id="root"
   
2. <React.StrictMode>:
   - Modo estricto de React
   - Ayuda a encontrar problemas en desarrollo
   - No afecta la producción
   
3. <BrowserRouter>:
   - Habilita el sistema de rutas (navegación)
   - Permite usar <Link> y <Route>
   - Maneja el historial del navegador
   
4. <AuthProvider>:
   - Provee el contexto de autenticación
   - Hace que useAuth() funcione en toda la app
   - Debe envolver todo lo que necesite autenticación
   
5. <App />:
   - Componente principal de la aplicación
   - Contiene todas las rutas y páginas

ORDEN DE LOS WRAPPERS (importante):
<BrowserRouter>           ← Rutas
  <AuthProvider>          ← Autenticación
    <App />               ← Tu aplicación
  </AuthProvider>
</BrowserRouter>

No cambies este orden, funciona así por diseño.
*/
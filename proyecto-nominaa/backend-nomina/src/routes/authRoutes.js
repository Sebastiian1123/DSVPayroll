// ============================================
// RUTAS DE AUTENTICACIÓN
// Archivo: routes/authRoutes.js
// ============================================


// ============================================
// DOCUMENTACIÓN DE ENDPOINTS
// ============================================

/*
╔════════════════════════════════════════════════════════════╗
║                   ENDPOINTS DISPONIBLES                    ║
╚════════════════════════════════════════════════════════════╝

1. LOGIN
   POST /api/auth/login
   Body: {
     "username": "admin",
     "password": "Admin123!"
   }
   Response: {
     "success": true,
     "message": "Login exitoso",
     "token": "eyJhbGc...",
     "user": { ... }
   }

2. REGISTRAR USUARIO (Requiere: Admin o RRHH)
   POST /api/auth/register
   Headers: {
     "Authorization": "Bearer token_aqui"
   }
   Body: {
     "username": "nuevo_usuario",
     "password": "password123",
     "email": "usuario@empresa.com",
     "rol": "EMPLEADO",
     "id_empleado": 1
   }
   Response: {
     "success": true,
     "message": "Usuario registrado exitosamente",
     "user": { ... }
   }

3. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
   POST /api/auth/request-reset
   Body: {
     "email": "usuario@empresa.com"
   }
   Response: {
     "success": true,
     "message": "Si el email existe, recibirás instrucciones...",
     "dev": {
       "token": "123456"  // Solo en desarrollo
     }
   }

4. RESTABLECER CONTRASEÑA
   POST /api/auth/reset-password
   Body: {
     "email": "usuario@empresa.com",
     "token": "123456",
     "newPassword": "nueva_password123"
   }
   Response: {
     "success": true,
     "message": "Contraseña actualizada exitosamente"
   }

5. OBTENER PERFIL (Requiere: Autenticación)
   GET /api/auth/profile
   Headers: {
     "Authorization": "Bearer token_aqui"
   }
   Response: {
     "success": true,
     "user": {
       "id_usuario": 1,
       "username": "admin",
       "email": "admin@empresa.com",
       "nombre_rol": "ADMINISTRADOR",
       "nombres": "Juan",
       "apellidos": "Pérez"
     }
   }

6. TEST
   GET /api/auth/test
   Response: {
     "success": true,
     "message": "Rutas de autenticación funcionando",
     "routes": { ... }
   }

╔════════════════════════════════════════════════════════════╗
║                    CÓDIGOS DE ESTADO                       ║
╚════════════════════════════════════════════════════════════╝

200 - OK (Operación exitosa)
201 - Created (Usuario creado)
400 - Bad Request (Datos inválidos)
401 - Unauthorized (No autenticado)
403 - Forbidden (Sin permisos)
404 - Not Found (No encontrado)
409 - Conflict (Conflicto, ej: usuario ya existe)
500 - Internal Server Error (Error del servidor)

╔════════════════════════════════════════════════════════════╗
║                  FLUJO DE AUTENTICACIÓN                    ║
╚════════════════════════════════════════════════════════════╝

1. Usuario hace login → Recibe token JWT
2. Usuario guarda el token (localStorage/sessionStorage)
3. En cada petición, envía el token en headers:
   Authorization: Bearer <token>
4. El servidor verifica el token con verifyToken middleware
5. Si es válido, procesa la petición
6. Si requiere roles específicos, verifica con verifyRoles
*/

const express = require('express')
const router = express.Router()

//importa controladores
const {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    getProfile
} = require('../controllers/authController.js')

//importar middlewares
const {
    verifyToken,
    verifyAdminORRRHH
} = require('../middleware/authMiddleware.js')


// RUTAS PÚBLICAS (Sin autenticación)
// POST /api/auth/login
// Iniciar sesión
router.post('/login', login);

// POST /api/auth/request-reset
// Solicitar recuperación de contraseña
router.post('/request-reset', requestPasswordReset);

// POST /api/auth/reset-password
// Restablecer contraseña con token
router.post('/reset-password', resetPassword);

// RUTAS PROTEGIDAS (Requieren autenticación)
console.log("verifyToken:", verifyToken);
console.log("verifyAdminORRRHH:", verifyAdminORRRHH);
console.log("register:", register);

// POST /api/auth/register
// Registrar nuevo usuario (Solo Admin y RRHH)
router.post('/register', verifyToken, verifyAdminORRRHH, register);

// GET /api/auth/profile
// Obtener perfil del usuario autenticado
router.get('/profile', verifyToken, getProfile);

// RUTA DE PRUEBA


// GET /api/auth/test
// Verificar que las rutas funcionan
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Rutas de autenticación funcionando correctamente',
        routes: {
            public: [
                'POST /api/auth/login',
                'POST /api/auth/request-reset',
                'POST /api/auth/reset-password'
            ],
            protected: [
                'POST /api/auth/register (Admin/RRHH)',
                'GET /api/auth/profile (Authenticated)'
            ]
        }
    });
});

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;

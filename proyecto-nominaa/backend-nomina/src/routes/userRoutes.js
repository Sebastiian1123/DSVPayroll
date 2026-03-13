// ============================================
// RUTAS DE USUARIOS
// Archivo: routes/userRoutes.js
// ============================================

// ============================================
// DOCUMENTACIÓN DE ENDPOINTS
// ============================================

/*
╔════════════════════════════════════════════════════════════╗
║                   ENDPOINTS DE USUARIOS                    ║
╚════════════════════════════════════════════════════════════╝

TODAS LAS RUTAS REQUIEREN:
Headers: {
  "Authorization": "Bearer token_aqui"
}

PERMISOS: Solo Admin y RRHH pueden acceder

─────────────────────────────────────────────────────────────

1. LISTAR USUARIOS
   GET /api/users
   
   Response: {
     "success": true,
     "data": [
       {
         "id_usuario": 1,
         "username": "admin",
         "email": "admin@empresa.com",
         "rol": "ADMINISTRADOR",
         "activo": true,
         "fecha_creacion": "2024-01-10",
         "empleado_nombre": "Juan Pérez",
         "id_empleado": 5
       }
     ],
     "count": 10
   }

─────────────────────────────────────────────────────────────

2. OBTENER USUARIO POR ID
   GET /api/users/:id
   
   Response: {
     "success": true,
     "data": {
       "id_usuario": 1,
       "username": "admin",
       "email": "admin@empresa.com",
       "rol": "ADMINISTRADOR",
       "activo": true,
       "empleado_nombre": "Juan Pérez"
     }
   }

─────────────────────────────────────────────────────────────

3. ACTUALIZAR USUARIO
   PUT /api/users/:id
   
   Body: {
     "email": "nuevo@email.com",
     "rol": "RRHH",
     "id_empleado": 10
   }
   
   Campos opcionales:
   - email: Nuevo email
   - rol: Nuevo rol (ADMINISTRADOR, RRHH, EMPLEADO)
   - id_empleado: Asociar con empleado (null para desasociar)
   
   Response: {
     "success": true,
     "message": "Usuario actualizado exitosamente"
   }

─────────────────────────────────────────────────────────────

4. ELIMINAR USUARIO
   DELETE /api/users/:id
   
   Restricciones:
   - No puedes eliminar tu propio usuario
   
   Response: {
     "success": true,
     "message": "Usuario eliminado exitosamente"
   }

─────────────────────────────────────────────────────────────

5. ACTIVAR/DESACTIVAR USUARIO
   PATCH /api/users/:id/toggle-status
   
   Acción: Cambia el estado activo del usuario
   
   Response: {
     "success": true,
     "message": "Usuario activado exitosamente",
     "data": {
       "activo": true
     }
   }

╔════════════════════════════════════════════════════════════╗
║                    PERMISOS POR ROL                        ║
╚════════════════════════════════════════════════════════════╝

ADMINISTRADOR:
✅ Listar usuarios
✅ Ver detalle de usuario
✅ Actualizar usuario
✅ Eliminar usuario
✅ Activar/Desactivar usuario

RRHH:
✅ Listar usuarios
✅ Ver detalle de usuario
✅ Actualizar usuario
✅ Eliminar usuario
✅ Activar/Desactivar usuario

EMPLEADO:
❌ No tiene acceso a estas rutas

NOTA:
- Los usuarios se crean mediante POST /api/auth/register
- Para cambiar contraseña usa el sistema de recuperación
*/

const express = require('express');
const router = express.Router();

// Importar controlador
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus
} = require('../controllers/userController');

// Importar middlewares
const {
    verifyToken,
    verifyAdmin
} = require('../middleware/authMiddleware');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN Y ROL ADMIN
// ============================================

router.use(verifyToken);
router.use(verifyAdmin);

// ============================================
// RUTAS
// ============================================

// GET /api/users
// Listar todos los usuarios
router.get('/', getAllUsers);

// GET /api/users/:id
// Obtener usuario por ID
router.get('/:id', getUserById);

// PUT /api/users/:id
// Actualizar usuario
router.put('/:id', updateUser);

// DELETE /api/users/:id
// Eliminar usuario
router.delete('/:id', deleteUser);

// PATCH /api/users/:id/toggle-status
// Activar/Desactivar usuario
router.patch('/:id/toggle-status', toggleUserStatus);

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;

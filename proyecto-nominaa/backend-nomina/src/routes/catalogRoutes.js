// ============================================
// RUTAS DE CATÁLOGOS
// Archivo: routes/catalogRoutes.js
// ============================================

/*
ENDPOINTS DISPONIBLES:
- GET /api/catalogs/cargos - Lista de cargos
- GET /api/catalogs/departamentos - Lista de departamentos
- GET /api/catalogs/roles - Lista de roles

Todos requieren autenticación
*/

const express = require('express');
const router = express.Router();

// Importar controlador
const {
    getAllCargos,
    getAllDepartamentos,
    getAllRoles
} = require('../controllers/catalogController');

// Importar middlewares
const { verifyToken } = require('../middleware/authMiddleware');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================

router.use(verifyToken);

// ============================================
// RUTAS
// ============================================

// GET /api/catalogs/cargos
router.get('/cargos', getAllCargos);

// GET /api/catalogs/departamentos
router.get('/departamentos', getAllDepartamentos);

// GET /api/catalogs/roles
router.get('/roles', getAllRoles);

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;
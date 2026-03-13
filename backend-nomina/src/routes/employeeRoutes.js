
// ============================================
// DOCUMENTACIÓN DE ENDPOINTS
// ============================================

/*
╔════════════════════════════════════════════════════════════╗
║                   ENDPOINTS DE EMPLEADOS                   ║
╚════════════════════════════════════════════════════════════╝

TODAS LAS RUTAS REQUIEREN:
Headers: {
  "Authorization": "Bearer token_aqui"
}

─────────────────────────────────────────────────────────────

1. LISTAR EMPLEADOS (Todos los usuarios)
   GET /api/employees?page=1&limit=10
   
   Query params (opcionales):
   - page: número de página (default: 1)
   - limit: resultados por página (default: 10)
   
   Response: {
     "success": true,
     "data": [...],
     "pagination": {
       "page": 1,
       "limit": 10,
       "total": 50,
       "totalPages": 5
     }
   }

─────────────────────────────────────────────────────────────

2. BUSCAR EMPLEADOS (Todos los usuarios)
   GET /api/employees/search?q=Juan
   
   Query params:
   - q: término de búsqueda
   
   Response: {
     "success": true,
     "data": [...],
     "count": 3
   }

─────────────────────────────────────────────────────────────

3. OBTENER EMPLEADO POR ID (Todos los usuarios)
   GET /api/employees/5
   
   Response: {
     "success": true,
     "data": {
       "id_empleado": 5,
       "nombres": "Juan",
       "apellidos": "Pérez",
       "numero_identificacion": "123456789",
       "nombre_cargo": "Gerente",
       "nombre_departamento": "Ventas",
       ...
     }
   }

─────────────────────────────────────────────────────────────

4. CREAR EMPLEADO (Solo Admin y RRHH)
   POST /api/employees
   
   Body: {
     "nombres": "Juan",
     "apellidos": "Pérez",
     "tipo_identificacion": "CC",
     "numero_identificacion": "123456789",
     "fecha_nacimiento": "1990-05-15",
     "fecha_ingreso": "2024-01-10",
     "id_cargo": 1,
     "id_departamento": 2
   }
   
   Campos requeridos:
   - nombres
   - apellidos
   - tipo_identificacion
   - numero_identificacion
   
   Response: {
     "success": true,
     "message": "Empleado creado exitosamente",
     "data": {...}
   }

─────────────────────────────────────────────────────────────

5. ACTUALIZAR EMPLEADO (Solo Admin y RRHH)
   PUT /api/employees/5
   
   Body: {
     "nombres": "Juan Carlos",
     "id_cargo": 3
   }
   
   Nota: Solo envía los campos que quieres actualizar
   
   Response: {
     "success": true,
     "message": "Empleado actualizado exitosamente",
     "data": {...}
   }

─────────────────────────────────────────────────────────────

6. ELIMINAR EMPLEADO (Solo Admin y RRHH)
   DELETE /api/employees/5
   
   Restricciones:
   - No se puede eliminar si tiene usuario asociado
   - No se puede eliminar si tiene registros de nómina
   
   Response: {
     "success": true,
     "message": "Empleado eliminado exitosamente"
   }

╔════════════════════════════════════════════════════════════╗
║                    PERMISOS POR ROL                        ║
╚════════════════════════════════════════════════════════════╝

ADMINISTRADOR:
✅ Listar empleados
✅ Buscar empleados
✅ Ver detalle de empleado
✅ Crear empleado
✅ Actualizar empleado
✅ Eliminar empleado

RRHH:
✅ Listar empleados
✅ Buscar empleados
✅ Ver detalle de empleado
✅ Crear empleado
✅ Actualizar empleado
✅ Eliminar empleado

EMPLEADO:
✅ Listar empleados
✅ Buscar empleados
✅ Ver detalle de empleado
❌ Crear empleado
❌ Actualizar empleado
❌ Eliminar empleado
*/

const express = require('express');
const router = express.Router();

// Importar controladores
const {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees
} = require('../controllers/employeeController');

// Importar middlewares
const {
    verifyToken,
    verifyAdminORRRHH
} = require('../middleware/authMiddleware');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================

// Aplicar verifyToken a todas las rutas
router.use(verifyToken);

// ============================================
// RUTAS PÚBLICAS (Para todos los usuarios autenticados)
// ============================================

// GET /api/employees
// Listar todos los empleados (con paginación)
router.get('/', getAllEmployees);

// GET /api/employees/search?q=termino
// Buscar empleados
router.get('/search', searchEmployees);

// GET /api/employees/:id
// Obtener un empleado por ID
router.get('/:id', getEmployeeById);

// ============================================
// RUTAS PROTEGIDAS (Solo Admin y RRHH)
// ============================================

// POST /api/employees
// Crear nuevo empleado
router.post('/', verifyAdminORRRHH, createEmployee);

// PUT /api/employees/:id
// Actualizar empleado
router.put('/:id', verifyAdminORRRHH, updateEmployee);

// DELETE /api/employees/:id
// Eliminar empleado
router.delete('/:id', verifyAdminORRRHH, deleteEmployee);

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;

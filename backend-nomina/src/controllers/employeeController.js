// ============================================
// CONTROLADOR DE EMPLEADOS
// Archivo: controllers/employeeController.js
// ============================================

// ============================================
// NOTAS
// ============================================

/*
FUNCIONALIDADES IMPLEMENTADAS:

1. LISTAR EMPLEADOS:
   - Paginación (page, limit)
   - Incluye cargo, departamento y usuario si existe
   - Ordenado por apellidos

2. OBTENER POR ID:
   - Información completa del empleado
   - Incluye relaciones (cargo, departamento, usuario)

3. CREAR EMPLEADO:
   - Validación de campos requeridos
   - Verifica duplicados por número de identificación
   - Retorna el empleado creado con toda su info

4. ACTUALIZAR EMPLEADO:
   - Solo actualiza campos proporcionados (COALESCE)
   - Verifica duplicados
   - Retorna empleado actualizado

5. ELIMINAR EMPLEADO:
   - Verifica que no tenga usuario asociado
   - Verifica que no tenga registros de nómina
   - Eliminación segura

6. BUSCAR EMPLEADOS:
   - Búsqueda por nombre, apellido o identificación
   - Límite de 20 resultados
   - Incluye información básica

VALIDACIONES DE SEGURIDAD:
✅ No eliminar si tiene usuario
✅ No eliminar si tiene nóminas
✅ No duplicar número de identificación
✅ Validación de campos requeridos
*/
// ============================================
// NOTAS
// ============================================

/*
FUNCIONALIDADES IMPLEMENTADAS:

1. LISTAR EMPLEADOS:
   - Paginación (page, limit)
   - Incluye cargo, departamento y usuario si existe
   - Ordenado por apellidos

2. OBTENER POR ID:
   - Información completa del empleado
   - Incluye relaciones (cargo, departamento, usuario)

3. CREAR EMPLEADO:
   - Validación de campos requeridos
   - Verifica duplicados por número de identificación
   - Retorna el empleado creado con toda su info

4. ACTUALIZAR EMPLEADO:
   - Solo actualiza campos proporcionados (COALESCE)
   - Verifica duplicados
   - Retorna empleado actualizado

5. ELIMINAR EMPLEADO:
   - Verifica que no tenga usuario asociado
   - Verifica que no tenga registros de nómina
   - Eliminación segura

6. BUSCAR EMPLEADOS:
   - Búsqueda por nombre, apellido o identificación
   - Límite de 20 resultados
   - Incluye información básica

VALIDACIONES DE SEGURIDAD:
✅ No eliminar si tiene usuario
✅ No eliminar si tiene nóminas
✅ No duplicar número de identificación
✅ Validación de campos requeridos
*/

const { pool } = require("../config/database.js");

const resolveCargoIdByName = async (nombreCargo) => {
  const cargoLimpio = nombreCargo?.trim();

  if (!cargoLimpio) return null;

  const [existingCargo] = await pool.query(
    `SELECT id_cargo FROM cargos WHERE UPPER(nombre_cargo) = UPPER(?) LIMIT 1`,
    [cargoLimpio]
  );

  if (existingCargo.length > 0) {
    return existingCargo[0].id_cargo;
  }

  const [result] = await pool.query(
    `INSERT INTO cargos (nombre_cargo) VALUES (?)`,
    [cargoLimpio]
  );

  return result.insertId;
};

//1. Listar todos los empleados

const getAllEmployees = async (req, res) => {
  try {
    const isEmployeeRole = req.user?.rol === 'EMPLEADO';

    if (isEmployeeRole && !req.user?.id_empleado) {
      return res.status(403).json({
        success: false,
        message: 'No tienes un empleado asociado para consultar información',
      });
    }

    //parametros de paginacion(
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    //contar total empleados
    const [countResult] = isEmployeeRole
      ? await pool.query(
          `SELECT COUNT(*) as total FROM empleados WHERE id_empleado = ?`,
          [req.user.id_empleado]
        )
      : await pool.query(`SELECT COUNT(*) as total FROM empleados`);
    const total = countResult[0].total;

    //Obtener empleados con informacion relacionada
    const employeesQuery = `SELECT 
                e.id_empleado,
                e.nombres,
                e.apellidos,
                e.tipo_identificacion,
                e.numero_identificacion,
                e.sueldo,
                e.fecha_nacimiento,
                e.fecha_ingreso,
                c.nombre_cargo,
                d.nombre_departamento,
                u.username,
                u.email
             FROM empleados e
             LEFT JOIN cargos c ON e.id_cargo = c.id_cargo
             LEFT JOIN departamentos d ON e.id_departamento = d.id_departamento
             LEFT JOIN usuarios u ON u.id_empleado = e.id_empleado
             ${isEmployeeRole ? 'WHERE e.id_empleado = ?' : ''}
             ORDER BY e.apellidos, e.nombres
             LIMIT ? OFFSET ?`;

    const queryParams = isEmployeeRole
      ? [req.user.id_empleado, limit, offset]
      : [limit, offset];

    const [emplyees] = await pool.query(employeesQuery, queryParams);

    res.json({
      succes: true,
      data: emplyees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error en getAllEmployees:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener empleados",
    });
  }
};

//2. obtener un empleado por su ID

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const isEmployeeRole = req.user?.rol === 'EMPLEADO';

    if (isEmployeeRole && !req.user?.id_empleado) {
      return res.status(403).json({
        success: false,
        message: 'No tienes un empleado asociado para consultar información',
      });
    }

    if (isEmployeeRole && Number(id) !== Number(req.user.id_empleado)) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes consultar tu información de empleado',
      });
    }

    const [employees] = await pool.query(
      `SELECT 
                e.*,
                c.nombre_cargo,
                d.nombre_departamento,
                u.username,
                u.email,
                u.id_usuario
             FROM empleados e
             LEFT JOIN cargos c ON e.id_cargo = c.id_cargo
             LEFT JOIN departamentos d ON e.id_departamento = d.id_departamento
             LEFT JOIN usuarios u ON u.id_empleado = e.id_empleado
             WHERE e.id_empleado = ?`,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Empleado no encontrado",
      });
    }
    res.json({
      success: true,
      data: employees[0],
    });
  } catch (error) {
    console.error("Error en getEmployeeById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener empleado",
    });
  }
};

// 3. Crear nuevo empleado

const createEmployee = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      tipo_identificacion,
      numero_identificacion,
      sueldo,
      fecha_nacimiento,
      fecha_ingreso,
      nombre_cargo,
      id_departamento,
    } = req.body;

    // Validación
    if (
      !nombres ||
      !apellidos ||
      !tipo_identificacion ||
      !numero_identificacion ||
      sueldo === undefined ||
      sueldo === null ||
      sueldo === '' ||
      !nombre_cargo?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Por favor completa todos los campos requeridos",
      });
    }

    // Verificar si ya existe un empleado con ese número de identificación
    const [existing] = await pool.query(
      `SELECT id_empleado FROM empleados WHERE numero_identificacion = ?`,
      [numero_identificacion]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un empleado con ese número de identificación",
      });
    }

    const resolvedCargoId = await resolveCargoIdByName(nombre_cargo);

    // Insertar un nuevo empleado
    const [result] = await pool.query(
      `INSERT INTO empleados 
        (nombres, apellidos, tipo_identificacion, numero_identificacion, sueldo,
         fecha_nacimiento, fecha_ingreso, id_cargo, id_departamento) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombres,
        apellidos,
        tipo_identificacion,
        numero_identificacion,
        sueldo,
        fecha_nacimiento || null,
        fecha_ingreso || new Date(),
        resolvedCargoId,
        id_departamento,
      ]
    );

    // Obtener el empleado creado
    const [newEmployee] = await pool.query(
      `SELECT 
          e.*,
          c.nombre_cargo,
          d.nombre_departamento
        FROM empleados e
        LEFT JOIN cargos c ON e.id_cargo = c.id_cargo
        LEFT JOIN departamentos d ON e.id_departamento = d.id_departamento
        WHERE e.id_empleado = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Empleado creado exitosamente",
      data: newEmployee[0],
    });

  } catch (error) {
    console.error("Error en createEmployee:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear empleado",
    });
  }
};

// 4. Actualizar empleado
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidos,
      tipo_identificacion,
      numero_identificacion,
      sueldo,
      fecha_nacimiento,
      fecha_ingreso,
      nombre_cargo,
      id_departamento,
    } = req.body;
    // Verificar que el empleado existe

    const [existing] = await pool.query(
      `SELECT id_empleado FROM empleados WHERE id_empleado = ?`,
        [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Empleado no encontrado",
      });
    }
    //Verificar si el numero de identificacion ya existe en otro empelado
    if (numero_identificacion) {
      const [duplicate] = await pool.query(
        `SELECT numero_identificacion FROM empleados WHERE numero_identificacion = ? AND id_empleado != ?`,
        [numero_identificacion, id]
      );
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe otro empleado con ese número de identificación",
        });
      }
    }

    const resolvedCargoId = nombre_cargo !== undefined
      ? await resolveCargoIdByName(nombre_cargo)
      : undefined;

    // Actualizar el empleado
    await pool.query(
      `UPDATE empleados 
             SET nombres = COALESCE(?, nombres),
                 apellidos = COALESCE(?, apellidos),
                 tipo_identificacion = COALESCE(?, tipo_identificacion),
                 numero_identificacion = COALESCE(?, numero_identificacion),
                 sueldo = COALESCE(?, sueldo),
                 fecha_nacimiento = COALESCE(?, fecha_nacimiento),
                 fecha_ingreso = COALESCE(?, fecha_ingreso),
                 id_cargo = COALESCE(?, id_cargo),
                 id_departamento = COALESCE(?, id_departamento)
             WHERE id_empleado = ?`,
      [
        nombres,
        apellidos,
        tipo_identificacion,
        numero_identificacion,
        sueldo,
        fecha_nacimiento,
        fecha_ingreso,
        resolvedCargoId,
        id_departamento,
        id,
      ]
    );
    // Obtener el empleado actualizado
    const [updated] = await pool.query(
      `SELECT 
                e.*,
                c.nombre_cargo,
                d.nombre_departamento
             FROM empleados e
             LEFT JOIN cargos c ON e.id_cargo = c.id_cargo
             LEFT JOIN departamentos d ON e.id_departamento = d.id_departamento
             WHERE e.id_empleado = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Empleado actualizado exitosamente",
      data: updated[0],
    });
  } catch (error) {
    console.error("Error en updateEmployee:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar empleado",
    });
  }
};

//Eliminar empleados
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el empleado existe
    const [existing] = await pool.query(
      "SELECT id_empleado FROM empleados WHERE id_empleado = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Empleado no encontrado",
      });
    }

    // Verificar si el empleado tiene un usuario asociado
    const [hasUser] = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE id_empleado = ?",
      [id]
    );

    if (hasUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar. El empleado tiene un usuario asociado",
      });
    }

    // Verificar si el empleado tiene nóminas
    const [hasNomina] = await pool.query(
      "SELECT id_nomina FROM nomina WHERE id_empleado = ?",
      [id]
    );

    if (hasNomina.length > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar. El empleado tiene registros de nómina",
      });
    }

    // Eliminar el empleado
    await pool.query("DELETE FROM empleados WHERE id_empleado = ?", [id]);

    res.json({
      success: true,
      message: "Empleado eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteEmployee:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar empleado",
    });
  }
};

// 6. Buscar empleados

const searchEmployees = async (req, res) => {
  try {
    const { q } = req.query; //q = query (termino de busqueda)
    const isEmployeeRole = req.user?.rol === 'EMPLEADO';

    if (isEmployeeRole && !req.user?.id_empleado) {
      return res.status(403).json({
        success: false,
        message: 'No tienes un empleado asociado para consultar información',
      });
    }

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Por favor proporciona un término de búsqueda",
      });
    }

     const searchTerm = `%${q}%`;
     const [employees] = await pool.query(
            `SELECT 
                e.id_empleado,
                e.nombres,
                e.apellidos,
                e.numero_identificacion,
                e.sueldo,
                c.nombre_cargo,
                d.nombre_departamento
             FROM empleados e
             LEFT JOIN cargos c ON e.id_cargo = c.id_cargo
             LEFT JOIN departamentos d ON e.id_departamento = d.id_departamento
             WHERE (e.nombres LIKE ? 
                OR e.apellidos LIKE ? 
                OR e.numero_identificacion LIKE ?)
               ${isEmployeeRole ? 'AND e.id_empleado = ?' : ''}
             ORDER BY e.apellidos, e.nombres
             LIMIT 20`,
            isEmployeeRole
              ? [searchTerm, searchTerm, searchTerm, req.user.id_empleado]
              : [searchTerm, searchTerm, searchTerm]
        );

        res.json({
            success: true,
            data: employees,
            count: employees.length
        });
  } catch (error) {
      console.error('Error en searchEmployees:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar empleados'
        });
  }
};

// EXPORTAR FUNCIONES
// ============================================

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees
};

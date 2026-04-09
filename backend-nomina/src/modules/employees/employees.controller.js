const { pool } = require("../../config/database.js");
const {
  EMPLOYEE_SEARCH_LIMIT,
  DEFAULT_VACATION_DAYS,
} = require("./employees.constants");
const {
  resolveCargoIdByName,
  isEmployeeUser,
  validateEmployeeScopeAccess,
  buildPagination,
} = require("./employees.helpers");

// Lista empleados con paginacion y relaciones basicas.
const getAllEmployees = async (req, res) => {
  try {
    const isEmployeeRole = isEmployeeUser(req.user);
    const accessValidation = validateEmployeeScopeAccess(req.user);

    if (!accessValidation.allowed) {
      return res.status(accessValidation.status).json({
        success: false,
        message: accessValidation.message,
      });
    }

    const { page, limit, offset } = buildPagination(req.query);

    const [countResult] = isEmployeeRole
      ? await pool.query(
          `SELECT COUNT(*) as total FROM empleados WHERE id_empleado = ?`,
          [req.user.id_empleado]
        )
      : await pool.query(`SELECT COUNT(*) as total FROM empleados`);

    const total = countResult[0].total;

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
      ${isEmployeeRole ? "WHERE e.id_empleado = ?" : ""}
      ORDER BY e.apellidos, e.nombres
      LIMIT ? OFFSET ?`;

    const queryParams = isEmployeeRole
      ? [req.user.id_empleado, limit, offset]
      : [limit, offset];

    const [employees] = await pool.query(employeesQuery, queryParams);

    res.json({
      success: true,
      succes: true,
      data: employees,
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

// Obtiene un empleado por id con sus relaciones principales.
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const isEmployeeRole = isEmployeeUser(req.user);
    const accessValidation = validateEmployeeScopeAccess(req.user);

    if (!accessValidation.allowed) {
      return res.status(accessValidation.status).json({
        success: false,
        message: accessValidation.message,
      });
    }

    if (isEmployeeRole && Number(id) !== Number(req.user.id_empleado)) {
      return res.status(403).json({
        success: false,
        message: "Solo puedes consultar tu informacion de empleado",
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

// Crea un empleado y deja listo su saldo inicial de vacaciones del anio actual.
const createEmployee = async (req, res) => {
  const connection = await pool.getConnection();

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

    if (
      !nombres ||
      !apellidos ||
      !tipo_identificacion ||
      !numero_identificacion ||
      sueldo === undefined ||
      sueldo === null ||
      sueldo === "" ||
      !nombre_cargo?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Por favor completa todos los campos requeridos",
      });
    }

    const [existing] = await connection.query(
      `SELECT id_empleado FROM empleados WHERE numero_identificacion = ?`,
      [numero_identificacion]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un empleado con ese numero de identificacion",
      });
    }

    const resolvedCargoId = await resolveCargoIdByName(nombre_cargo, connection);
    const currentYear = new Date().getUTCFullYear();

    await connection.beginTransaction();

    const [result] = await connection.query(
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

    await connection.query(
      `INSERT INTO vacaciones_saldos
        (id_empleado, periodo_anio, dias_ganados, dias_disfrutados, dias_pendientes)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, currentYear, DEFAULT_VACATION_DAYS, 0, DEFAULT_VACATION_DAYS]
    );

    await connection.commit();

    const [newEmployee] = await connection.query(
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
    await connection.rollback();
    console.error("Error en createEmployee:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear empleado",
    });
  } finally {
    connection.release();
  }
};

// Actualiza un empleado conservando valores anteriores si no llegan en el body.
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

    if (numero_identificacion) {
      const [duplicate] = await pool.query(
        `SELECT numero_identificacion FROM empleados WHERE numero_identificacion = ? AND id_empleado != ?`,
        [numero_identificacion, id]
      );

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe otro empleado con ese numero de identificacion",
        });
      }
    }

    const resolvedCargoId =
      nombre_cargo !== undefined
        ? await resolveCargoIdByName(nombre_cargo)
        : undefined;

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

// Elimina un empleado solo si no tiene usuario ni registros de nomina.
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

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

    const [hasNomina] = await pool.query(
      "SELECT id_nomina FROM nomina WHERE id_empleado = ?",
      [id]
    );

    if (hasNomina.length > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar. El empleado tiene registros de nomina",
      });
    }

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

// Busca empleados por nombre, apellido o identificacion.
const searchEmployees = async (req, res) => {
  try {
    const { q } = req.query;
    const isEmployeeRole = isEmployeeUser(req.user);
    const accessValidation = validateEmployeeScopeAccess(req.user);

    if (!accessValidation.allowed) {
      return res.status(accessValidation.status).json({
        success: false,
        message: accessValidation.message,
      });
    }

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Por favor proporciona un termino de busqueda",
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
      WHERE (e.nombres LIKE ? OR e.apellidos LIKE ? OR e.numero_identificacion LIKE ?)
        ${isEmployeeRole ? "AND e.id_empleado = ?" : ""}
      ORDER BY e.apellidos, e.nombres
      LIMIT ?`,
      isEmployeeRole
        ? [searchTerm, searchTerm, searchTerm, req.user.id_empleado, EMPLOYEE_SEARCH_LIMIT]
        : [searchTerm, searchTerm, searchTerm, EMPLOYEE_SEARCH_LIMIT]
    );

    res.json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error("Error en searchEmployees:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar empleados",
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
};

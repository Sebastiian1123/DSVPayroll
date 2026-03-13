// ============================================
// CONTROLADOR DE USUARIOS
// Archivo: controllers/userController.js
// ============================================

// ============================================
// NOTAS IMPORTANTES
// ============================================

/*
FUNCIONALIDADES IMPLEMENTADAS:

1. LISTAR USUARIOS:
   - Todos los usuarios del sistema
   - Incluye información del empleado asociado
   - Incluye rol y estado

2. OBTENER USUARIO POR ID:
   - Información completa del usuario
   - Datos del empleado si existe

3. ACTUALIZAR USUARIO:
   - Email, rol, empleado asociado
   - No permite actualizar username ni password (se hacen por separado)

4. ELIMINAR USUARIO:
   - No permite eliminar tu propio usuario
   - Validación de seguridad

5. CAMBIAR ESTADO:
   - Activar/Desactivar usuario
   - Toggle del campo activo

SEGURIDAD:
✅ Solo Admin y RRHH pueden acceder (middleware en rutas)
✅ No puedes eliminar tu propio usuario
✅ Validaciones de campos únicos
*/

const { pool } = require("../config/database.js");

// ============================================
// 1. LISTAR TODOS LOS USUARIOS
// ============================================
const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_usuario,
        u.username,
        u.email,
        r.nombre_rol as rol,
        u.activo,
        CONCAT(e.nombres, ' ', e.apellidos) as empleado_nombre,
        e.id_empleado
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      ORDER BY u.id_usuario DESC
    `;

    const [users] = await pool.query(query);

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// ============================================
// 2. OBTENER USUARIO POR ID
// ============================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        u.id_usuario,
        u.username,
        u.email,
        r.nombre_rol as rol,
        u.activo,
        u.id_empleado,
        CONCAT(e.nombres, ' ', e.apellidos) as empleado_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      WHERE u.id_usuario = ?
    `;

    const [users] = await pool.query(query, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// ============================================
// 3. ACTUALIZAR USUARIO
// ============================================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, rol, id_empleado } = req.body;

    // Verificar que el usuario existe
    const [userExists] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar email duplicado
    if (email) {
      const [emailExists] = await pool.query(
        'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?',
        [email, id]
      );

      if (emailExists.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        });
      }
    }

    // Construir query dinámico
    const updates = [];
    const values = [];

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (rol) {
      // Obtener id_rol desde el nombre del rol
      const [roles] = await pool.query(
        'SELECT id_rol FROM roles WHERE nombre_rol = ?',
        [rol]
      );

      if (roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
      }

      updates.push('id_rol = ?');
      values.push(roles[0].id_rol);
    }

    if (id_empleado !== undefined) {
      // Verificar que el empleado no tenga otro usuario
      if (id_empleado) {
        const [empHasUser] = await pool.query(
          'SELECT id_usuario FROM usuarios WHERE id_empleado = ? AND id_usuario != ?',
          [id_empleado, id]
        );

        if (empHasUser.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'El empleado ya tiene un usuario asociado'
          });
        }
      }

      updates.push('id_empleado = ?');
      values.push(id_empleado || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
    await pool.query(query, values);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// ============================================
// 4. ELIMINAR USUARIO
// ============================================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const [userExists] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar al usuario actual
    if (req.user.id_usuario === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// ============================================
// 5. ACTIVAR/DESACTIVAR USUARIO
// ============================================
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener estado actual
    const [user] = await pool.query(
      'SELECT activo FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar tu propio usuario
    if (req.user.id_usuario === parseInt(id) && user[0].activo) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propio usuario'
      });
    }

    const newStatus = !user[0].activo;

    await pool.query(
      'UPDATE usuarios SET activo = ? WHERE id_usuario = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
      data: { activo: newStatus }
    });

  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
};
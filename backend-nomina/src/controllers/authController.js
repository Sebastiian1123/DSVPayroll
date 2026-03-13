// ============================================
// CONTROLADOR DE AUTENTICACIÓN
// Archivo: controllers/authController.js
// ============================================

// ============================================
// NOTAS IMPORTANTES
// ============================================

/*
FUNCIONALIDADES IMPLEMENTADAS:

1. LOGIN:
   - Verifica usuario y contraseña
   - Comprueba que el usuario esté activo
   - Genera token JWT válido por 8 horas
   - Retorna información del usuario

2. REGISTER:
   - Solo accesible para Admin y RRHH (middleware)
   - Valida formato de email
   - Verifica que usuario/email no existan
   - Encripta contraseña con bcrypt
   - Crea nuevo usuario

3. RECUPERACIÓN DE CONTRASEÑA:
   - Genera token de 6 dígitos
   - Token válido por 30 minutos
   - Guarda en BD
   - Por seguridad, siempre responde igual

4. RESTABLECER CONTRASEÑA:
   - Verifica token válido
   - Verifica que no esté expirado
   - Verifica que no se haya usado
   - Actualiza contraseña
   - Marca token como usado

5. PERFIL:
   - Obtiene información del usuario autenticado
   - Incluye datos del empleado si existe

SEGURIDAD:
✅ Contraseñas hasheadas (bcrypt)
✅ Tokens JWT con expiración
✅ Validación de roles
✅ Tokens de recuperación de un solo uso
✅ Validación de datos de entrada
✅ Mensajes genéricos (no revelar si email existe)
*/

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/database.js");

//1: LOGUIN INICIO DE SESION

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    //validar que se envien los datos
    if (!username || !password)
      return res.status(400).json({
        succes: false,
        message: "Porfavor proporciona usuario y contraseña",
      });

    //Buscar el usuario en la base de datos

    const [users] = await pool.query(
      `SELECT u.id_usuario, u.username, u.password, u.email, u.activo,
              r.nombre_rol, u.id_empleado
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.username = ?`,
      [username]
    );
    //verificar si el usuario existe
    if (users.length === 0)
      return res.status(401).json({
        succes: false,
        message: "usuario o contraseña incorrectos",
      });

    const user = users[0];

    //Verificar si el usuario esta activo

    if (!user.activo)
      return res.status(403).json({
        succes: false,
        message: "Tu cuenta esta desactivada contacta con el administrador",
      });

    //Verificar que la contraseña este correcta
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch)
      return res.status(401).json({
        succes: false,
        message: "Usuario o contraseña incorrectos",
      });

    //Crear el token JWT
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        username: user.username,
        rol: user.nombre_rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    //responder con el token y datos del usuario
    res.json({
      succes: true,
      message: "Login exitoso",
      token,
      user: {
        id_usuario: user.id_usuario,
        username: user.username,
        email: user.email,
        rol: user.nombre_rol,
        id_empleado: user.id_empleado,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      succes: false,
      message: "Error al iniciar sesion",
    });
  }
};

//Registar usuario (solo admin y RRHH)

const register = async (req, res) => {
  try {
    const { username, password, email, rol, id_empleado } = req.body;

    //validar los datos requeridos

    if (!username || !password || !email || !rol)
      return res.status(400).json({
        succes: false,
        message: "Porfavor completa todos los datos requeridos",
      });

    //validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({
        succes: false,
        message: "Email invalido",
      });

    //Validar longitud de contraseña
    if (password.length < 6)
      return res.status(400).json({
        succes: false,
        message: "la contraseña debe tener almenos 6 caracteres",
      });
    //Verificar si el usuario ya existe
    const [existingUsers] = await pool.query(
      `SELECT id_usuario FROM usuarios WHERE username = ? OR email = ?`,
      [username, email]
    );

    if (existingUsers.length > 0)
      return res.status(409).json({
        succes: false,
        message: "El usuario o el email ya existe",
      });

    //obtener el id_rol basado en el nombre del rol
    const [roles] = await pool.query(
      `SELECT id_rol FROM roles WHERE nombre_rol = ?`,
      [rol]
    );

    if (roles.length === 0)
      return res.status(400).json({
        succes: false,
        message: "Rol invalido",
      });

    const id_rol = roles[0].id_rol;

    //encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    //Insertar nuevo usuario
    const [result] = await pool.query(
      `INSERT INTO usuarios (username, password, email, id_rol, id_empleado, activo)
          VALUES(?,?,?,?,?, TRUE)`,
      [username, hashedPassword, email, id_rol, id_empleado || null]
    );

    res.status(201).json({
      succes: true,
      message: "Usuario registrado correctamente",
      user: {
        id_usuario: result.insertId,
        username,
        email,
        rol,
      },
    });
  } catch (error) {
    console.error("Error al registar:", error);
    res.status(500).json({
      succes: false,
      message: "Error al registar usuario",
    });
  }
};

//3. Solicitud Recuperacion de contraseña
// ============================================
// FUNCIÓN ACTUALIZADA: requestPasswordReset
// Reemplaza la función existente en authController.js
// ============================================

const { sendPasswordResetEmail } = require('../services/emailService');

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Por favor proporciona tu email",
      });
    }

    // Buscar usuario por email
    const [users] = await pool.query(
      `SELECT id_usuario, username, email FROM usuarios WHERE email = ? AND activo = TRUE`,
      [email]
    );

    // Por seguridad, siempre respondemos lo mismo aunque el email no exista
    if (users.length === 0) {
      return res.json({
        success: true,
        message: "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
      });
    }

    const user = users[0];

    // Generar token aleatorio de 6 dígitos
    const resetToken = crypto.randomInt(100000, 999999).toString();

    // El token expira en 30 minutos
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Guardar token en la base de datos
    await pool.query(
      `INSERT INTO password_reset_tokens (id_usuario, token, expira_en)
       VALUES (?, ?, ?)`,
      [user.id_usuario, resetToken, expiresAt]
    );

    // 🔥 ENVIAR EMAIL CON EL TOKEN
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.username,
      resetToken
    );

    if (emailResult.success) {
      console.log('✅ Email enviado exitosamente a:', user.email);
    } else {
      console.error('❌ Error al enviar email:', emailResult.error);
    }

    // Respuesta al cliente (igual para todos por seguridad)
    res.json({
      success: true,
      message: "Si el email existe, recibirás instrucciones para recuperar tu contraseña",
      // SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
      ...(process.env.NODE_ENV === "development" && {
        dev: {
          token: resetToken,
          username: user.username,
          emailSent: emailResult.success
        }
      })
    });

  } catch (error) {
    console.error("Error en requestPasswordReset:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
    });
  }
};
// 4. RESTABLECER CONTRASEÑA CON TOKEN
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    //validar datos
    if (!email || !token || !newPassword)
      return res.status(400).json({
        succes: false,
        message: "Porfavor completa todos los campos",
      });

    if (newPassword.length < 6)
      return res.status(400).json({
        succes: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      });

    //buscar usuario por email
    const [users] = await pool.query(
      `SELECT id_usuario FROM usuarios WHERE email = ? AND activo = TRUE`,
      [email]
    );
    if (email.length === 0)
      return res.status(404).json({
        succes: false,
        message: "Usuario no encontrado",
      });

    const userId = users[0].id_usuario;

    //verificar el token
    const [tokens] = await pool.query(
      `SELECT id, expira_en, usado
        FROM password_reset_tokens
        WHERE id_usuario = ? AND token = ?
        ORDER BY creado_en DESC
        LIMIT 1`,
      [userId, token]
    );
    if (tokens.length === 0)
      return res.status(400).json({
        succes: false,
        message: "Token inválido",
      });

    const resetToken = tokens[0];

    //Verificar si el token ya fue usado
    if (resetToken.usado)
      return res.status(400).json({
        success: false,
        message: "Este token ya fue utilizado",
      });

    //Verificar si el token ya expiro
    if (new Date() > new Date(resetToken.expira_en))
      return res.status(400).json({
        success: false,
        message: "El token ha expirado. Solicita uno nuevo",
      });

    //Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    //Actualizar contraseña
    await pool.query(`UPDATE usuarios SET password = ? WHERE id_usuario = ?`, [
      hashedPassword,
      userId,
    ]);

    //Marcar el token como usado
    await pool.query(
      `UPDATE password_reset_tokens SET usado = TRUE WHERE id = ?`,
      [resetToken.id]
    );

    res.json({
      succes: true,
      message: "COntraseña  actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error en resetPassword: ", error);
    res.status(500).json({
      success: false,
      message: "Error al restablecer la contraseña",
    });
  }
};

//5. Obtener perfil del usuario actual

const getProfile = async (req, res) => {
  try {
    //req.user viene del middleware verifyToken

    const [users] = await pool.query(
      `SELECT 
        u.id_usuario, 
        u.username, 
        u.email, 
        r.nombre_rol,
        e.nombres, 
        e.apellidos
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      WHERE u.id_usuario = ?`,
      [req.user.id_usuario]
    );

    if (users.length === 0)
      return res.status(404).json({
        succes: false,
        message: "Usuario no encontrado",
      });

    res.json({
      succes: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
    });
  }
};

module.exports = {
  login,
  register,
  requestPasswordReset,
  resetPassword,
  getProfile,
};

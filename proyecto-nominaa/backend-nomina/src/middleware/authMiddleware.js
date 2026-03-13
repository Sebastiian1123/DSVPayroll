// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// Archivo: middleware/authMiddleware.js
// ============================================

// ============================================
// NOTAS Y EJEMPLOS DE USO
// ============================================

/*
CÓMO USAR ESTOS MIDDLEWARES EN LAS RUTAS:

1. PROTEGER UNA RUTA (solo usuarios autenticados):
   router.get('/perfil', verifyToken, (req, res) => {
       res.json({ user: req.user });
   });

2. PROTEGER RUTA CON ROL ESPECÍFICO (Admin o RRHH):
   router.post('/registrar-usuario', verifyToken, verifyAdminOrRRHH, (req, res) => {
       // Solo Admin y RRHH pueden llegar aquí
   });

3. PROTEGER RUTA SOLO PARA ADMIN:
   router.delete('/eliminar-usuario', verifyToken, verifyAdmin, (req, res) => {
       // Solo Admin puede llegar aquí
   });

4. ROLES PERSONALIZADOS:
   router.get('/ruta', verifyToken, verifyRoles('ADMINISTRADOR', 'EMPLEADO'), (req, res) => {
       // Admin y Empleado pueden acceder
   });

FLUJO DE VERIFICACIÓN:
1. Cliente envía petición con token en header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. verifyToken extrae y verifica el token

3. Si es válido, agrega req.user con la información del usuario

4. verifyRoles verifica si el usuario tiene los permisos necesarios

5. Si todo está bien, la petición continúa al controlador

SEGURIDAD:
✅ Token con expiración
✅ Verificación en base de datos (usuario activo)
✅ Validación de roles
✅ Manejo de errores específicos
✅ Headers de autorización estándar
*/

const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

// Verificamos el token con jwt

// Este middleware verifica que el usuario este autenticado
const verifyToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    // Formato esperado: "Bearer token_aqui"
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({
        succes: false,
        message: "No se proporciono token de autenticación",
      });
    //Extraer el token, vamos a quita la palabra bearer
    const token = authHeader.split(" ")[1];

    if (!token)
      return res.status(401).json({
        succes: false,
        message: "Token Invalido",
      });

    //Verificar y decodificar el token
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    //Verificar  que el usuario existe y esta activo
    const [users] = await pool.query(
      `SELECT u.id_usuario, u.username, u.email, u.activo, u.id_empleado, r.nombre_rol
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = ?`,
      [decode.id_usuario]
    );

    if (users.length === 0) {
      return res.status(404).json({
        succes: false,
        message: "Usario no encontrado",
      });
    }
    const user = users[0];

    //Verifica que este activo

    if (!user.activo)
      return res.status(403).json({
        succes: false,
        message: "Usuario inactivo, Contacta con el administrador",
      });
    // Agregar información del usuario al objeto req
    // Ahora puedes usar req.user en tus rutas

    req.user = {
        id_usuario: user.id_usuario,
        username : user.username,
        email: user.email,
        rol: user.nombre_rol,
        id_empleado: user.id_empleado
    };
    //Continuar con la siguiente funcion 
    next()
  } catch (error) {
    console.error('Error en verifyToken:', error.message);

    //Manejar diferentes tipos de errores en JWT

    if(error.name == 'JsonWebTokenError')
        return res.status(401).json({
            succes:false,
            message: 'Token invalido'
        })

     if (error.name === 'TokenExpiredError') 
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Por favor inicia sesión nuevamente'
            });
        
    
    return res.status(500).json({
        success: false,
        message: 'Error al verificar token'
    });
  }
};

// ****************************************
// * 2. VERIFICAR LOS ROLES ESPECIFICOS   *    
// ****************************************


const verifyRoles = (...allowedRoles) =>{
    return(req, res, next) =>{

        //verificamos que el usuario primero este autenticado 
        if(!req.user)
            return res.status(401).json({
                succes:false,
                message: 'Usuario no autenticado'
            })
        //verificar si el rol del usuario esta en la lista de usuarios permitidos
        const hasPermission = allowedRoles.includes(req.user.rol);

        if(!hasPermission)
            return res.status(403).json({
                succes: false,
                message: 'No tienes permisos para realizar esta accion',
                requiredRoles: allowedRoles,
                yourRole: req.user.rol
            })
        next()
    }

}

// ****************************************
// * 3.Verificar si es Admin o RRHH       *    
// ****************************************
// Middleware específico para operaciones administrativas
const verifyAdminORRRHH = verifyRoles('ADMINISTRADOR', 'RRHH');
// ****************************************
// * 5.VERIFICAR SI ES SOLO ADMIN         *    
// ****************************************
// Middleware específico para administradores
const verifyAdmin = verifyRoles('ADMINISTRADOR');

//EXPORTARMOS LOS MIDDLEWARES

module.exports = {
    verifyToken,
    verifyRoles,
    verifyAdminORRRHH,
    verifyAdmin
};

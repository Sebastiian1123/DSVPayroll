// ============================================
// SERVIDOR PRINCIPAL - EXPRESS
// Archivo: server.js
// ============================================

// ============================================
// NOTAS PARA ENTENDER EL CÓDIGO
// ============================================

/*
¿QUÉ HACE CADA COSA?

1. MIDDLEWARES:
   - cors(): Permite que React (puerto 3000) se comunique con el servidor (puerto 5000)
   - express.json(): Lee datos JSON del body de las peticiones
   - express.urlencoded(): Lee datos de formularios
   - Logger: Muestra en consola cada petición que llega

2. RUTAS:
   - GET / : Ruta de bienvenida
   - GET /api/health : Verifica que todo funcione
   - 404: Maneja rutas que no existen
   - Error handler: Captura todos los errores

3. PUERTO:
   - Lee PORT del .env (5000 por defecto)
   - Si está ocupado, cambia el puerto en .env

4. PROCESO:
   1. Inicia el servidor
   2. Prueba conexión a MySQL
   3. Escucha peticiones en el puerto 5000
   4. Responde a las peticiones
*/


// ============================================
// IMPORTAR RUTAS (Las crearemos después)
// ============================================

// Descomentar cuando creemos las rutas

require('dotenv').config();   // <--- SIEMPRE PRIMERO

const express = require('express');
const cors = require('cors');

//importar la confiuracion de base dedatos
const { testConnection, ensureEmployeeSalaryColumn, ensureDefaultDepartments, ensurePayrollSupportTables } = require('./src/config/database.js');
const { verifyConnection } = require('./src/services/emailService');


//crear o inicializar el servidor en express

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARES GLOBALES

//1. cors - Este permite las peticiones del frontend

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Permitir cookies  si las usamos
  })
);

//2. Leer los datos en formato json del body

app.use(express.json());

//3.  URL encode - leer datos de formularios
app.use(express.urlencoded({ extended: true }));

//4. Logger simple - ver las peticiones en la consola

app.use((req, res, next) => {
  console.log(
    `📨${req.method} ${req.path} - ${new Date().toLocaleDateString()}`
  );
  next();
});
// ============================================
// RUTAS
// ============================================


//Ruta de prueba probar que el servidor funciona
app.get("/", (req, res) => {
  res.json({
    succes: true,
    message: "🚀 Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});
// Ruta de health check - Verificar estado del servidor y BD
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    
    res.json({
        success: true,
        server: 'online',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// IMPORTAR RUTAS
// ============================================ 
const authRoutes = require('./src/routes/authRoutes.js')
const employeeRoutes = require('./src/routes/employeeRoutes.js'); 
const userRoutes = require('./src/routes/userRoutes.js'); // 👈 AGREGAR ESTA LÍNEA
const catalogRoutes = require('./src/routes/catalogRoutes.js');
const nominaRoutes = require('./src/routes/nominaRoutes.js');

// Usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalogs', catalogRoutes); 
app.use('/api/nomina', nominaRoutes);

//manejo de rutas no encotradas
app.use((req, res) => {
  res.status(404).json({
    succes: false,
    message: "❌ Ruta no encontrada",
  });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
  
  try {
    console.log("🔌 Probando conexión a la base de datos...");
    const dbConnected = await testConnection();
    console.log("📧 Probando conexión al servidor de email...");
    await verifyConnection();
    if (!dbConnected)
    console.error("⚠️  Advertencia: No se pudo conectar a la base de datos");
    console.log("📝 Verifica tu archivo .env y que MySQL esté corriendo");

    if (dbConnected) {
      console.log("🛠️  Verificando migraciones mínimas de base de datos...");
      await ensureEmployeeSalaryColumn();
      await ensureDefaultDepartments();
      await ensurePayrollSupportTables();
    }

    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(50));
      console.log("🚀 SERVIDOR INICIADO EXITOSAMENTE");
      console.log("=".repeat(50));
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
      console.log("=".repeat(50) + "\n");
      console.log("💡 Presiona Ctrl+C para detener el servidor\n");
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message);
    process.exit(1); // Salir si hay error crítico
  }
};

startServer()


// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================

// Cerrar correctamente cuando se detiene el servidor
process.on('SIGTERM', () => {
    console.log('\n🛑 Señal SIGTERM recibida. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Señal SIGINT recibida. Cerrando servidor...');
    process.exit(0);
});


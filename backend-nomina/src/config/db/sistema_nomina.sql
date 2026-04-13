CREATE DATABASE IF NOT EXISTS sistema_nomina;
USE sistema_nomina;

-- =====================
-- TABLAS PRINCIPALES
-- =====================

CREATE TABLE cargos (
  id_cargo INT AUTO_INCREMENT PRIMARY KEY,
  nombre_cargo VARCHAR(100) NOT NULL
);

CREATE TABLE departamentos (
  id_departamento INT AUTO_INCREMENT PRIMARY KEY,
  nombre_departamento VARCHAR(100) NOT NULL
);

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol ENUM('ADMINISTRADOR','RRHH','EMPLEADO') NOT NULL
);

-- =====================
-- EMPLEADOS
-- =====================

CREATE TABLE empleados (
  id_empleado INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  tipo_identificacion ENUM('CC','TI','CE','PASAPORTE') NOT NULL,
  numero_identificacion VARCHAR(50) UNIQUE NOT NULL,
  sueldo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fecha_nacimiento DATE NOT NULL,
  fecha_ingreso DATE NOT NULL,
  id_cargo INT,
  id_departamento INT,
  FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo),
  FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento)
);

-- =====================
-- USUARIOS
-- =====================

CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  activo TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  id_empleado INT,
  id_rol INT NOT NULL,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- =====================
-- NOMINA
-- =====================

CREATE TABLE nomina (
  id_nomina INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_corte DATE NOT NULL,
  tipo_pago ENUM('QUINCENAL','MENSUAL') NOT NULL,
  total_devengado DECIMAL(12,2) DEFAULT 0.00,
  total_deducciones DECIMAL(12,2) DEFAULT 0.00,
  total_pagar DECIMAL(12,2) GENERATED ALWAYS AS (total_devengado - total_deducciones) STORED,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

CREATE TABLE detalle_nomina (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_nomina INT,
  concepto VARCHAR(100),
  valor DECIMAL(12,2),
  FOREIGN KEY (id_nomina) REFERENCES nomina(id_nomina)
);

CREATE TABLE horas_extra_nomina (
  id_hora_extra INT AUTO_INCREMENT PRIMARY KEY,
  id_nomina INT NOT NULL,
  tipo_hora ENUM(
    'EXTRA_DIURNA',
    'EXTRA_NOCTURNA',
    'EXTRA_DIURNA_DOMINICAL_FESTIVO',
    'EXTRA_NOCTURNA_DOMINICAL_FESTIVO'
  ) NOT NULL,
  porcentaje_recargo DECIMAL(5,2) NOT NULL,
  horas DECIMAL(8,2) NOT NULL,
  valor_hora_base DECIMAL(12,2) NOT NULL,
  valor_hora_extra DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_nomina) REFERENCES nomina(id_nomina) ON DELETE CASCADE
);

-- =====================
-- VACACIONES
-- =====================

CREATE TABLE vacaciones_saldos (
  id_saldo INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  periodo_anio INT NOT NULL,
  dias_ganados DECIMAL(5,2) DEFAULT 0.00,
  dias_disfrutados DECIMAL(5,2) DEFAULT 0.00,
  dias_pendientes DECIMAL(5,2) DEFAULT 0.00,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (id_empleado, periodo_anio),
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

-- =====================
-- SOLICITUDES
-- =====================

CREATE TABLE solicitudes_laborales (
  id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  tipo ENUM('VACACIONES','PERMISO','INCAPACIDAD','LICENCIA') NOT NULL,
  sub_tipo VARCHAR(50),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_solicitados DECIMAL(5,2),
  horas_solicitadas DECIMAL(5,2),
  es_remunerado TINYINT(1) DEFAULT 1,
  porcentaje_pago DECIMAL(5,2) DEFAULT 100,
  origen_novedad ENUM('COMUN','LABORAL'),
  estado ENUM('PENDIENTE','APROBADA','RECHAZADA','CANCELADA') DEFAULT 'PENDIENTE',
  comentario_empleado TEXT,
  comentario_aprobador TEXT,
  documento_soporte VARCHAR(255),
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP NULL,
  aprobado_por INT,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
  FOREIGN KEY (aprobado_por) REFERENCES usuarios(id_usuario)
);

-- =====================
-- REPORTES
-- =====================

CREATE TABLE reporte_nomina_mensual (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY,
  anio SMALLINT NOT NULL,
  mes TINYINT NOT NULL,
  total_nominas INT DEFAULT 0,
  total_devengado DECIMAL(14,2) DEFAULT 0.00,
  total_deducciones DECIMAL(14,2) DEFAULT 0.00,
  total_pagado DECIMAL(14,2) DEFAULT 0.00,
  total_horas_extra DECIMAL(12,2) DEFAULT 0.00,
  valor_horas_extra DECIMAL(14,2) DEFAULT 0.00,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (anio, mes)
);

-- =====================
-- TOKENS
-- =====================

CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expira_en DATETIME NOT NULL,
  usado TINYINT(1) DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- =====================
-- INSERTS
-- =====================

INSERT INTO cargos (nombre_cargo) VALUES
('Analista'),('Desarrollador'),('Soporte Técnico'),('Gerente'),('Asistente');

INSERT INTO roles (nombre_rol) VALUES
('ADMINISTRADOR'),('RRHH'),('EMPLEADO');


-- =====================
-- CARGOS
-- =====================
INSERT INTO cargos (id_cargo, nombre_cargo) VALUES
(1, 'Analista'),
(2, 'Desarrollador'),
(3, 'Soporte Técnico'),
(4, 'Gerente'),
(5, 'Asistente');

-- =====================
-- DEPARTAMENTOS
-- =====================
INSERT INTO departamentos (id_departamento, nombre_departamento) VALUES
(1, 'Gerencia General'),
(2, 'Administración'),
(3, 'Recursos Humanos'),
(4, 'Finanzas'),
(5, 'Recursos Humanos (Gestión Humana)'),
(6, 'Contabilidad'),
(7, 'Tesorería'),
(8, 'Compras'),
(9, 'Ventas'),
(10, 'Comercial'),
(11, 'Mercadeo (Marketing)'),
(12, 'Servicio al Cliente'),
(13, 'Operaciones'),
(14, 'Producción'),
(15, 'Logística'),
(16, 'Almacén / Bodega'),
(17, 'Tecnología de la Información (TI / Sistemas)'),
(18, 'Desarrollo de Software'),
(19, 'Infraestructura Tecnológica'),
(20, 'Seguridad de la Información'),
(21, 'Calidad'),
(22, 'Auditoría Interna'),
(23, 'Jurídica / Legal'),
(24, 'Planeación / Estrategia'),
(25, 'Investigación y Desarrollo (I+D)'),
(26, 'Mantenimiento'),
(27, 'Seguridad Física'),
(28, 'SST (Seguridad y Salud en el Trabajo)'),
(29, 'Proyectos (PMO)'),
(30, 'Ingeniería'),
(31, 'Diseño'),
(32, 'Operaciones de Campo'),
(33, 'Call Center'),
(34, 'Soporte Técnico'),
(35, 'Relaciones Públicas'),
(36, 'Comercio Exterior'),
(37, 'Abastecimiento'),
(38, 'Gestión Documental'),
(39, 'Capacitación'),
(40, 'Innovación'),
(41, 'Experiencia de Usuario (UX/UI)');

-- =====================
-- ROLES
-- =====================
INSERT INTO roles (id_rol, nombre_rol) VALUES
(1, 'ADMINISTRADOR'),
(2, 'RRHH'),
(3, 'EMPLEADO');

-- =====================
-- EMPLEADOS
-- =====================
INSERT INTO empleados 
(id_empleado, nombres, apellidos, tipo_identificacion, numero_identificacion, sueldo, fecha_nacimiento, fecha_ingreso, id_cargo, id_departamento) 
VALUES
(2, 'Daniel', 'Perez Rojas', 'CC', '1090273907', 2100000.00, '2006-08-10', '2024-11-18', 2, 3),
(3, 'Karolin Xiomara', 'Árevalo Vergel', 'CC', '1072646023', 2500000.00, '2006-01-03', '2026-04-06', 1, 21);

-- =====================
-- USUARIOS
-- =====================
INSERT INTO usuarios 
(id_usuario, username, password, email, activo, id_empleado, id_rol) 
VALUES
(3, 'danipier', '$2b$10$12rw/TV8HII3u6E8C0UY1.tE61LxXIOpjyo3y8XU2zYL9xAEN6aZG', 'danipier768@gmail.com', 1, 2, 1),
(5, 'karolinxio', '$2b$10$SgQ.l2N0LMKldoc7Qog0EepvJsPFk/Mc8OzNMEQXYsovpXeJr6.ae', 'xiomaraarevalo2006@gmail.com', 1, 3, 3);

-- =====================
-- NOMINA
-- =====================
INSERT INTO nomina 
(id_nomina, id_empleado, fecha_inicio, fecha_corte, tipo_pago, total_devengado, total_deducciones) 
VALUES
(1, 2, '2026-01-01', '2026-01-15', 'QUINCENAL', 1200000.00, 200000.00),
(2, 3, '2026-04-01', '2026-04-15', 'MENSUAL', 1499095.00, 100000.00);

-- =====================
-- DETALLE NOMINA
-- =====================
INSERT INTO detalle_nomina (id_detalle, id_nomina, concepto, valor) VALUES
(1, 2, 'Pago base (15 días)', 1250000.00),
(2, 2, 'Subsidio de transporte', 249095.00),
(3, 2, 'Salud 4%', 50000.00),
(4, 2, 'Pensión 4%', 50000.00);

-- =====================
-- HORAS EXTRA
-- =====================
INSERT INTO horas_extra_nomina 
(id_hora_extra, id_nomina, tipo_hora, porcentaje_recargo, horas, valor_hora_base, valor_hora_extra, valor_total) 
VALUES
(1, 1, 'EXTRA_DIURNA', 25.00, 5.00, 10000.00, 12500.00, 62500.00);

-- =====================
-- VACACIONES
-- =====================
INSERT INTO vacaciones_saldos 
(id_saldo, id_empleado, periodo_anio, dias_ganados, dias_disfrutados, dias_pendientes) 
VALUES
(1, 2, 2026, 15.00, 10.00, 5.00),
(2, 3, 2026, 15.00, 0.00, 15.00);

-- =====================
-- SOLICITUDES LABORALES
-- =====================
INSERT INTO solicitudes_laborales 
(id_solicitud, id_empleado, tipo, sub_tipo, fecha_inicio, fecha_fin, dias_solicitados, es_remunerado, porcentaje_pago, estado) 
VALUES
(1, 2, 'VACACIONES', NULL, '2026-02-01', '2026-02-10', 10.00, 1, 100.00, 'APROBADA'),
(2, 3, 'VACACIONES', 'Viaje familiar', '2026-06-16', '2026-06-30', 15.00, 1, 100.00, 'PENDIENTE');

-- =====================
-- REPORTE NOMINA
-- =====================
INSERT INTO reporte_nomina_mensual 
(id_reporte, anio, mes, total_nominas, total_devengado, total_deducciones, total_pagado) 
VALUES
(1, 2026, 4, 1, 1499095.00, 100000.00, 1399095.00);

-- =====================
-- TOKENS
-- =====================
INSERT INTO password_reset_tokens 
(id, id_usuario, token, expira_en, usado) 
VALUES
(1, 3, '220106', '2026-04-09 19:30:31', 1);
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-02-2026 a las 04:57:02
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema_nomina`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cargos`
--

CREATE database sistema_nomina;

CREATE TABLE `cargos` (
  `id_cargo` int(11) NOT NULL,
  `nombre_cargo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cargos`
--

INSERT INTO `cargos` (`id_cargo`, `nombre_cargo`) VALUES
(1, 'Analista'),
(2, 'Desarrollador'),
(3, 'Soporte Técnico'),
(4, 'Gerente'),
(5, 'Asistente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamentos`
--

CREATE TABLE `departamentos` (
  `id_departamento` int(11) NOT NULL,
  `nombre_departamento` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `departamentos`
--

INSERT INTO `departamentos` (`id_departamento`, `nombre_departamento`) VALUES
(1, 'Gerencia General'),
(2, 'Administración'),
(3, 'Recursos Humanos (Gestión Humana)'),
(4, 'Finanzas'),
(5, 'Contabilidad'),
(6, 'Tesorería'),
(7, 'Compras'),
(8, 'Ventas'),
(9, 'Comercial'),
(10, 'Mercadeo (Marketing)'),
(11, 'Servicio al Cliente'),
(12, 'Operaciones'),
(13, 'Producción'),
(14, 'Logística'),
(15, 'Almacén / Bodega'),
(16, 'Tecnología de la Información (TI / Sistemas)'),
(17, 'Desarrollo de Software'),
(18, 'Infraestructura Tecnológica'),
(19, 'Seguridad de la Información'),
(20, 'Calidad'),
(21, 'Auditoría Interna'),
(22, 'Jurídica / Legal'),
(23, 'Planeación / Estrategia'),
(24, 'Investigación y Desarrollo (I+D)'),
(25, 'Mantenimiento'),
(26, 'Seguridad Física'),
(27, 'SST (Seguridad y Salud en el Trabajo)'),
(28, 'Proyectos (PMO)'),
(29, 'Ingeniería'),
(30, 'Diseño'),
(31, 'Operaciones de Campo'),
(32, 'Call Center'),
(33, 'Soporte Técnico'),
(34, 'Relaciones Públicas'),
(35, 'Comercio Exterior'),
(36, 'Abastecimiento'),
(37, 'Gestión Documental'),
(38, 'Capacitación'),
(39, 'Innovación'),
(40, 'Experiencia de Usuario (UX/UI)');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_nomina`
--

CREATE TABLE `detalle_nomina` (
  `id_detalle` int(11) NOT NULL,
  `id_nomina` int(11) NOT NULL,
  `concepto` varchar(100) NOT NULL,
  `valor` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `id_empleado` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `tipo_identificacion` enum('CC','TI','CE','PASAPORTE') NOT NULL,
  `numero_identificacion` varchar(50) NOT NULL,
  `sueldo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fecha_nacimiento` date NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `id_cargo` int(11) NOT NULL,
  `id_departamento` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`id_empleado`, `nombres`, `apellidos`, `tipo_identificacion`, `numero_identificacion`, `sueldo`, `fecha_nacimiento`, `fecha_ingreso`, `id_cargo`, `id_departamento`) VALUES
(5, 'xiomara', 'arverja', 'CC', '12345678', 1600000.00, '2025-11-12', '2025-11-12', 1, 1),
(6, 'Daniel', 'Perez Rojas', 'CC', '1090273907', 2100000.00, '2006-08-10', '2024-11-18', 2, 3),
(7, 'Daniel', 'Pereezz ROjas', 'CC', '1023205511', 1950000.00, '2004-06-10', '2024-01-02', 2, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nomina`
--

CREATE TABLE `nomina` (
  `id_nomina` int(11) NOT NULL,
  `id_empleado` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_corte` date NOT NULL,
  `tipo_pago` enum('QUINCENAL','MENSUAL') NOT NULL,
  `total_devengado` decimal(12,2) DEFAULT 0.00,
  `total_deducciones` decimal(12,2) DEFAULT 0.00,
  `total_pagar` decimal(12,2) GENERATED ALWAYS AS (`total_devengado` - `total_deducciones`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horas_extra_nomina`
--

CREATE TABLE `horas_extra_nomina` (
  `id_hora_extra` int(11) NOT NULL AUTO_INCREMENT,
  `id_nomina` int(11) NOT NULL,
  `tipo_hora` enum('EXTRA_DIURNA','EXTRA_NOCTURNA','EXTRA_DIURNA_DOMINICAL_FESTIVO','EXTRA_NOCTURNA_DOMINICAL_FESTIVO') NOT NULL,
  `porcentaje_recargo` decimal(5,2) NOT NULL,
  `horas` decimal(8,2) NOT NULL,
  `valor_hora_base` decimal(12,2) NOT NULL,
  `valor_hora_extra` decimal(12,2) NOT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_hora_extra`),
  KEY `idx_horas_extra_nomina_nomina` (`id_nomina`),
  CONSTRAINT `fk_horas_extra_nomina_nomina` FOREIGN KEY (`id_nomina`) REFERENCES `nomina` (`id_nomina`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reporte_nomina_mensual`
--

CREATE TABLE `reporte_nomina_mensual` (
  `id_reporte` int(11) NOT NULL AUTO_INCREMENT,
  `anio` smallint(6) NOT NULL,
  `mes` tinyint(4) NOT NULL,
  `total_nominas` int(11) NOT NULL DEFAULT 0,
  `total_devengado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_deducciones` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_pagado` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_horas_extra` decimal(12,2) NOT NULL DEFAULT 0.00,
  `valor_horas_extra` decimal(14,2) NOT NULL DEFAULT 0.00,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_reporte`),
  UNIQUE KEY `uk_reporte_nomina_periodo` (`anio`,`mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expira_en` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `id_usuario`, `token`, `expira_en`, `usado`, `creado_en`) VALUES
(10, 12, '654120', '2026-01-22 13:48:56', 0, '2026-01-22 18:18:56'),
(11, 12, '845534', '2026-01-22 14:05:28', 0, '2026-01-22 18:35:28'),
(12, 12, '298336', '2026-01-22 14:06:49', 1, '2026-01-22 18:36:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` enum('ADMINISTRADOR','RRHH','EMPLEADO') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'ADMINISTRADOR'),
(2, 'RRHH'),
(3, 'EMPLEADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_empleado` int(11) DEFAULT NULL,
  `id_rol` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `username`, `password`, `email`, `activo`, `creado_en`, `actualizado_en`, `id_empleado`, `id_rol`) VALUES
(7, 'admin', '$2b$10$mIJH40NkF/ER9nqewCU3ue1EtEgeTMRVmkBbqM5cLifDjkm3gqSya', 'admin@sistema.com', 1, '2025-11-18 16:40:58', '2025-11-18 16:40:58', NULL, 1),
(12, 'damx.10pr', '$2b$10$OqCalcBgIAEyuAPGb44p4Oh.O5f5uMcC6u1GRHr2VrTOfKbvutD.e', 'danielmauricioperezrojas@gmail.com', 1, '2026-01-22 18:18:23', '2026-01-22 18:37:31', 6, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cargos`
--
ALTER TABLE `cargos`
  ADD PRIMARY KEY (`id_cargo`);

--
-- Indices de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id_departamento`);

--
-- Indices de la tabla `detalle_nomina`
--
ALTER TABLE `detalle_nomina`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `idx_detalle_nomina` (`id_nomina`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id_empleado`),
  ADD UNIQUE KEY `numero_identificacion` (`numero_identificacion`),
  ADD KEY `idx_empleado_cargo` (`id_cargo`),
  ADD KEY `idx_empleado_departamento` (`id_departamento`);

--
-- Indices de la tabla `nomina`
--
ALTER TABLE `nomina`
  ADD PRIMARY KEY (`id_nomina`),
  ADD KEY `idx_nomina_empleado` (`id_empleado`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_usuario` (`id_usuario`),
  ADD KEY `idx_expira` (`expira_en`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_empleado` (`id_empleado`),
  ADD KEY `idx_usuario_rol` (`id_rol`),
  ADD KEY `idx_usuarios_email` (`email`),
  ADD KEY `idx_usuarios_username` (`username`),
  ADD KEY `idx_usuarios_activo` (`activo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cargos`
--
ALTER TABLE `cargos`
  MODIFY `id_cargo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id_departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `detalle_nomina`
--
ALTER TABLE `detalle_nomina`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id_empleado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `nomina`
--
ALTER TABLE `nomina`
  MODIFY `id_nomina` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_nomina`
--
ALTER TABLE `detalle_nomina`
  ADD CONSTRAINT `detalle_nomina_ibfk_1` FOREIGN KEY (`id_nomina`) REFERENCES `nomina` (`id_nomina`);

--
-- Filtros para la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`id_cargo`) REFERENCES `cargos` (`id_cargo`),
  ADD CONSTRAINT `empleados_ibfk_2` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`);

--
-- Filtros para la tabla `nomina`
--
ALTER TABLE `nomina`
  ADD CONSTRAINT `nomina_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`);

--
-- Filtros para la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`),
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

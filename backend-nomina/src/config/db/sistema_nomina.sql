-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-04-2026 a las 02:49:53
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
CREATE DATABASE sistema_nomina;
use sistema_nomina;
--
-- Estructura de tabla para la tabla `cargos`
--

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_nomina`
--

CREATE TABLE `detalle_nomina` (
  `id_detalle` int(11) NOT NULL,
  `id_nomina` int(11) DEFAULT NULL,
  `concepto` varchar(100) DEFAULT NULL,
  `valor` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_nomina`
--

INSERT INTO `detalle_nomina` (`id_detalle`, `id_nomina`, `concepto`, `valor`) VALUES
(1, 3, 'Pago base (30 días)', 2500000.00),
(2, 3, 'Subsidio de transporte', 249095.00),
(3, 3, 'Salud 4%', 100000.00),
(4, 3, 'Pensión 4%', 100000.00);

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
  `id_cargo` int(11) DEFAULT NULL,
  `id_departamento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`id_empleado`, `nombres`, `apellidos`, `tipo_identificacion`, `numero_identificacion`, `sueldo`, `fecha_nacimiento`, `fecha_ingreso`, `id_cargo`, `id_departamento`) VALUES
(1, 'Daniel', 'Perez Rojas', 'CC', '1090273907', 2100000.00, '2006-08-10', '2024-11-18', 2, 3),
(2, 'Karolin Xiomara', 'Árevalo Vergel', 'CC', '1072646023', 2500000.00, '2006-01-03', '2026-04-06', 1, 21);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horas_extra_nomina`
--

CREATE TABLE `horas_extra_nomina` (
  `id_hora_extra` int(11) NOT NULL,
  `id_nomina` int(11) NOT NULL,
  `tipo_hora` enum('EXTRA_DIURNA','EXTRA_NOCTURNA','EXTRA_DIURNA_DOMINICAL_FESTIVO','EXTRA_NOCTURNA_DOMINICAL_FESTIVO') NOT NULL,
  `porcentaje_recargo` decimal(5,2) NOT NULL,
  `horas` decimal(8,2) NOT NULL,
  `valor_hora_base` decimal(12,2) NOT NULL,
  `valor_hora_extra` decimal(12,2) NOT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

--
-- Volcado de datos para la tabla `nomina`
--

INSERT INTO `nomina` (`id_nomina`, `id_empleado`, `fecha_inicio`, `fecha_corte`, `tipo_pago`, `total_devengado`, `total_deducciones`) VALUES
(3, 2, '2026-04-01', '2026-04-30', 'MENSUAL', 2749095.00, 200000.00);

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
(1, 4, '183238', '2026-04-10 19:57:34', 1, '2026-04-11 00:47:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reporte_nomina_mensual`
--

CREATE TABLE `reporte_nomina_mensual` (
  `id_reporte` int(11) NOT NULL,
  `anio` smallint(6) NOT NULL,
  `mes` tinyint(4) NOT NULL,
  `total_nominas` int(11) DEFAULT 0,
  `total_devengado` decimal(14,2) DEFAULT 0.00,
  `total_deducciones` decimal(14,2) DEFAULT 0.00,
  `total_pagado` decimal(14,2) DEFAULT 0.00,
  `total_horas_extra` decimal(12,2) DEFAULT 0.00,
  `valor_horas_extra` decimal(14,2) DEFAULT 0.00,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reporte_nomina_mensual`
--

INSERT INTO `reporte_nomina_mensual` (`id_reporte`, `anio`, `mes`, `total_nominas`, `total_devengado`, `total_deducciones`, `total_pagado`, `total_horas_extra`, `valor_horas_extra`, `actualizado_en`) VALUES
(1, 2026, 4, 1, 2749095.00, 200000.00, 2549095.00, 0.00, 0.00, '2026-04-11 00:46:48');

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
-- Estructura de tabla para la tabla `solicitudes_laborales`
--

CREATE TABLE `solicitudes_laborales` (
  `id_solicitud` int(11) NOT NULL,
  `id_empleado` int(11) NOT NULL,
  `tipo` enum('VACACIONES','PERMISO','INCAPACIDAD','LICENCIA') NOT NULL,
  `sub_tipo` varchar(50) DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `dias_solicitados` decimal(5,2) DEFAULT NULL,
  `horas_solicitadas` decimal(5,2) DEFAULT NULL,
  `es_remunerado` tinyint(1) DEFAULT 1,
  `porcentaje_pago` decimal(5,2) DEFAULT 100.00,
  `origen_novedad` enum('COMUN','LABORAL') DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADA','RECHAZADA','CANCELADA') DEFAULT 'PENDIENTE',
  `comentario_empleado` text DEFAULT NULL,
  `comentario_aprobador` text DEFAULT NULL,
  `documento_soporte` varchar(255) DEFAULT NULL,
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_respuesta` timestamp NULL DEFAULT NULL,
  `aprobado_por` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitudes_laborales`
--

INSERT INTO `solicitudes_laborales` (`id_solicitud`, `id_empleado`, `tipo`, `sub_tipo`, `fecha_inicio`, `fecha_fin`, `dias_solicitados`, `horas_solicitadas`, `es_remunerado`, `porcentaje_pago`, `origen_novedad`, `estado`, `comentario_empleado`, `comentario_aprobador`, `documento_soporte`, `fecha_solicitud`, `fecha_respuesta`, `aprobado_por`) VALUES
(1, 1, 'VACACIONES', NULL, '2026-02-01', '2026-02-10', 10.00, NULL, 1, 100.00, NULL, 'APROBADA', NULL, NULL, NULL, '2026-04-11 00:45:08', NULL, NULL),
(2, 2, 'VACACIONES', 'Viaje familiar', '2026-06-16', '2026-06-30', 15.00, NULL, 1, 100.00, NULL, 'PENDIENTE', NULL, NULL, NULL, '2026-04-11 00:45:08', NULL, NULL);

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
(3, 'danipier', '$2b$10$12rw/TV8HII3u6E8C0UY1.tE61LxXIOpjyo3y8XU2zYL9xAEN6aZG', 'danipier768@gmail.com', 1, '2026-04-11 00:43:23', '2026-04-11 00:43:23', 1, 1),
(4, 'karolinxio', '$2b$10$hdytPviFCsJu93UWUwFQE.ExkFePzpS/mgF4VQZ1tvUKRe6c3BHla', 'xiomaraarevalo2006@gmail.com', 1, '2026-04-11 00:43:23', '2026-04-11 00:48:36', 2, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vacaciones_saldos`
--

CREATE TABLE `vacaciones_saldos` (
  `id_saldo` int(11) NOT NULL,
  `id_empleado` int(11) NOT NULL,
  `periodo_anio` int(11) NOT NULL,
  `dias_ganados` decimal(5,2) DEFAULT 0.00,
  `dias_disfrutados` decimal(5,2) DEFAULT 0.00,
  `dias_pendientes` decimal(5,2) DEFAULT 0.00,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `vacaciones_saldos`
--

INSERT INTO `vacaciones_saldos` (`id_saldo`, `id_empleado`, `periodo_anio`, `dias_ganados`, `dias_disfrutados`, `dias_pendientes`, `actualizado_en`) VALUES
(1, 1, 2026, 15.00, 10.00, 5.00, '2026-04-11 00:44:42'),
(2, 2, 2026, 15.00, 0.00, 15.00, '2026-04-11 00:44:42');

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
  ADD KEY `id_nomina` (`id_nomina`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id_empleado`),
  ADD UNIQUE KEY `numero_identificacion` (`numero_identificacion`),
  ADD KEY `id_cargo` (`id_cargo`),
  ADD KEY `id_departamento` (`id_departamento`);

--
-- Indices de la tabla `horas_extra_nomina`
--
ALTER TABLE `horas_extra_nomina`
  ADD PRIMARY KEY (`id_hora_extra`),
  ADD KEY `id_nomina` (`id_nomina`);

--
-- Indices de la tabla `nomina`
--
ALTER TABLE `nomina`
  ADD PRIMARY KEY (`id_nomina`),
  ADD KEY `id_empleado` (`id_empleado`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `reporte_nomina_mensual`
--
ALTER TABLE `reporte_nomina_mensual`
  ADD PRIMARY KEY (`id_reporte`),
  ADD UNIQUE KEY `anio` (`anio`,`mes`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `solicitudes_laborales`
--
ALTER TABLE `solicitudes_laborales`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `id_empleado` (`id_empleado`),
  ADD KEY `aprobado_por` (`aprobado_por`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_empleado` (`id_empleado`),
  ADD KEY `id_rol` (`id_rol`);

--
-- Indices de la tabla `vacaciones_saldos`
--
ALTER TABLE `vacaciones_saldos`
  ADD PRIMARY KEY (`id_saldo`),
  ADD UNIQUE KEY `id_empleado` (`id_empleado`,`periodo_anio`);

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
  MODIFY `id_departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `detalle_nomina`
--
ALTER TABLE `detalle_nomina`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id_empleado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `horas_extra_nomina`
--
ALTER TABLE `horas_extra_nomina`
  MODIFY `id_hora_extra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `nomina`
--
ALTER TABLE `nomina`
  MODIFY `id_nomina` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `reporte_nomina_mensual`
--
ALTER TABLE `reporte_nomina_mensual`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `solicitudes_laborales`
--
ALTER TABLE `solicitudes_laborales`
  MODIFY `id_solicitud` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `vacaciones_saldos`
--
ALTER TABLE `vacaciones_saldos`
  MODIFY `id_saldo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- Filtros para la tabla `horas_extra_nomina`
--
ALTER TABLE `horas_extra_nomina`
  ADD CONSTRAINT `horas_extra_nomina_ibfk_1` FOREIGN KEY (`id_nomina`) REFERENCES `nomina` (`id_nomina`) ON DELETE CASCADE;

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
-- Filtros para la tabla `solicitudes_laborales`
--
ALTER TABLE `solicitudes_laborales`
  ADD CONSTRAINT `solicitudes_laborales_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`),
  ADD CONSTRAINT `solicitudes_laborales_ibfk_2` FOREIGN KEY (`aprobado_por`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`),
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);

--
-- Filtros para la tabla `vacaciones_saldos`
--
ALTER TABLE `vacaciones_saldos`
  ADD CONSTRAINT `vacaciones_saldos_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

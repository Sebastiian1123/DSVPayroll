# Plan de trabajo: Integración de `Reports.jsx` con base de datos y módulos relacionados

## 1) Estado actual del módulo de reportes

### Flujo UI actual
- `Reports.jsx` hace *role-gating* con `useAuth()`:
  - Si `isAdmin()` es `true`, renderiza `AdminReportsDashboard`.
  - Si no, renderiza flujo empleado (`EmployeeReportsList` -> `EmployeeReportDetail` usando estado local `selectedReport`).
- El flujo de detalle en empleado es 100% cliente (sin router interno ni query params), basado en objetos en memoria.

### Hallazgos clave
- Los tres componentes de reportes usan datos *mock* embebidos en arreglos o texto fijo.
- No hay llamadas a `api` dentro de `Reports.jsx`, `AdminReportsDashboard.jsx`, `EmployeeReportsList.jsx` ni `EmployeeReportDetail.jsx`.
- Los botones de acciones clave (descarga PDF, envío email, historial auditoría, procesamiento de nómina) todavía no disparan operaciones reales.
- El `Navbar` no expone un link directo a `/reports` (la ruta existe en `App.jsx`, pero no aparece en navegación principal).

## 2) Conexiones ya existentes que sí pueden reutilizarse

### Frontend
- Existe cliente HTTP central (`frontend/src/services/api.js`) con:
  - `baseURL` unificado.
  - inyección automática de token.
  - manejo centralizado de `401/403`.
- Módulo `Nomina.jsx` ya consume endpoint real `GET /api/nomina/reportes` con filtros (`anio`, `mes`, `id_empleado`) y procesa resumen + tabla.
- Módulo `Directory.jsx` ya persiste nómina real con `POST /api/nomina`.

### Backend
- Ya existen rutas:
  - `GET /api/nomina/reportes` (consulta reportes mensuales con filtros).
  - `POST /api/nomina` (crea una nómina y actualiza agregados mensuales).
- El reporte retorna `resumen` y `nominas`, suficiente para iniciar vista administrativa y listado de empleado en fase 1.

## 3) Brechas para enlazar `Reports` a DB

1. **Modelo de datos UI vs DB no alineado**
   - UI empleado usa `{ id: 'RN-2023-01', month, amount, status }`.
   - DB retorna campos como `id_nomina`, `fecha_corte`, `total_pagar`, `empleado`, etc.
   - Se requiere capa de mapeo (adapter/selector).

2. **Detalle de nómina en reportes**
   - `EmployeeReportDetail` muestra conceptos de ingresos/deducciones fijos.
   - No hay endpoint actual para traer detalle por `id_nomina` (incluyendo `detalle_nomina` y `horas_extra_nomina`).

3. **Control de acceso funcional incompleto**
   - `Reports.jsx` usa `isAdmin()` únicamente. El comentario habla de Admin y RRHH, pero RRHH hoy caería en flujo empleado.
   - Debe migrarse a `isAdminOrRRHH()` para consistencia con negocio.

4. **Navegación/Deep linking**
   - El detalle depende de estado local; al refrescar se pierde.
   - Conviene migrar a rutas `/reports/:idNomina` para persistencia de contexto y compartibilidad.

5. **Acciones de negocio sin backend**
   - PDF, email, auditoría y “procesar nómina” aún sin endpoints conectados.

## 4) Plan de trabajo recomendado (incremental)

## Fase 0 — Hardening técnico (rápida)
- Crear carpeta `frontend/src/services/reportsService.js`.
- Crear utilidades de transformación en `frontend/src/utils/reportsMappers.js`.
- Definir tipos de estado (aunque sea con JSDoc) para evitar “shape drift”.

**Entregable:** infraestructura de consumo/mapeo sin cambiar UX.

## Fase 1 — Datos reales en lista de empleado y dashboard admin
- Reemplazar mocks en `EmployeeReportsList` y `AdminReportsDashboard` por consumo de `GET /api/nomina/reportes`.
- Parametrizar por año/mes/empleado según rol:
  - Empleado: forzar `id_empleado` del usuario autenticado (seguro por backend idealmente).
  - Admin/RRHH: permitir filtros abiertos.
- Incorporar estados `loading`, `empty`, `error` y `retry`.

**Entregable:** reportes visibles desde DB con filtros básicos.

## Fase 2 — Detalle real de nómina
- Backend: agregar endpoint sugerido `GET /api/nomina/:id_nomina` que incluya:
  - cabecera nómina,
  - `detalle_nomina`,
  - `horas_extra_nomina`.
- Frontend: `EmployeeReportDetail` consume endpoint por id y deja de depender del objeto mock.
- Estandarizar fechas/moneda (COP o moneda configurada), evitando valores hardcodeados.

**Entregable:** vista detalle 100% persistida y auditable.

## Fase 3 — Acciones (PDF, email, auditoría)
- PDF:
  - opción A: backend genera PDF y entrega URL/stream.
  - opción B: frontend imprime plantilla, backend solo registra evento.
- Email: endpoint `POST /api/nomina/:id/email`.
- Auditoría: endpoint de eventos `GET /api/auditoria?modulo=nomina`.

**Entregable:** botones del módulo con funcionalidad real y trazabilidad.

## Fase 4 — Integración entre módulos
- Desde `Directory` (cuando guarda nómina) invalidar/refresh de datos en Reports.
- Desde `Nomina` reutilizar los mismos mappers de reportes para evitar duplicidad.
- Agregar navegación cruzada:
  - `Nomina -> Ver detalle en Reports`
  - `Reports Admin -> Abrir Directory` para reprocesos.

**Entregable:** ecosistema de nómina coherente entre pantallas.

## 5) Backlog técnico priorizado

### Prioridad alta (semana 1)
1. Ajustar rol en `Reports.jsx` a Admin/RRHH.
2. Introducir `reportsService` + mappers.
3. Cargar lista de reportes de empleado desde `GET /nomina/reportes`.
4. Cargar resumen admin desde `GET /nomina/reportes`.

### Prioridad media (semana 2)
5. Endpoint `GET /nomina/:id` + detalle real.
6. Migrar a rutas con parámetro (`/reports/:idNomina`).
7. Manejo UX de errores/estados vacíos y skeletons.

### Prioridad media-baja (semana 3)
8. PDF y email.
9. Auditoría de acciones de usuario.
10. Pruebas E2E de flujo completo (Directory -> Nomina -> Reports).

## 6) Riesgos y mitigaciones
- **Riesgo:** desalineación de roles frontend/backend.
  - **Mitigación:** validación de permisos también en backend para cada endpoint.
- **Riesgo:** inconsistencias de moneda/fechas entre módulos.
  - **Mitigación:** helper único de formateo y timezone explícito.
- **Riesgo:** doble lógica de negocio (Nomina vs Reports).
  - **Mitigación:** centralizar transformaciones en mappers compartidos.

## 7) Definición de listo (DoR) para iniciar implementación
- Confirmar si `Reports` será vista de “recibos personales” o “reportería global” (o ambas, por rol).
- Acordar formato final de detalle de nómina (campos obligatorios).
- Acordar estrategia de PDF (servidor vs cliente).
- Confirmar reglas de acceso RRHH y si puede ver detalle de cualquier empleado.

## 8) Definición de hecho (DoD) sugerida
- Sin mocks en componentes de reportes.
- Todas las acciones principales conectadas a backend o deshabilitadas explícitamente.
- Cobertura mínima:
  - tests unitarios de mappers,
  - test de integración de servicio,
  - test E2E del flujo empleado.
- Telemetría básica de errores de carga para soporte.

## 9) Nota de mantenimiento reciente
- Se estandarizó el selector anual de `EmployeeReportsList` al rango fijo 2024-2030 para reducir conflictos de merge entre ramas de frontend.
- La inicialización del año seleccionado ahora toma el año actual solo si está dentro del rango permitido.

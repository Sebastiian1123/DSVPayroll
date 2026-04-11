# Plan de implementación: Reportes con datos reales (Administrador)

## 1) Objetivo
Implementar el módulo de **Reportes** para que, desde el usuario **Administrador** (y opcionalmente RRHH), se visualice información **real** de:
- Nómina por empleado y por periodo.
- Totales consolidados por mes/año.
- Datos maestros de empleados (nombre, cargo, departamento, identificación).

El objetivo funcional es eliminar datos mock en la experiencia administrativa y conectar todas las vistas de reportes a la base de datos existente.

---

## 2) Diagnóstico técnico actual (frontend + backend)

## 2.1 Frontend de reportes
- La ruta `/reports` existe y hace role-gating: admin ve flujo administrativo, el resto ve flujo de empleado.【F:frontend/src/features/reports/ReportsPage.jsx†L12-L41】
- `AdminReportsDashboard` y `AdminDetailPayroll` todavía usan datos estáticos/mock (`ADMIN_REPORT_*`, `ADMIN_PAYROLL_*`).【F:frontend/src/features/reports/components/AdminReportsDashboard.jsx†L2-L178】【F:frontend/src/features/reports/components/AdminDetailPayroll.jsx†L2-L167】【F:frontend/src/features/reports/data/adminReportsData.js†L1-L20】【F:frontend/src/features/reports/data/adminDetailPayrollData.js†L1-L86】
- El flujo de empleado **sí** consume backend con `GET /nomina/reportes` filtrando por `id_empleado` y año.【F:frontend/src/features/reports/components/EmployeeReportsList.jsx†L27-L47】
- El detalle de empleado descarga PDF real (`GET /nomina/:id_nomina/pdf`), pero el contenido visual del detalle en pantalla sigue mayormente hardcodeado en arreglos/labels locales.【F:frontend/src/features/reports/components/EmployeeReportDetail.jsx†L13-L192】

## 2.2 Backend de nómina/reportes
- Existe endpoint `GET /api/nomina/reportes` con filtros: `anio`, `mes`, `id_empleado`; devuelve `resumen` y `nominas`.
  Este endpoint ya soporta la base para dashboard admin y listado por empleado.【F:backend-nomina/src/modules/payroll/payroll.controller.js†L244-L317】
- Existe endpoint `GET /api/nomina/:id_nomina/pdf` para desprendible PDF real por nómina.【F:backend-nomina/src/modules/payroll/payroll.routes.js†L14-L17】【F:backend-nomina/src/modules/payroll/payroll.controller.js†L324-L380】
- Las rutas de nómina están protegidas con token, pero `/reportes` y `/:id_nomina/pdf` no exigen rol administrativo explícito en rutas (solo autenticación).【F:backend-nomina/src/modules/payroll/payroll.routes.js†L11-L17】
- El middleware de roles existe (`verifyAdmin`, `verifyAdminORRRHH`) y puede aplicarse para endurecer autorización de reportes administrativos.【F:backend-nomina/src/middleware/authMiddleware.js†L80-L116】

## 2.3 Modelo de datos disponible
Tablas clave ya listas para reportes reales:
- `empleados` (nombres, apellidos, sueldo, cargo, departamento, identificación).【F:backend-nomina/src/config/db/sistema_nomina.sql†L27-L40】
- `usuarios` vinculado a `empleados` y `roles`.
- `nomina` (periodo, totales devengado/deducciones/pagar).【F:backend-nomina/src/config/db/sistema_nomina.sql†L64-L74】
- `detalle_nomina` (conceptos).【F:backend-nomina/src/config/db/sistema_nomina.sql†L76-L82】
- `horas_extra_nomina` (tipos de hora, recargos, valores).【F:backend-nomina/src/config/db/sistema_nomina.sql†L84-L98】
- `reporte_nomina_mensual` (agregados mensuales por año/mes).【F:backend-nomina/src/config/db/sistema_nomina.sql†L149-L161】

---

## 3) Brechas para “reportes admin con datos reales”

1. **UI administrativa desacoplada del backend**
   - Actualmente muestra años/meses/empleados simulados.

2. **Sin endpoint de detalle administrativo completo**
   - `GET /nomina/reportes` trae cabecera de nómina, pero no desglose de conceptos/horas extra por cada registro.

3. **Autorización insuficiente para vistas sensibles**
   - Si no se controla en backend, un empleado podría consultar datos fuera de su alcance manipulando query params.

4. **Contratos de datos frontend heterogéneos**
   - El flujo empleado mapea un formato; el admin usa otro mock. Falta contrato unificado (`ReportSummary`, `PayrollRow`, `PayrollDetail`).

5. **Acciones de exportación en admin sin integración real**
   - Botones “Excel/PDF” en admin no ejecutan procesos reales.

---

## 4) Plan de implementación por fases

## Fase 1 (alta prioridad): API real para dashboard y tabla admin

### Backend
1. Crear/ajustar endpoint para panel admin:
   - **Opción A (recomendada):** extender `GET /api/nomina/reportes` para retornar metadatos del periodo y agregados útiles para admin.
   - **Opción B:** crear `GET /api/nomina/reportes/admin`.

2. Forzar reglas de acceso:
   - `ADMINISTRADOR` y `RRHH` pueden consultar global.
   - `EMPLEADO` solo su `id_empleado` del token (ignorar o validar query).

3. Incluir en cada fila admin:
   - `id_nomina`, `id_empleado`, `empleado`, `cargo`, `departamento`, `fecha_inicio`, `fecha_corte`, `tipo_pago`,
   - `total_devengado`, `total_deducciones`, `total_pagar`,
   - agregados de horas extra por tipo (`heo`, `hef`, `hen`, `hefn`) derivados de `horas_extra_nomina`.

### Frontend
1. Crear `reportsService` para consultas de reportes admin/empleado.
2. Sustituir `adminReportsData.js` y `adminDetailPayrollData.js` por consumo real.
3. Mantener filtros actuales (año, mes, búsqueda, departamento) pero basados en respuesta API.
4. Implementar estados `loading`, `empty`, `error`, `retry` en componentes admin.

**Criterio de salida Fase 1:**
- Admin entra a `/reports` y ve periodos/totales/tabla con datos reales de DB.

---

## Fase 2 (alta prioridad): detalle real por nómina en reportes

### Backend
1. Crear `GET /api/nomina/:id_nomina` (JSON) con:
   - cabecera de nómina + datos de empleado,
   - `detalle_nomina`,
   - `horas_extra_nomina`,
   - resumen calculado (bruto/deducciones/neto).

2. Regla de acceso:
   - Admin/RRHH: cualquier nómina.
   - Empleado: solo nóminas de su propio `id_empleado`.

### Frontend
1. `EmployeeReportDetail` y futuro `AdminPayrollDetail` deben consumir este endpoint.
2. Eliminar textos hardcodeados de ingresos/deducciones y renderizar conceptos reales.

**Criterio de salida Fase 2:**
- El detalle presentado en pantalla coincide con PDF y con base de datos.

---

## Fase 3 (media): exportaciones administrativas reales

1. **PDF consolidado admin** (`GET /api/nomina/reportes/export/pdf?anio=&mes=`).
2. **Excel admin** (`GET /api/nomina/reportes/export/xlsx?anio=&mes=`).
3. Registrar auditoría de exportaciones (usuario, fecha, filtros aplicados).

**Criterio de salida Fase 3:**
- Botones “Exportar Excel” y “PDF” del admin operativos con archivo real.

---

## Fase 4 (media): hardening, performance y calidad

1. Índices sugeridos:
   - `nomina(id_empleado, fecha_corte)`,
   - `nomina(fecha_corte)`,
   - `horas_extra_nomina(id_nomina)`.
2. Paginación server-side para tablas administrativas.
3. Pruebas:
   - Unitarias (mappers/formatters),
   - Integración API (roles y filtros),
   - E2E rol admin y rol empleado.

---

## 5) Contratos de datos recomendados

## 5.1 `GET /api/nomina/reportes` (admin)
```json
{
  "success": true,
  "data": {
    "filtros": { "anio": 2026, "mes": 3, "id_empleado": null },
    "resumen": {
      "totalNominas": 125,
      "totalDevengado": 430000000,
      "totalDeducciones": 71000000,
      "totalPagado": 359000000
    },
    "nominas": [
      {
        "id_nomina": 901,
        "id_empleado": 45,
        "empleado": "Nombre Apellido",
        "cargo": "Analista",
        "departamento": "Finanzas",
        "fecha_inicio": "2026-03-01",
        "fecha_corte": "2026-03-31",
        "tipo_pago": "MENSUAL",
        "total_devengado": 4200000,
        "total_deducciones": 420000,
        "total_pagar": 3780000,
        "heo": 4,
        "hef": 2,
        "hen": 0,
        "hefn": 0
      }
    ]
  }
}
```

## 5.2 `GET /api/nomina/:id_nomina` (detalle)
```json
{
  "success": true,
  "data": {
    "nomina": { "id_nomina": 901, "id_empleado": 45, "total_pagar": 3780000 },
    "empleado": { "nombres": "Nombre", "apellidos": "Apellido", "cargo": "Analista", "departamento": "Finanzas" },
    "detalle_nomina": [
      { "concepto": "Pago base (30 días)", "valor": 4000000 },
      { "concepto": "Salud 4%", "valor": 160000 }
    ],
    "horas_extra": [
      { "tipo_hora": "EXTRA_DIURNA", "horas": 4, "valor_total": 98000 }
    ],
    "resumen": { "total_devengado": 4200000, "total_deducciones": 420000, "total_pagar": 3780000 }
  }
}
```

---

## 6) Plan operativo (2 semanas)

### Semana 1
1. Backend: autorización por rol + endpoint admin reportes enriquecido.
2. Frontend: `reportsService`, mappers y reemplazo de mocks en panel admin.
3. QA: pruebas manuales por rol (admin, rrhh, empleado).

### Semana 2
1. Backend: endpoint detalle `GET /nomina/:id_nomina`.
2. Frontend: detalle real (sin hardcode), integración exportaciones iniciales.
3. QA: casos de seguridad (filtros indebidos), regresión y performance base.

---

## 7) Riesgos y mitigación
- **Riesgo:** fuga de información por filtros manipulados desde frontend.
  - **Mitigación:** enforcement en backend con `req.user` y validación de rol.
- **Riesgo:** diferencias entre totales UI y PDF.
  - **Mitigación:** una sola fuente de cálculo en backend + pruebas de consistencia.
- **Riesgo:** respuesta pesada en admin con nómina histórica.
  - **Mitigación:** paginación + filtros obligatorios por año/mes.

---

## 8) Definition of Done (DoD)
- Reportes admin sin datos mock.
- Consultas protegidas por rol y propiedad de datos.
- Detalle en pantalla con datos reales (`detalle_nomina` + `horas_extra_nomina`).
- Exportación administrativa funcional (al menos PDF o Excel en primera entrega).
- Evidencia de pruebas por rol y por filtros críticos.

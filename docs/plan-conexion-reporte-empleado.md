# Plan de trabajo: conexión de `EmployeeReportDetail` con datos reales por empleado y por mes

## 1) Diagnóstico del estado actual

- `EmployeeReportsList.jsx` sí consulta datos reales a `GET /api/nomina/reportes` con `anio` e `id_empleado` desde `user.id_empleado`.
- `EmployeeReportDetail.jsx` no hace consultas al backend; renderiza contenido estático (ingresos, deducciones, notas y acumulados).
- En `Reports.jsx`, al seleccionar un mes se pasa al detalle un objeto armado en frontend (`selectedReport`), sin cargar detalle extendido desde base de datos.
- Backend actualmente expone `GET /api/nomina/reportes` (listado/resumen), pero no un endpoint específico para detalle completo de una nómina (conceptos y horas extra).

## 2) Objetivo funcional

Al abrir un recibo mensual desde la vista de empleado, el sistema debe:

1. identificar la nómina exacta (`id_nomina`) del empleado autenticado,
2. consultar su detalle real en base de datos,
3. mostrar en pantalla conceptos devengados/deducciones, totales, periodo y metadatos del recibo,
4. impedir que un empleado consulte recibos de otro empleado.

## 3) Diseño técnico propuesto

### 3.1 Backend

Crear endpoint de detalle:

- `GET /api/nomina/reportes/:id_nomina`

Respuesta sugerida:

```json
{
  "success": true,
  "data": {
    "nomina": {
      "id_nomina": 123,
      "id_empleado": 7,
      "empleado": "Nombre Apellido",
      "fecha_inicio": "2026-02-01",
      "fecha_corte": "2026-02-28",
      "tipo_pago": "MENSUAL",
      "total_devengado": 2500000,
      "total_deducciones": 430000,
      "total_pagar": 2070000
    },
    "detalles": [
      { "id_detalle": 1, "concepto": "Sueldo Base", "valor": 2000000, "tipo": "DEVENGADO" },
      { "id_detalle": 2, "concepto": "Retención", "valor": 300000, "tipo": "DEDUCCION" }
    ],
    "horas_extras": [
      {
        "tipo_hora": "EXTRA_NOCTURNA",
        "horas": 4,
        "valor_total": 120000
      }
    ]
  }
}
```

> Nota: para soportar `tipo` en detalle, conviene extender `detalle_nomina` con columna `tipo` (`DEVENGADO`/`DEDUCCION`) y migrar data histórica según reglas del negocio.

#### Seguridad

- Si `req.user.rol === 'EMPLEADO'`, forzar que `nomina.id_empleado === req.user.id_empleado`.
- Si no coincide, responder `403`.
- Para Admin/RRHH permitir acceso amplio.

#### Reuso

- Mantener `GET /reportes` para listado.
- Nuevo endpoint solo para “drill-down” (detalle).

### 3.2 Frontend

`EmployeeReportsList.jsx`

- Mantener consulta actual por año.
- Asegurar que cada tarjeta lleve `dbId` (`id_nomina`) al seleccionar mes.

`Reports.jsx`

- Mantener estado de navegación lista/detalle.
- Pasar `report.dbId` al componente de detalle como `reportId` (en lugar de depender solo del objeto precargado).

`EmployeeReportDetail.jsx`

- Convertirlo a componente con fetch real:
  - `useEffect` + `api.get('/nomina/reportes/:id_nomina')`
  - estados `loading`, `error`, `detail`.
- Renderizar dinámicamente:
  - cabecera (periodo, fecha de abono, estado),
  - ingresos y deducciones desde `detalles` filtrados por `tipo`,
  - totales desde `nomina.total_*`,
  - sección de horas extra si existen.
- Evitar hardcode de fechas como `31/{mes}`; usar `fecha_inicio` y `fecha_corte` reales.

## 4) Cambios de datos / DB

1. **Opción mínima (rápida):** inferir `tipo` por convención en `concepto` (menos confiable).
2. **Opción recomendada:** migración estructural:
   - `ALTER TABLE detalle_nomina ADD COLUMN tipo ENUM('DEVENGADO','DEDUCCION') NOT NULL DEFAULT 'DEVENGADO';`
   - actualizar `createPayroll` para persistir `tipo`.
   - ajustar reportes históricos según reglas de negocio.

## 5) Plan por fases

### Fase 1 — API de detalle segura (Backend)

- Crear controlador `getPayrollReportDetail`.
- Implementar consultas: encabezado nómina + `detalle_nomina` + `horas_extra_nomina`.
- Aplicar autorización por rol/empleado.
- Exponer ruta `GET /nomina/reportes/:id_nomina`.

### Fase 2 — Integración UI de detalle (Frontend)

- Refactor de `EmployeeReportDetail` para consumir API.
- Manejo de carga/error/sin datos.
- Sustituir contenido estático por datos reales.

### Fase 3 — Normalización de conceptos

- Introducir `tipo` en `detalle_nomina`.
- Actualizar flujo de creación de nómina para guardar tipo.
- Ajustar visualización de ingresos/deducciones sin heurísticas.

### Fase 4 — QA y criterios de aceptación

- Caso empleado A no puede abrir nómina de empleado B (`403`).
- Apertura de cada mes muestra información correcta de BD.
- Totales del detalle coinciden con `total_pagar`.
- Estados visuales correctos para loading/error/no data.

## 6) Riesgos y mitigaciones

- **Riesgo:** datos históricos en `detalle_nomina` sin clasificación.
  - **Mitigación:** script de backfill + fallback temporal.
- **Riesgo:** zona horaria al agrupar meses.
  - **Mitigación:** estandarizar fechas en UTC o usar corte en SQL.
- **Riesgo:** endpoint listado permite filtrar `id_empleado` arbitrario.
  - **Mitigación:** en backend, si rol EMPLEADO ignorar query param y usar `req.user.id_empleado`.

## 7) Estimación sugerida

- Fase 1: 0.5–1 día.
- Fase 2: 0.5–1 día.
- Fase 3: 0.5 día (más validación de datos históricos).
- Fase 4: 0.5 día.

Total: **2–3 días** para dejar el flujo robusto y seguro.

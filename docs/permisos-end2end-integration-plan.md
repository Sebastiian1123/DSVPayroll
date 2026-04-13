# Plan técnico detallado: integración end-to-end del módulo de Permisos

## 1) Objetivo

Integrar completamente el módulo de **Permisos / Novedades** (vacaciones, permisos, incapacidades, licencias) con:

- **Módulo de Empleados** (datos maestros y rol/usuario).
- **Módulo de Nómina** (cálculo y persistencia de impacto económico).
- **Módulo de Reportes** (visualización por empleado y administración).
- **Base de datos** (trazabilidad completa del flujo de solicitud → aprobación → impacto en nómina → reporte).

Meta funcional: que, al aprobar una novedad desde administración, el impacto quede disponible automáticamente en nómina y en reportes, sin reprocesos manuales.

---

## 2) Estado actual (diagnóstico sobre el código existente)

### 2.1 Lo que ya existe y sirve de base

1. **Permisos (frontend) con vista de usuario y bandeja admin**:
   - El usuario puede crear solicitudes por tipo (vacaciones, permisos, incapacidades, licencias).
   - Administración puede listar, filtrar y aprobar/rechazar/cancelar solicitudes.
   - Ya existen campos de impacto de nómina (`es_remunerado`, `porcentaje_pago`, `origen_novedad`, `horas_solicitadas`).

2. **Permisos (backend) con endpoints por tipo y cambios de estado**:
   - Endpoints para crear y gestionar solicitudes por tipo.
   - Validación de estado y reglas de vacaciones (saldo y devoluciones al cancelar).

3. **Nómina con integración parcial de novedades**:
   - Al **crear nómina**, el backend consulta solicitudes aprobadas del periodo y calcula impacto.
   - Se inserta el detalle de novedades en `detalle_nomina`.

4. **Modelo de datos ya apto para integración**:
   - `solicitudes_laborales` ya guarda tipo, sub-tipo, estado y atributos de impacto.
   - `nomina`, `detalle_nomina`, `reporte_nomina_mensual` existen y están en uso.

### 2.2 Brechas críticas para “integración completa”

1. **No hay marca de consumo de novedad en nómina**
   - Hoy una solicitud aprobada puede volver a entrar en otra nómina si hay periodos solapados o reprocesos.

2. **Aprobación no dispara asiento/pending de nómina**
   - El impacto se aplica solo al crear nómina, no hay mecanismo explícito de “novedad pendiente de liquidar”.

3. **Reglas legales parametrizadas parcialmente**
   - Hay lógica para incapacidad común/laboral, pero no está centralizada por vigencias legales configurables.

4. **Reportes no exponen explícitamente el desglose por novedad aprobada**
   - El detalle de empleado aún tiene contenido hardcodeado visualmente.
   - Falta consolidado administrativo orientado a novedades aprobadas + su impacto.

5. **Vista de Permisos para empleados no bloquea de forma explícita edición de campos sensibles**
   - El backend ya autocompleta reglas para empleado, pero se debe endurecer contrato de API para evitar sobreescritura accidental.

---

## 3) Arquitectura objetivo

## 3.1 Principio de diseño

Usar `solicitudes_laborales` como **fuente única de verdad funcional** y agregar una capa de **liquidación de novedades** para garantizar idempotencia y trazabilidad en nómina.

## 3.2 Componentes objetivo

1. **Solicitudes / Permisos (origen de novedad)**
   - CRUD + workflow de estados.

2. **Motor de impacto de nómina (dominio de reglas)**
   - Función pura por tipo de novedad y por vigencia legal.
   - Resultado: uno o varios movimientos contables de nómina (devengado/deducción/informativo).

3. **Liquidación de novedades**
   - Relación formal entre solicitud aprobada y nómina donde fue aplicada.
   - Evita doble aplicación.

4. **Reportes de novedades**
   - Vista administrativa consolidada.
   - Vista de empleado con el detalle de cada novedad aprobada y su impacto.

---

## 4) Diseño de datos (DB)

## 4.1 Cambios de esquema propuestos

### A) Extender `solicitudes_laborales`

Agregar columnas:

- `impacto_nomina_calculado JSON NULL`
  - Snapshot del cálculo al momento de aprobación (para auditoría).
- `pendiente_liquidacion TINYINT(1) NOT NULL DEFAULT 0`
  - 1 cuando está aprobada y aún no se aplica en nómina.
- `liquidada_en_nomina TINYINT(1) NOT NULL DEFAULT 0`
- `fecha_liquidacion TIMESTAMP NULL`

Índices:

- `(id_empleado, estado, fecha_inicio, fecha_fin)`
- `(pendiente_liquidacion, id_empleado)`
- `(tipo, estado, fecha_solicitud)`

### B) Nueva tabla `nomina_novedades_aplicadas`

Propuesta:

- `id_nomina_novedad` PK
- `id_nomina` FK → `nomina`
- `id_solicitud` FK → `solicitudes_laborales`
- `categoria` ENUM('DEVENGADO','DEDUCCION','INFORMATIVA')
- `concepto` VARCHAR(120)
- `cantidad` DECIMAL(10,2)
- `unidad` ENUM('DIAS','HORAS')
- `porcentaje_aplicado` DECIMAL(5,2)
- `valor_aplicado` DECIMAL(14,2)
- `creado_en` TIMESTAMP

Constraint:

- `UNIQUE (id_nomina, id_solicitud)` para idempotencia.

### C) Opcional (recomendado): tabla de parametrización legal

`parametros_legales_nomina`:

- `codigo` (ej: `INCAP_COMUN_TRAMO_1`, `INCAP_LABORAL_PCT`, `PERMISO_NO_REMUNERADO_PCT`)
- `valor`
- `vigente_desde`, `vigente_hasta`

Objetivo: no hardcodear porcentajes legales.

---

## 5) Reglas de negocio implementables (motor de cálculo)

## 5.1 Matriz funcional

1. **Vacaciones**
   - Solicitud aprobada.
   - En nómina: registrar movimiento como **adición o deducción** según política del cliente (parametrizable).
   - Por defecto operativo: `INFORMATIVA` + asiento de detalle configurable.

2. **Licencias**
   - Si `es_remunerado=1`: impacto parcial/cero según `% pago`.
   - Si no remunerada: deducción total del tiempo.

3. **Incapacidad común**
   - Deducción según porcentaje legal vigente (tramos por día de incapacidad).

4. **Incapacidad laboral**
   - Deducción según porcentaje legal vigente para origen laboral.

5. **Permiso remunerado**
   - Deducción o carga según porcentaje definido en solicitud.
   - Fórmula base: `valor_base_periodo * (1 - porcentaje_pago/100)` para deducción.
   - Si existe regla de recargo positivo: generar `DEVENGADO`.

6. **Permiso no remunerado**
   - Deducción total del día/hora.

## 5.2 Consideraciones técnicas de cálculo

- Base diaria: `sueldo_mensual / 30`.
- Base horaria: `(sueldo_mensual / 30) / 8`.
- Siempre calcular por **traslape real** entre periodo de nómina y rango de solicitud.
- Redondeo homogéneo a 2 decimales (banker o half-up definido en estándar técnico).

---

## 6) Flujos end-to-end

## 6.1 Flujo trabajador (usuario estándar)

1. Usuario crea solicitud (vacaciones/permiso/incapacidad/licencia).
2. Backend valida:
   - empleado asociado,
   - fechas,
   - tipo/subtipo,
   - soportes,
   - campos permitidos por rol.
3. Estado inicial `PENDIENTE`.
4. Historial del empleado visible inmediatamente.

## 6.2 Flujo administrador

1. Admin ve bandeja consolidada multi-tipo.
2. Acción sobre solicitud:
   - Aprobar: `estado=APROBADA` + `pendiente_liquidacion=1`.
   - Rechazar: `estado=RECHAZADA`.
   - Cancelar: `estado=CANCELADA` (+ reversa si aplica para vacaciones).
3. Al aprobar, se guarda snapshot `impacto_nomina_calculado`.

## 6.3 Integración automática con nómina

Al ejecutar creación de nómina de un empleado y periodo:

1. Seleccionar solicitudes `APROBADA + pendiente_liquidacion=1` que traslapen periodo.
2. Calcular movimientos por regla.
3. Insertar en:
   - `detalle_nomina`
   - `nomina_novedades_aplicadas`
4. Marcar solicitudes como:
   - `liquidada_en_nomina=1`
   - `pendiente_liquidacion=0`
   - `fecha_liquidacion=NOW()`
5. Commit transaccional único.

---

## 7) Plan de implementación por fases

## Fase 1 — Endurecimiento funcional de Permisos (Semana 1)

### Backend

- Centralizar validaciones por tipo en servicio de dominio.
- Forzar “campos permitidos por rol” (empleado no puede sobreescribir reglas sensibles).
- Al aprobar, persistir snapshot de cálculo preliminar.

### Frontend

- Mantener módulo actual pero deshabilitar/ocultar edición de campos de nómina para empleado estándar de forma estricta.
- Mejorar filtros admin para consolidado “todos los tipos” por defecto.

### Entregable

- Workflow robusto de solicitudes con trazabilidad de aprobación.

## Fase 2 — Liquidación idempotente en Nómina (Semana 1-2)

### Backend

- Migración DB: nuevas columnas + tabla `nomina_novedades_aplicadas`.
- Servicio `payrollNoveltySettlementService`:
  - `collectApprovedPendingNovelties()`
  - `calculateNoveltyMovements()`
  - `applyNoveltyMovementsToPayroll()`
  - `markNoveltiesAsSettled()`
- Integrar servicio en `createPayroll` dentro de la transacción.

### Entregable

- Novedades aprobadas aplicadas una sola vez por nómina.

## Fase 3 — Reportes de novedades (Semana 2)

### Backend

- Nuevo endpoint admin: `GET /api/solicitudes/reportes/aprobadas` (filtros por tipo, estado, periodo, empleado).
- Extender `GET /api/nomina/reportes` para incluir:
  - `novedades_aplicadas_count`
  - `total_novedades_devengado`
  - `total_novedades_deduccion`
- Endpoint detalle: `GET /api/nomina/:id_nomina/novedades`.

### Frontend

- Reportes empleado: reemplazar hardcode con datos reales de detalle de nómina + novedades.
- Reportes admin: tabla consolidada de novedades aprobadas con desglose por solicitud.
- En módulo Permisos, agregar enlace “Ver impacto en nómina” cuando la novedad esté liquidada.

### Entregable

- Usuario y admin ven cada novedad aprobada con desglose de cargos/deducciones.

## Fase 4 — Parametrización legal y auditoría (Semana 3)

- Implementar tabla de parámetros legales por vigencia.
- Auditoría de eventos (`solicitud_creada`, `aprobada`, `rechazada`, `cancelada`, `liquidada_nomina`).
- Reporte trazable solicitud → nómina.

---

## 8) Contratos API sugeridos

## 8.1 Aprobación de solicitud

`PATCH /api/solicitudes/:tipo/:id/aprobar`

Respuesta (resumen):

```json
{
  "success": true,
  "data": {
    "id_solicitud": 123,
    "estado": "APROBADA",
    "pendiente_liquidacion": 1,
    "impacto_nomina_calculado": {
      "categoria": "DEDUCCION",
      "concepto": "Ajuste permiso remunerado (2 dias)",
      "valor_estimado": 120000
    }
  }
}
```

## 8.2 Vista consolidada de novedades aprobadas

`GET /api/solicitudes/reportes/aprobadas?anio=2026&mes=3&tipo=PERMISO`

```json
{
  "success": true,
  "data": {
    "resumen": {
      "total_solicitudes": 52,
      "total_devengado": 320000,
      "total_deduccion": 1980000
    },
    "rows": [
      {
        "id_solicitud": 123,
        "id_empleado": 45,
        "empleado": "Ana Perez",
        "tipo": "PERMISO",
        "estado": "APROBADA",
        "valor_aplicado": 120000,
        "categoria": "DEDUCCION",
        "id_nomina": 901
      }
    ]
  }
}
```

---

## 9) Seguridad, consistencia y performance

1. **Seguridad por rol**
   - Empleado: solo sus solicitudes/reportes propios.
   - Admin/RRHH: visibilidad global.

2. **Idempotencia**
   - `UNIQUE (id_nomina, id_solicitud)` + flags de liquidación.

3. **Transacciones**
   - Creación de nómina + aplicación de novedades + marcación de liquidación en una sola transacción.

4. **Bloqueos**
   - `SELECT ... FOR UPDATE` para evitar doble liquidación concurrente.

5. **Índices**
   - En solicitudes por estado/empleado/rango y por pendiente de liquidación.

---

## 10) Pruebas recomendadas

## 10.1 Unitarias

- Cálculo por cada tipo de novedad.
- Tramos de incapacidad común y laboral.
- Permiso remunerado con porcentajes 0, 50, 100.

## 10.2 Integración API

- Empleado crea solicitud y no puede alterar campos restringidos.
- Admin aprueba y queda pendiente de liquidación.
- Nómina liquida y marca solicitud como liquidada.
- Reintento de nómina no duplica impacto.

## 10.3 E2E

- Flujo completo por tipo de novedad (de solicitud a reporte final).
- Verificación visual en reportes de desglose de deducciones/cargas.

---

## 11) Definición de terminado (DoD)

- Solicitudes aprobadas impactan nómina automáticamente y una sola vez.
- Reglas de negocio solicitadas aplicadas por tipo de novedad.
- Usuario y admin ven el desglose real de cada novedad aprobada en reportes.
- Trazabilidad completa en DB entre solicitud y nómina.
- Pruebas unitarias/integración/E2E con cobertura de reglas críticas.

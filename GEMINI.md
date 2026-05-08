# Contexto del Proyecto: Módulo de Vacaciones

## Objetivo
Implementar una mejora para permitir que el empleado divida sus 15 días de vacaciones entre:
- `dias_disfrutar` (descanso)
- `dias_dinero` (pago en efectivo)

## Reglas de Negocio
1. Total disponible: 15 días.
2. Límite de dinero: Máximo la mitad (7 días).
3. Validaciones:
   - `dias_disfrutar + dias_dinero <= 15`
   - `dias_dinero <= 7`
   - Ambos valores deben ser >= 0.
4. Cálculo de pago: `pago = salario_diario * dias_dinero`.

## Requerimientos Técnicos
- **Frontend:** Formulario con inputs numéricos, resumen dinámico en tiempo real y bloqueo de envío si hay errores.
- **Backend:** Validación de reglas y almacenamiento de `dias_disfrutar`, `dias_dinero` y `total_dias`.

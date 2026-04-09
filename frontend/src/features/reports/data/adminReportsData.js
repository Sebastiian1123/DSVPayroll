export const ADMIN_REPORT_YEARS = [
  { year: 2023, status: 'CERRADO', statusType: 'success' },
  { year: 2024, status: 'PERIODO ACTIVO', statusType: 'primary', isCurrent: true },
  { year: 2025, status: 'PLANIFICADO', statusType: 'warning' },
  { year: 2026, status: 'BLOQUEADO', statusType: 'gray' }
]

export const ADMIN_REPORT_MONTHS = [
  { id: 1, name: 'Enero', desc: 'Pagado el 31 Ene', status: 'PAGADO', statusClass: 'badge-success' },
  { id: 2, name: 'Febrero', desc: 'Pagado el 28 Feb', status: 'PAGADO', statusClass: 'badge-success' },
  { id: 3, name: 'Marzo', desc: 'Periodo Actual', status: 'EN PROGRESO', statusClass: 'badge-info', isActive: true },
  { id: 4, name: 'Abril', desc: 'Inicia 01 Abr', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 5, name: 'Mayo', desc: 'Próximo Trimestre', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 6, name: 'Junio', desc: 'Final T2', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 7, name: 'Julio', desc: 'Ciclo 07-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 8, name: 'Agosto', desc: 'Ciclo 08-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 9, name: 'Septiembre', desc: 'Final T3', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 10, name: 'Octubre', desc: 'Ciclo 10-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 11, name: 'Noviembre', desc: 'Ciclo 11-24', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true },
  { id: 12, name: 'Diciembre', desc: 'Finde Año', status: 'PENDIENTE', statusClass: 'badge-secondary', disabled: true }
]

export const ROWS_PER_PAGE = 10
export const SUBSIDIO_TRANSPORTE = 249095
export const DIAS_NOMINA_MENSUAL = 30
export const HORAS_MENSUALES_REFERENCIA = 240

export const OVERTIME_TYPES = [
  { key: 'extra_diurna', label: 'Extra diurna', surcharge: 0.25, dbType: 'EXTRA_DIURNA' },
  { key: 'extra_nocturna', label: 'Extra nocturna', surcharge: 0.75, dbType: 'EXTRA_NOCTURNA' },
  { key: 'extra_diurna_dominical', label: 'Extra diurna en domingo/festivo', surcharge: 1.05, dbType: 'EXTRA_DIURNA_DOMINICAL_FESTIVO' },
  { key: 'extra_nocturna_dominical', label: 'Extra nocturna en domingo/festivo', surcharge: 1.55, dbType: 'EXTRA_NOCTURNA_DOMINICAL_FESTIVO' }
]

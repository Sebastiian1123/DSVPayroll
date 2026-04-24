export const ROWS_PER_PAGE = 10
export const DIAS_NOMINA_MENSUAL = 30
export const DEFAULT_PAYROLL_PARAMETERS = {
  heo: '25%',
  hen: '75%',
  hef: '100%',
  hefn: '150%',
  subsidioTransporte: '140606',
  horasSemanales: '47',
  saludEmpleado: '4.0',
  saludEmpresa: '8.5',
  pensionEmpleado: '4.0',
  pensionEmpresa: '12.0',
  arlEmpresa: '0.522'
}

export const buildOvertimeTypes = (parameters = DEFAULT_PAYROLL_PARAMETERS) => ([
  { key: 'extra_diurna', label: 'Extra diurna', surcharge: Number(String(parameters.heo || '25').replace('%', '')) / 100, dbType: 'EXTRA_DIURNA' },
  { key: 'extra_nocturna', label: 'Extra nocturna', surcharge: Number(String(parameters.hen || '75').replace('%', '')) / 100, dbType: 'EXTRA_NOCTURNA' },
  { key: 'extra_diurna_dominical', label: 'Extra diurna en domingo/festivo', surcharge: Number(String(parameters.hef || '100').replace('%', '')) / 100, dbType: 'EXTRA_DIURNA_DOMINICAL_FESTIVO' },
  { key: 'extra_nocturna_dominical', label: 'Extra nocturna en domingo/festivo', surcharge: Number(String(parameters.hefn || '150').replace('%', '')) / 100, dbType: 'EXTRA_NOCTURNA_DOMINICAL_FESTIVO' }
])

export const EMPLOYEE_REPORT_INCOMES = [
  {
    title: 'Sueldo Base',
    description: 'Mensualidad ordinaria',
    amount: '$2,850.00'
  },
  {
    title: 'Horas Extra',
    description: '8 horas estructurales',
    amount: '$185.40'
  },
  {
    title: 'Plus de Productividad',
    description: 'Objetivos Q3 logrados',
    amount: '$450.00'
  },
  {
    title: 'Complemento Transporte',
    description: 'Gasto mensual compensado',
    amount: '$95.00'
  }
]

export const EMPLOYEE_REPORT_DEDUCTIONS = [
  {
    title: 'Retención ISR',
    description: 'Tipo aplicado: 19.5%',
    amount: '-$598.18'
  },
  {
    title: 'Seguridad Social (IMSS)',
    description: 'Contingencias comunes',
    amount: '-$168.27'
  },
  {
    title: 'Préstamo Empresa',
    description: 'Cuota 3 de 12',
    amount: '-$53.70'
  },
  {
    title: 'Seguro de Salud',
    description: 'Cofinanciación empresa',
    amount: '-$45.00'
  }
]

export const EMPLOYEE_REPORT_ACTIONS = [
  { icon: 'fa-regular fa-circle-question', label: 'Centro de Ayuda' },
  { icon: 'fa-solid fa-triangle-exclamation', label: 'Notificar un Error' },
  { icon: 'fa-solid fa-shield-halved', label: 'Política de Nóminas' }
]

export const getEmployeeReportPeriodMeta = (report) => {
  const year = report.year || 2023
  const monthToken = report.id?.split('-').pop() || '01'

  return {
    year,
    monthToken,
    liquidationPeriodLabel: `${report.month} ${year}`,
    liquidationRangeLabel: `01/${monthToken}/${year} al 31/${monthToken}/${year}`,
    paymentDateLabel: `31 ${report.month.substring(0, 3)} ${year}`
  }
}

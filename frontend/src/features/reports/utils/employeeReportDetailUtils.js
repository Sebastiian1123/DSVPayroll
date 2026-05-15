export const EMPLOYEE_REPORT_ACTIONS = [
  { icon: 'fa-regular fa-circle-question', label: 'Centro de Ayuda' },
  { icon: 'fa-solid fa-triangle-exclamation', label: 'Notificar un Error' },
  { icon: 'fa-solid fa-shield-halved', label: 'Política de Nóminas' }
]

export const getEmployeeReportPeriodMeta = (report) => {
  const year = report.year || new Date().getFullYear()
  const monthToken = report.id?.split('-').pop() || '01'

  return {
    year,
    monthToken,
    liquidationPeriodLabel: `${report.month} ${year}`,
    liquidationRangeLabel: `01/${monthToken}/${year} al 31/${monthToken}/${year}`,
    paymentDateLabel: `31 ${report.month.substring(0, 3)} ${year}`
  }
}

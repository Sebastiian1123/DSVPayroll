export const formatReportCurrency = (value) => {
  const amount = Number(value)
  if (Number.isNaN(amount)) return '—'

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

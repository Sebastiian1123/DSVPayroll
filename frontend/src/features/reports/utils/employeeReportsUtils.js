import { formatReportCurrency } from './reportFormatters'

export const MONTHS = [
  { number: 1, name: 'Enero' },
  { number: 2, name: 'Febrero' },
  { number: 3, name: 'Marzo' },
  { number: 4, name: 'Abril' },
  { number: 5, name: 'Mayo' },
  { number: 6, name: 'Junio' },
  { number: 7, name: 'Julio' },
  { number: 8, name: 'Agosto' },
  { number: 9, name: 'Septiembre' },
  { number: 10, name: 'Octubre' },
  { number: 11, name: 'Noviembre' },
  { number: 12, name: 'Diciembre' }
]

export const buildEmployeeReportsByMonth = ({ reportRows, selectedYear }) => {
  const grouped = reportRows.reduce((acc, row) => {
    const date = new Date(row.fecha_corte)
    const month = date.getUTCMonth() + 1

    const existing = acc[month]
    if (!existing || new Date(row.fecha_corte) > new Date(existing.fecha_corte)) {
      acc[month] = row
    }

    return acc
  }, {})

  const now = new Date()

  return MONTHS.map((monthRef) => {
    const row = grouped[monthRef.number]
    const isFutureMonth = selectedYear === now.getFullYear() && monthRef.number > (now.getMonth() + 1)

    if (!row) {
      return {
        id: `RN-${selectedYear}-${String(monthRef.number).padStart(2, '0')}`,
        month: monthRef.name,
        amount: isFutureMonth ? 'Generando...' : null,
        status: isFutureMonth ? 'PRÓXIMO' : 'SIN REGISTRO',
        statusClass: isFutureMonth ? 'badge-secondary' : 'badge-gray',
        disabled: true,
        monthNumber: monthRef.number,
        year: selectedYear
      }
    }

    return {
      id: `RN-${selectedYear}-${String(monthRef.number).padStart(2, '0')}`,
      dbId: row.id_nomina,
      month: monthRef.name,
      amount: formatReportCurrency(row.total_pagar),
      status: 'PAGADO',
      statusClass: 'badge-success',
      disabled: false,
      monthNumber: monthRef.number,
      year: selectedYear,
      fechaInicio: row.fecha_inicio,
      fechaCorte: row.fecha_corte,
      totalDevengado: row.total_devengado,
      totalDeducciones: row.total_deducciones,
      totalPagar: row.total_pagar
    }
  })
}

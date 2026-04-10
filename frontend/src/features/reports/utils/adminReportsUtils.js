import { MONTHS } from './employeeReportsUtils'
import { formatReportCurrency } from './reportFormatters'

const toMonthNumber = (fechaCorte) => {
  const date = new Date(fechaCorte)
  return Number.isNaN(date.getTime()) ? null : date.getUTCMonth() + 1
}

export const buildAdminYears = ({ reportRows, selectedYear, currentYear }) => {
  const yearsFromData = Array.from(new Set((reportRows || []).map((row) => {
    const date = new Date(row.fecha_corte)
    return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear()
  }).filter(Boolean)))

  const years = Array.from(new Set([selectedYear, currentYear, currentYear - 1, currentYear - 2, ...yearsFromData]))
    .sort((a, b) => a - b)

  return years.map((year) => {
    const hasData = (reportRows || []).some((row) => new Date(row.fecha_corte).getUTCFullYear() === year)

    return {
      year,
      status: year > currentYear ? 'PLANIFICADO' : (hasData ? 'CON REGISTROS' : 'SIN DATOS'),
      statusType: year > currentYear ? 'warning' : (hasData ? 'success' : 'gray'),
      isCurrent: year === selectedYear
    }
  })
}

export const buildAdminMonths = ({ reportRows, selectedYear, currentDate = new Date() }) => {
  const monthsSummary = (reportRows || []).reduce((acc, row) => {
    const month = toMonthNumber(row.fecha_corte)
    if (!month) return acc

    if (!acc[month]) {
      acc[month] = {
        totalNominas: 0,
        totalPagado: 0,
        lastCutoffDate: row.fecha_corte
      }
    }

    acc[month].totalNominas += 1
    acc[month].totalPagado += Number(row.total_pagar) || 0

    if (new Date(row.fecha_corte) > new Date(acc[month].lastCutoffDate)) {
      acc[month].lastCutoffDate = row.fecha_corte
    }

    return acc
  }, {})

  const currentYear = currentDate.getUTCFullYear()
  const currentMonth = currentDate.getUTCMonth() + 1

  return MONTHS.map((monthRef) => {
    const summary = monthsSummary[monthRef.number]
    const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && monthRef.number > currentMonth)

    if (!summary) {
      return {
        id: monthRef.number,
        name: monthRef.name,
        desc: isFutureMonth ? 'Aún no inicia' : 'Sin nóminas registradas',
        status: isFutureMonth ? 'PENDIENTE' : 'SIN DATOS',
        statusClass: isFutureMonth ? 'badge-secondary' : 'badge-gray',
        disabled: isFutureMonth,
        isActive: false,
        monthNumber: monthRef.number,
        year: selectedYear,
        totalNominas: 0,
        totalPagadoLabel: formatReportCurrency(0)
      }
    }

    return {
      id: monthRef.number,
      name: monthRef.name,
      desc: `${summary.totalNominas} nómina(s)`,
      status: 'PAGADO',
      statusClass: 'badge-success',
      disabled: false,
      isActive: false,
      monthNumber: monthRef.number,
      year: selectedYear,
      totalNominas: summary.totalNominas,
      totalPagadoLabel: formatReportCurrency(summary.totalPagado)
    }
  })
}

export const mapAdminPayrollRows = (rows = []) => (
  rows.map((row) => ({
    id: row.id_nomina,
    nombre: row.empleado,
    cargo: row.cargo || 'Sin cargo',
    departamento: row.departamento || 'Sin departamento',
    avatar: (row.empleado || '?').charAt(0).toUpperCase(),
    salario: Number(row.total_devengado) || 0,
    heo: Number(row.heo) || 0,
    hef: Number(row.hef) || 0,
    hen: Number(row.hen) || 0,
    hefn: Number(row.hefn) || 0,
    deducciones: Number(row.total_deducciones) || 0,
    neto: Number(row.total_pagar) || 0
  }))
)

export const ADMIN_MONTHS = [
  { id: 1, name: 'Enero' },
  { id: 2, name: 'Febrero' },
  { id: 3, name: 'Marzo' },
  { id: 4, name: 'Abril' },
  { id: 5, name: 'Mayo' },
  { id: 6, name: 'Junio' },
  { id: 7, name: 'Julio' },
  { id: 8, name: 'Agosto' },
  { id: 9, name: 'Septiembre' },
  { id: 10, name: 'Octubre' },
  { id: 11, name: 'Noviembre' },
  { id: 12, name: 'Diciembre' }
]

export const buildAdminYearOptions = (baseYear) => ([
  baseYear,
  baseYear - 1,
  baseYear - 2
])

export const buildAdminMonthCards = ({ selectedYear, rows }) => {
  const now = new Date()
  const rowsByMonth = rows.reduce((acc, row) => {
    const month = new Date(row.fecha_corte).getUTCMonth() + 1
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  return ADMIN_MONTHS.map((monthRef) => {
    const rowCount = rowsByMonth[monthRef.id] || 0
    const isFutureMonth = selectedYear === now.getFullYear() && monthRef.id > now.getMonth() + 1

    if (isFutureMonth) {
      return {
        ...monthRef,
        desc: 'Periodo futuro',
        status: 'PENDIENTE',
        statusClass: 'badge-secondary',
        disabled: true
      }
    }

    if (rowCount === 0) {
      return {
        ...monthRef,
        desc: 'Sin nóminas registradas',
        status: 'SIN DATOS',
        statusClass: 'badge-gray',
        disabled: true
      }
    }

    return {
      ...monthRef,
      desc: `${rowCount} nómina(s)`,
      status: 'CERRADO',
      statusClass: 'badge-success',
      disabled: false
    }
  })
}


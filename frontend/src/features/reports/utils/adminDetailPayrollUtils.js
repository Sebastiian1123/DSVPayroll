export const filterAdminPayrollRows = ({ rows, search, department }) => {
  const normalizedSearch = search.trim().toLowerCase()

  return rows.filter((employee) => {
    const matchesSearch =
      !normalizedSearch ||
      String(employee.empleado || '').toLowerCase().includes(normalizedSearch) ||
      String(employee.cargo || '').toLowerCase().includes(normalizedSearch)

    const matchesDepartment =
      department === 'Todos' || String(employee.departamento || '') === department

    return matchesSearch && matchesDepartment
  })
}

export const calculateAdminPayrollTotals = (rows) => (
  rows.reduce(
    (acc, row) => {
      acc.salario += Number(row.salario_basico) || 0
      acc.heo += Number(row.heo) || 0
      acc.hef += Number(row.hef) || 0
      acc.hen += Number(row.hen) || 0
      acc.hefn += Number(row.hefn) || 0
      acc.salud += Number(row.deduccion_salud) || 0
      acc.arl += Number(row.deduccion_arl) || 0
      acc.pension += Number(row.deduccion_pension) || 0
      acc.totalPagar += Number(row.total_pagar) || 0
      return acc
    },
    {
      salario: 0,
      heo: 0,
      hef: 0,
      hen: 0,
      hefn: 0,
      salud: 0,
      arl: 0,
      pension: 0,
      totalPagar: 0
    }
  )
)

export const filterAdminPayrollRows = ({ rows, search, department }) => {
  const normalizedSearch = search.trim().toLowerCase()

  return rows.filter((employee) => {
    const matchesSearch =
      !normalizedSearch ||
      employee.nombre.toLowerCase().includes(normalizedSearch) ||
      employee.cargo.toLowerCase().includes(normalizedSearch)

    const matchesDepartment =
      department === 'Todos' || employee.departamento === department

    return matchesSearch && matchesDepartment
  })
}

export const calculateAdminPayrollTotals = (rows) => (
  rows.reduce(
    (acc, row) => {
      acc.salario += row.salario
      acc.heo += row.heo
      acc.hef += row.hef
      acc.hen += row.hen
      acc.hefn += row.hefn
      acc.salud += row.salud
      acc.arl += row.arl
      acc.pension += row.pension
      acc.neto += row.neto
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
      neto: 0
    }
  )
)

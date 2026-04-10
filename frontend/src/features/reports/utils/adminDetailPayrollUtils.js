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
      acc.deducciones += row.deducciones
      acc.neto += row.neto
      return acc
    },
    {
      salario: 0,
      heo: 0,
      hef: 0,
      hen: 0,
      hefn: 0,
      deducciones: 0,
      neto: 0
    }
  )
)

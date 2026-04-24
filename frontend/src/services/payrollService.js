import api from './api'

export const downloadPayrollPdf = async (payrollId) => {
  return api.get(`/nomina/${payrollId}/pdf`, {
    responseType: 'blob',
    timeout: 30000
  })
}

const deletePayrollRouteVariants = ({ employeeId }) => [
  `/nomina/empleado/${employeeId}/periodo`,
  `/nomina/empleados/${employeeId}/periodo`,
  `/nomina/${employeeId}/periodo`
]

export const deletePayrollByEmployeeMonth = async ({ employeeId, year, month }) => {
  const params = {
    anio: year,
    mes: month
  }

  let lastError

  for (const route of deletePayrollRouteVariants({ employeeId })) {
    try {
      return await api.delete(route, { params })
    } catch (error) {
      const statusCode = error?.response?.status
      if (statusCode === 404) {
        lastError = error
        continue
      }

      throw error
    }
  }

  throw lastError
}

export default {
  downloadPayrollPdf,
  deletePayrollByEmployeeMonth
}

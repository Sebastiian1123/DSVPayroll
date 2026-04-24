import api from './api'

export const downloadPayrollPdf = async (payrollId) => {
  return api.get(`/nomina/${payrollId}/pdf`, {
    responseType: 'blob',
    timeout: 30000
  })
}

export const deletePayrollByEmployeeMonth = async ({ employeeId, year, month }) => {
  return api.delete(`/nomina/empleado/${employeeId}`, {
    params: {
      anio: year,
      mes: month
    }
  })
}

export default {
  downloadPayrollPdf,
  deletePayrollByEmployeeMonth
}

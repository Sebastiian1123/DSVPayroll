import api from './api'

export const downloadPayrollPdf = async (payrollId) => {
  return api.get(`/nomina/${payrollId}/pdf`, {
    responseType: 'blob',
    timeout: 30000
  })
}

export const deletePayrollByEmployeeMonth = async ({ employeeId, year, month }) => {
  const params = {
    anio: year,
    mes: month
  }

  try {
    return await api.delete(`/nomina/empleado/${employeeId}`, { params })
  } catch (error) {
    if (error?.response?.status !== 404) throw error
  }

  try {
    return await api.delete(`/nomina/empleados/${employeeId}`, { params })
  } catch (error) {
    if (error?.response?.status !== 404) throw error
  }

  return api.delete(`/nomina/${employeeId}/periodo`, { params })
}

export default {
  downloadPayrollPdf,
  deletePayrollByEmployeeMonth
}

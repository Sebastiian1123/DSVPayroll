import api from '../../../services/api'

export const getPayrollReports = async ({ anio, mes, idEmpleado } = {}) => {
  const response = await api.get('/nomina/reportes', {
    params: {
      anio,
      mes,
      id_empleado: idEmpleado
    }
  })

  return response.data?.data
}

export const getAdminPayrollDetailByPeriod = async ({ anio, mes }) => {
  const response = await api.get('/nomina/reportes/admin-detalle', {
    params: { anio, mes }
  })

  return response.data?.data
}

export default {
  getPayrollReports,
  getAdminPayrollDetailByPeriod
}

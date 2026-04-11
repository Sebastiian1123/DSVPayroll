import api from './api'

export const getPayrollReports = async ({ anio, mes, id_empleado } = {}) => {
  const params = {}

  if (anio) params.anio = anio
  if (mes) params.mes = mes
  if (id_empleado) params.id_empleado = id_empleado

  const response = await api.get('/nomina/reportes', { params })
  return response.data?.data || { filtros: {}, resumen: {}, nominas: [] }
}

export default {
  getPayrollReports
}


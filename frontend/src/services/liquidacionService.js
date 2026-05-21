import api from './api'

export const getLiquidaciones = async ({ id_empleado, estado } = {}) => {
  const params = {}
  if (id_empleado) params.id_empleado = id_empleado
  if (estado) params.estado = estado
  const response = await api.get('/liquidacion', { params })
  return response.data?.data || []
}

export const getLiquidacionById = async (idLiquidacion) => {
  const response = await api.get(`/liquidacion/${idLiquidacion}`)
  return response.data?.data || null
}

export const calcularLiquidacion = async ({ id_empleado, fecha_retiro, motivo_retiro }) => {
  const response = await api.post('/liquidacion/calcular', { id_empleado, fecha_retiro, motivo_retiro })
  return response.data
}

export const guardarLiquidacion = async ({ id_empleado, fecha_retiro, motivo_retiro, detalle }) => {
  const response = await api.post('/liquidacion', { id_empleado, fecha_retiro, motivo_retiro, detalle })
  return response.data
}

export const marcarPagada = async (idLiquidacion) => {
  const response = await api.put(`/liquidacion/${idLiquidacion}/pagar`)
  return response.data
}

export const anularLiquidacion = async (idLiquidacion) => {
  const response = await api.put(`/liquidacion/${idLiquidacion}/anular`)
  return response.data
}

export const getRecontratacionConfig = async () => {
  const response = await api.get('/liquidacion/config/recontratacion')
  return response.data?.data || { meses: 0, dias: 0 }
}

export const updateRecontratacionConfig = async (meses, dias) => {
  const response = await api.put('/liquidacion/config/recontratacion', { meses, dias })
  return response.data
}

export const revertirPago = async (idLiquidacion, reactivar = false) => {
  const response = await api.put(`/liquidacion/${idLiquidacion}/revertir-pago`, { reactivar })
  return response.data
}

export const revertirAnulacion = async (idLiquidacion) => {
  const response = await api.put(`/liquidacion/${idLiquidacion}/revertir-anulacion`)
  return response.data
}

export const deleteLiquidacion = async (idLiquidacion) => {
  const response = await api.delete(`/liquidacion/${idLiquidacion}`)
  return response.data
}

export default {
  getLiquidaciones,
  getLiquidacionById,
  calcularLiquidacion,
  guardarLiquidacion,
  marcarPagada,
  anularLiquidacion,
  getRecontratacionConfig,
  updateRecontratacionConfig,
  revertirPago,
  revertirAnulacion,
  deleteLiquidacion
}

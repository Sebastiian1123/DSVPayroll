import api from './api'

export const getPrestacionesResumen = async ({ id_empleado, anio } = {}) => {
  const params = {}
  if (id_empleado) params.id_empleado = id_empleado
  if (anio) params.anio = anio
  const response = await api.get('/prestaciones', { params })
  return response.data?.data || { anio: 0, empleados: [], filas: [] }
}

export const acumularPrestaciones = async ({ id_empleado, anio, mes }) => {
  const response = await api.post('/prestaciones/acumular', { id_empleado, anio, mes })
  return response.data
}

export const acumularPrestacionesMasivo = async ({ anio, mes } = {}) => {
  const response = await api.post('/prestaciones/acumular/masivo', { anio, mes })
  return response.data
}

export default {
  getPrestacionesResumen,
  acumularPrestaciones,
  acumularPrestacionesMasivo
}

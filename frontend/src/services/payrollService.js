import api from './api'

export const downloadPayrollPdf = async (payrollId) => {
  return api.get(`/nomina/${payrollId}/pdf`, {
    responseType: 'blob',
    timeout: 30000
  })
}

export const getPayrollDetail = async (payrollId) => {
  const response = await api.get(`/nomina/${payrollId}`)
  return response.data?.data || null
}

export const getPayrollParameters = async () => {
  const response = await api.get('/nomina/parametros')
  return response.data?.data || null
}

export const updatePayrollParameters = async (payload) => {
  const response = await api.put('/nomina/parametros', payload)
  return response.data?.data || null
}

export default {
  downloadPayrollPdf,
  getPayrollDetail,
  getPayrollParameters,
  updatePayrollParameters
}

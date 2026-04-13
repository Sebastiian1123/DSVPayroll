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

export default {
  downloadPayrollPdf,
  getPayrollDetail
}

import api from './api'

export const downloadPayrollPdf = async (payrollId) => {
  return api.get(`/nomina/${payrollId}/pdf`, {
    responseType: 'blob',
    timeout: 30000
  })
}

export default {
  downloadPayrollPdf
}

import api from './api'

export const getPayrollReports = async ({ anio, mes, id_empleado } = {}) => {
  const params = {}

  if (anio) params.anio = anio
  if (mes) params.mes = mes
  if (id_empleado) params.id_empleado = id_empleado

  const response = await api.get('/nomina/reportes', { params })
  return response.data?.data || { filtros: {}, resumen: {}, nominas: [] }
}

const buildPayrollReportParams = ({ anio, mes, id_empleado } = {}) => {
  const params = {}

  if (anio) params.anio = anio
  if (mes) params.mes = mes
  if (id_empleado) params.id_empleado = id_empleado

  return params
}

const getFilenameFromDisposition = (disposition, fallback) => {
  const match = String(disposition || '').match(/filename="?([^"]+)"?/)
  return match?.[1] || fallback
}

const downloadBlob = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const downloadPayrollReportExcel = async ({ anio, mes, id_empleado } = {}) => {
  const response = await api.get('/nomina/reportes/export/excel', {
    params: buildPayrollReportParams({ anio, mes, id_empleado }),
    responseType: 'blob',
    timeout: 30000
  })

  const filename = getFilenameFromDisposition(
    response.headers['content-disposition'],
    'reporte-nomina.xlsx'
  )
  downloadBlob({ blob: response.data, filename })
}

export const downloadPayrollReportPdf = async ({ anio, mes, id_empleado } = {}) => {
  const response = await api.get('/nomina/reportes/export/pdf', {
    params: buildPayrollReportParams({ anio, mes, id_empleado }),
    responseType: 'blob',
    timeout: 30000
  })

  const filename = getFilenameFromDisposition(
    response.headers['content-disposition'],
    'reporte-nomina.pdf'
  )
  downloadBlob({ blob: response.data, filename })
}

export default {
  getPayrollReports,
  downloadPayrollReportExcel,
  downloadPayrollReportPdf
}


import {
  DEFAULT_PAYROLL_PARAMETERS,
  DIAS_NOMINA_MENSUAL,
  buildOvertimeTypes
} from './constants'

export const calculateWorkedDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0

  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
}

const parseParameterNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace('%', '').replace(',', '.').trim())
  return Number.isFinite(parsed) ? parsed : fallback
}

export const buildOvertimeRow = (typeKey = buildOvertimeTypes()[0].key) => ({
  id: Date.now() + Math.random(),
  typeKey,
  hours: 0
})

export const calculatePayrollSummary = ({
  selectedEmployee,
  payrollDates,
  overtimeRows,
  payrollParameters = DEFAULT_PAYROLL_PARAMETERS
}) => {
  const salarioBase = Number(selectedEmployee?.sueldo) || 0
  const diasTrabajados = calculateWorkedDays(payrollDates.startDate, payrollDates.endDate)
  const valorDia = salarioBase / DIAS_NOMINA_MENSUAL
  const horasMensualesReferencia = Math.max(parseParameterNumber(payrollParameters.horasSemanales, 47) * 4, 1)
  const valorHoraOrdinaria = salarioBase / horasMensualesReferencia
  const overtimeTypes = buildOvertimeTypes(payrollParameters)
  const subsidioTransporte = parseParameterNumber(payrollParameters.subsidioTransporte, 0)

  const detallesHorasExtra = overtimeRows.map((row) => {
    const overtimeType = overtimeTypes.find((item) => item.key === row.typeKey) || overtimeTypes[0]
    const valorHoraExtra = valorHoraOrdinaria * (1 + overtimeType.surcharge)
    const totalFila = (Number(row.hours) || 0) * valorHoraExtra

    return {
      ...row,
      overtimeType,
      valorHoraExtra,
      totalFila
    }
  })

  const totalHorasExtra = detallesHorasExtra.reduce((acc, row) => acc + row.totalFila, 0)
  const pagoBasicoPeriodo = valorDia * diasTrabajados
  const baseDeducciones = pagoBasicoPeriodo + totalHorasExtra
  const pension = baseDeducciones * (parseParameterNumber(payrollParameters.pensionEmpleado, 4) / 100)
  const salud = baseDeducciones * (parseParameterNumber(payrollParameters.saludEmpleado, 4) / 100)
  const totalDeducciones = pension + salud
  const subtotalBruto = pagoBasicoPeriodo + totalHorasExtra + subsidioTransporte
  const neto = subtotalBruto - totalDeducciones

  return {
    diasTrabajados,
    pagoBasicoPeriodo,
    valorHoraOrdinaria,
    detallesHorasExtra,
    totalHorasExtra,
    subsidioTransporte,
    pension,
    salud,
    totalDeducciones,
    subtotalBruto,
    neto
  }
}

export const buildPayrollPayload = ({ selectedEmployee, payrollDates, payrollSummary }) => {
  const overtimeRowsToSave = payrollSummary.detallesHorasExtra
    .filter((row) => Number(row.hours) > 0)

  const horas_extras = overtimeRowsToSave.map((row) => ({
    tipo_hora: row.overtimeType.dbType,
    porcentaje_recargo: row.overtimeType.surcharge * 100,
    horas: Number(row.hours),
    valor_hora_base: payrollSummary.valorHoraOrdinaria,
    valor_hora_extra: row.valorHoraExtra,
    valor_total: row.totalFila
  }))

  const detalles = [
    { concepto: `Pago base (${payrollSummary.diasTrabajados} días)`, valor: payrollSummary.pagoBasicoPeriodo },
    ...overtimeRowsToSave.map((row) => ({
      concepto: `${row.overtimeType.label} (${row.hours}h)`,
      valor: row.totalFila
    })),
    { concepto: 'Subsidio de transporte', valor: payrollSummary.subsidioTransporte },
    { concepto: 'Salud 4%', valor: payrollSummary.salud },
    { concepto: 'Pensión 4%', valor: payrollSummary.pension }
  ]

  return {
    id_empleado: selectedEmployee.id_empleado,
    fecha_inicio: payrollDates.startDate,
    fecha_corte: payrollDates.endDate,
    tipo_pago: 'MENSUAL',
    detalles,
    horas_extras
  }
}

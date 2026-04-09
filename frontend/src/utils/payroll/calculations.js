import {
  DIAS_NOMINA_MENSUAL,
  HORAS_MENSUALES_REFERENCIA,
  OVERTIME_TYPES,
  SUBSIDIO_TRANSPORTE
} from './constants'

export const calculateWorkedDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0

  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
}

export const buildOvertimeRow = (typeKey = OVERTIME_TYPES[0].key) => ({
  id: Date.now() + Math.random(),
  typeKey,
  hours: 0
})

export const calculatePayrollSummary = ({ selectedEmployee, payrollDates, overtimeRows }) => {
  const salarioBase = Number(selectedEmployee?.sueldo) || 0
  const diasTrabajados = calculateWorkedDays(payrollDates.startDate, payrollDates.endDate)
  const valorDia = salarioBase / DIAS_NOMINA_MENSUAL
  const valorHoraOrdinaria = salarioBase / HORAS_MENSUALES_REFERENCIA

  const detallesHorasExtra = overtimeRows.map((row) => {
    const overtimeType = OVERTIME_TYPES.find((item) => item.key === row.typeKey) || OVERTIME_TYPES[0]
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
  const pension = baseDeducciones * 0.04
  const salud = baseDeducciones * 0.04
  const totalDeducciones = pension + salud
  const subtotalBruto = pagoBasicoPeriodo + totalHorasExtra + SUBSIDIO_TRANSPORTE
  const neto = subtotalBruto - totalDeducciones

  return {
    diasTrabajados,
    pagoBasicoPeriodo,
    valorHoraOrdinaria,
    detallesHorasExtra,
    totalHorasExtra,
    subsidioTransporte: SUBSIDIO_TRANSPORTE,
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

  const overtimeDetails = overtimeRowsToSave.map((row) => ({
    concepto: `${row.overtimeType.label} (${row.hours}h)`,
    valor: row.totalFila
  }))

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
    ...overtimeDetails,
    { concepto: 'Subsidio de transporte', valor: payrollSummary.subsidioTransporte },
    { concepto: 'Salud 4%', valor: payrollSummary.salud },
    { concepto: 'Pensión 4%', valor: payrollSummary.pension }
  ]

  return {
    id_empleado: selectedEmployee.id_empleado,
    fecha_inicio: payrollDates.startDate,
    fecha_corte: payrollDates.endDate,
    tipo_pago: 'MENSUAL',
    total_devengado: payrollSummary.subtotalBruto,
    total_deducciones: payrollSummary.totalDeducciones,
    detalles,
    horas_extras
  }
}

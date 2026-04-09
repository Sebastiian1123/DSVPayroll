export const getDefaultEmployeeFormData = () => ({
  nombres: '',
  apellidos: '',
  tipo_identificacion: 'CC',
  numero_identificacion: '',
  sueldo: '',
  fecha_nacimiento: '',
  fecha_ingreso: '',
  nombre_cargo: '',
  id_departamento: ''
})

export const buildEmployeeFormData = (employee) => ({
  nombres: employee.nombres || '',
  apellidos: employee.apellidos || '',
  tipo_identificacion: employee.tipo_identificacion || 'CC',
  numero_identificacion: employee.numero_identificacion || '',
  sueldo: employee.sueldo || '',
  fecha_nacimiento: employee.fecha_nacimiento?.split('T')[0] || '',
  fecha_ingreso: employee.fecha_ingreso?.split('T')[0] || '',
  nombre_cargo: employee.nombre_cargo || '',
  id_departamento: employee.id_departamento || ''
})

export const getMaxBirthDate = () => {
  const today = new Date()
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )

  return eighteenYearsAgo.toISOString().split('T')[0]
}

export const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

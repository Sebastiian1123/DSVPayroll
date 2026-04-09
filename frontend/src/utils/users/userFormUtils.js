export const getDefaultUserFormData = () => ({
  username: '',
  password: '',
  email: '',
  rol: 'EMPLEADO',
  id_empleado: ''
})

export const getDefaultEditUserFormData = () => ({
  email: '',
  rol: '',
  id_empleado: ''
})

export const buildEditUserFormData = (user) => ({
  email: user.email || '',
  rol: user.rol || '',
  id_empleado: user.id_empleado || ''
})

export const getRoleBadge = (rol) => {
  switch (rol) {
    case 'ADMINISTRADOR':
      return 'danger'
    case 'RRHH':
      return 'warning'
    case 'EMPLEADO':
      return 'info'
    default:
      return 'info'
  }
}

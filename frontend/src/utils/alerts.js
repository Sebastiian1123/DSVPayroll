import Swal from 'sweetalert2';

export const showSuccess = (title, text) =>
  Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Aceptar'
  });

export const showError = (title, text) =>
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Cerrar'
  });

export const showConfirmDelete = (text = 'Esta acción no se puede deshacer.') =>
  Swal.fire({
    title: '¿Estás seguro?',
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });

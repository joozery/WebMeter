import Swal from 'sweetalert2';

// SweetAlert Helper Functions
export const showSuccess = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#06b6d4',
    confirmButtonText: 'OK',
    background: '#ffffff',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'rounded-lg shadow-xl',
      title: 'text-gray-800 font-semibold'
    }
  });
};

export const showError = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK',
    background: '#ffffff',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'rounded-lg shadow-xl',
      title: 'text-gray-800 font-semibold'
    }
  });
};

export const showWarning = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'OK',
    background: '#ffffff',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'rounded-lg shadow-xl',
      title: 'text-gray-800 font-semibold'
    }
  });
};

export const showConfirm = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#06b6d4',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    background: '#ffffff',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'rounded-lg shadow-xl',
      title: 'text-gray-800 font-semibold'
    }
  });
};

export const showLoading = (title: string) => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    background: '#ffffff',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'rounded-lg shadow-xl'
    }
  });
};

export const showInfo = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'info',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'OK',
    background: '#ffffff',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'rounded-lg shadow-xl',
      title: 'text-gray-800 font-semibold'
    }
  });
};

// Custom themed alerts
export const showSuccessThemed = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Great!',
    background: '#f0fdf4',
    backdrop: 'rgba(16, 185, 129, 0.1)',
    customClass: {
      popup: 'rounded-xl shadow-2xl border border-green-200',
      title: 'text-green-800 font-bold text-xl',
      confirmButton: 'rounded-lg px-6 py-3 font-semibold'
    }
  });
};

export const showErrorThemed = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Got it',
    background: '#fef2f2',
    backdrop: 'rgba(220, 38, 38, 0.1)',
    customClass: {
      popup: 'rounded-xl shadow-2xl border border-red-200',
      title: 'text-red-800 font-bold text-xl',
      confirmButton: 'rounded-lg px-6 py-3 font-semibold'
    }
  });
};


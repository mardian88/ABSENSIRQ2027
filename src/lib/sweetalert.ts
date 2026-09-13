import Swal from 'sweetalert2';

export const showConfirm = async (title: string, text?: string, confirmText: string = 'Ya, Lanjutkan', isDestructive: boolean = true) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isDestructive ? '#ef4444' : '#059669', // rose-500 or emerald-600
    cancelButtonColor: '#94a3b8', // slate-400
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium shadow-sm',
      cancelButton: 'px-4 py-2 rounded-lg font-medium'
    }
  });
  return result.isConfirmed;
};

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#059669',
    confirmButtonText: 'Tutup',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium shadow-sm',
    }
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium shadow-sm',
    }
  });
};

export const showPrompt = async (title: string, inputType: 'text' | 'password' = 'text', confirmText: string = 'Simpan') => {
  const result = await Swal.fire({
    title,
    input: inputType,
    inputAttributes: {
      autocomplete: 'new-password',
      autocapitalize: 'off',
      'data-1p-ignore': 'true',
      'data-lpignore': 'true',
      'data-bwignore': 'true'
    },
    showCancelButton: true,
    confirmButtonColor: '#059669',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium shadow-sm',
      cancelButton: 'px-4 py-2 rounded-lg font-medium',
      input: 'rounded-lg border-slate-300'
    }
  });
  return result.isConfirmed ? result.value : null;
};

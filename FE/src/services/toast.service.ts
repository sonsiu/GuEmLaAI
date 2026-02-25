import type { ToastOptions } from 'react-toastify'
import { toast } from 'react-toastify'

interface CustomToastOptions extends ToastOptions {
  hideError?: boolean
}

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
}

export const showSuccessToast = (message: string, options?: CustomToastOptions) => {
  return toast.success(message, { ...defaultOptions, ...options })
}

export const showErrorToast = (message: string, options?: CustomToastOptions) => {
  return toast.error(message, { ...defaultOptions, ...options })
}

export const showWarningToast = (message: string, options?: CustomToastOptions) => {
  return toast.warning(message, { ...defaultOptions, ...options })
}

export const showInfoToast = (message: string, options?: CustomToastOptions) => {
  return toast.info(message, { ...defaultOptions, ...options })
}

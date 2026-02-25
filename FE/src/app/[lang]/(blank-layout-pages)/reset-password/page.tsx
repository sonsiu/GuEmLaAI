import type { Metadata } from 'next'
import ResetPassword from '@/views/Auth/ResetPassword/ResetPassword'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Create a new password'
}

const ResetPasswordPage = async () => {
  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <ResetPassword />
    </div>
  )
}

export default ResetPasswordPage

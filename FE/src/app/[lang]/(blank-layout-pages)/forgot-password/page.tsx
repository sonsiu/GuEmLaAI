import type { Metadata } from 'next'
import ForgotPassword from '@/views/Auth/ForgotPassword/ForgotPassword'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Request a password reset link'
}

const ForgotPasswordPage = async () => {
  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <ForgotPassword />
    </div>
  )
}

export default ForgotPasswordPage

import { NextResponse } from 'next/server'
import { authService, endSession } from '@/services/auth.service'

export async function POST() {
  const response = await authService.logout()

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  await Promise.all([endSession(res)])
  return res
}

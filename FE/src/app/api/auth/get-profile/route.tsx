import { NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function GET() {
  const response = await authService.getProfile()

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

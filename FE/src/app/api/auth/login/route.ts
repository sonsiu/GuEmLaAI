import { NextResponse } from 'next/server'
import { authService, startSession } from '@/services/auth.service'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await authService.login(body)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  if (response?.data?.accessToken && response?.data?.refreshToken) {
    await startSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      response: res
    })
  }

  return res
}

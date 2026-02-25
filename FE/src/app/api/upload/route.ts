import { NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await authService.upload(body)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

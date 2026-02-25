import { NextResponse } from 'next/server'
import { actionService } from '@/services/action.service'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await actionService.getAction(body)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

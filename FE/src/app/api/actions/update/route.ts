import { NextResponse } from 'next/server'
import { actionService } from '@/services/action.service'

export async function POST(request: Request) {
  const body = await request.json()
  const { _id, ...rest } = body

  const response = await actionService.updateAction(_id, rest)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

import { NextResponse } from 'next/server'
import { spiritService } from '@/services/spirit.service'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await spiritService.getAllFeedback(body)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

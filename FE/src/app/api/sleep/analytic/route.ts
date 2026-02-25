import { NextResponse } from 'next/server'
import { sleepService } from '@/services/sleep.service'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await sleepService.getSleepAnalytic(body)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

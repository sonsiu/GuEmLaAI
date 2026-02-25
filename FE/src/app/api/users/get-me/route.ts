import { NextResponse } from 'next/server'
import { userServerService } from '@/services/user.server.service'

export async function GET() {
  const response = await userServerService.getProfile()

  return NextResponse.json(response, {
    status: response.statusCode
  })
}

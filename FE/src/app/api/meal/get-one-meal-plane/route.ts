import { NextResponse } from 'next/server'
import { mealService } from '@/services/meal.service'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await mealService.getOneMealPlane(body)

  const res = NextResponse.json(response, {
    status: response.statusCode
  })

  return res
}

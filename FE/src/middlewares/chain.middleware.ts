import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type MiddlewareFunction = (req: NextRequest) => Promise<NextResponse | null> | NextResponse | null

export function chain(...middlewares: MiddlewareFunction[]) {
  return async (req: NextRequest) => {
    for (const middleware of middlewares) {
      const result = await middleware(req)

      if (result) return result
    }

    return NextResponse.next()
  }
}

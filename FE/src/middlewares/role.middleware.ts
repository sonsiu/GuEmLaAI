import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { PUBLIC_ROUTES, DEFAULT_REDIRECT_ROUTES, USER_ROLE } from './../@core/constants/global.const'

export async function roleMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = pathname.split('/')[1] || 'vi'
  const path = pathname.split('/')[2]

  if (PUBLIC_ROUTES.includes('/' + path)) return NextResponse.next()

  const accessToken = request.cookies.get('access_token')?.value

  if (accessToken) {
    try {
      const token = jwt.decode(accessToken) as any

      if (!token) return NextResponse.redirect(new URL(`/${locale}/login`, request.url))

      const role = token.role as USER_ROLE

      if (role === USER_ROLE.ADMIN) {
        if (pathname.startsWith(`/${locale}/admin`)) return NextResponse.next()
        else return NextResponse.redirect(new URL(`/${locale}${DEFAULT_REDIRECT_ROUTES[USER_ROLE.ADMIN]}`, request.url))
      }

      if (pathname.startsWith(`/${locale}/admin`)) {
        return NextResponse.redirect(new URL(`/${locale}${DEFAULT_REDIRECT_ROUTES[USER_ROLE.USER]}`, request.url))
      }

      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  // Nếu không có điều kiện nào thỏa mãn, trả về null
  return null
}

import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

export function setServerCookie(
  response: NextResponse,
  key: string,
  value: string,
  options: {
    httpOnly?: boolean
    secure?: boolean
    path?: string
    sameSite?: 'lax' | 'strict' | 'none'
    maxAge?: number
  } = {}
) {
  response.cookies.set({
    name: key,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    ...options
  })
}

export async function setServerCookieByNextHeaders(
  key: string,
  value: string,
  options: {
    httpOnly?: boolean
    secure?: boolean
    path?: string
    sameSite?: 'lax' | 'strict' | 'none'
    maxAge?: number
  } = {}
) {
  const cookieStore = await cookies()

  cookieStore.set({
    name: key,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    ...options
  })
}

export function removeServerCookie(response: NextResponse, key: string) {
  response.cookies.set({
    name: key,
    value: '',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict'
  })
}

export async function getServerCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies()

  return cookieStore.get(key)?.value
}

export function getServerCookieFromRequest(req: NextRequest, key: string): string | undefined {
  return req.cookies.get(key)?.value
}

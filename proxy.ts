import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const ADMIN_COOKIE = 'nv_admin'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route protection
  if (/\/admin(\/|$)/.test(pathname)) {
    const token = request.nextUrl.searchParams.get('token')
    const adminCookie = request.cookies.get(ADMIN_COOKIE)?.value

    if (token === process.env.ADMIN_TOKEN) {
      const response = intlMiddleware(request)
      response.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 8 })
      return response
    }

    if (!process.env.ADMIN_TOKEN || adminCookie !== process.env.ADMIN_TOKEN) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}

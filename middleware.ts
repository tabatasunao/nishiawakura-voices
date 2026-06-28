import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const ADMIN_COOKIE = 'nv_admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route protection
  if (pathname.includes('/admin')) {
    const token = request.nextUrl.searchParams.get('token')
    const adminCookie = request.cookies.get(ADMIN_COOKIE)?.value

    if (token === process.env.ADMIN_TOKEN) {
      // Valid token in URL — set cookie and redirect cleanly
      const response = intlMiddleware(request) ?? NextResponse.redirect(request.url)
      response.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'strict', maxAge: 60 * 60 * 8 })
      return response
    }

    if (adminCookie !== process.env.ADMIN_TOKEN) {
      // Unauthorized — redirect to home
      const home = new URL('/', request.url)
      return NextResponse.redirect(home)
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}

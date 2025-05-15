import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// List of public routes that don't require authentication
const publicRoutes = ["/", "/auth"]

const intlMiddleware = createMiddleware({
  locales: ["en", "de", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
})

export default async function middleware(req: NextRequest) {
  // Handle internationalization first
  const res = intlMiddleware(req)

  // Create Supabase middleware client
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  // Get the pathname from the URL
  const path = req.nextUrl.pathname

  // Check if the path is a public route or starts with a locale prefix followed by a public route
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || new RegExp(`^/(en|de|ar)${route === "/" ? "$" : route}`).test(path),
  )

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is logged in and trying to access the auth page, redirect to home
  const isAuthPage = path === "/auth" || /^\/(en|de|ar)\/auth$/.test(path)
  if (isAuthPage && session) {
    const locale = path.split("/")[1]
    const isLocale = ["en", "de", "ar"].includes(locale)
    const redirectUrl = new URL(isLocale ? `/${locale}` : "/", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute && !session) {
    const locale = path.split("/")[1]
    const isLocale = ["en", "de", "ar"].includes(locale)

    // Construct redirect URL with proper locale handling
    const redirectUrl = new URL(isLocale ? `/${locale}/auth` : "/auth", req.url)

    // Add the original URL as a parameter to redirect back after login
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)

    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}

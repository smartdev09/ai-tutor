import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// List of public routes that don't require authentication
const publicRoutes = ["/", "/auth"]

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create Supabase middleware client
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.includes(path)

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is logged in and trying to access the auth page, redirect to home
  if (path === "/auth" && session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute && !session) {
    const redirectUrl = new URL("/auth", req.url)
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protect admin routes
  if (path.startsWith("/admin")) {
    const token = request.cookies.get("cooperativa_token")?.value;
    
    if (!token) {
      // No token - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Fetch user profile to check role
    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // If we can't verify the profile, allow access (let the client-side guard handle it)
    if (!profileRes.ok) {
      return NextResponse.next();
    }
    
    const profile = await profileRes.json();
    
    // Redirect non-admin users away from admin routes
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
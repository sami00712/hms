import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: "/admin",
  RECEPTIONIST: "/receptionist",
  DOCTOR: "/doctor",
  LAB: "/lab",
  PHARMACIST: "/pharmacy",
  NURSE: "/receptionist"
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    if (!role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const allowedPrefix = ROLE_PREFIX[role];

    // Admin can access everything; others are locked to their own portal
    if (role !== "ADMIN" && allowedPrefix && !path.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: ["/admin/:path*", "/receptionist/:path*", "/doctor/:path*", "/lab/:path*", "/pharmacy/:path*"]
};

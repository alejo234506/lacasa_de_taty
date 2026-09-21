import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "casa_taty_session";

async function verify(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/panel")) {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token || !(await verify(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/acceso";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/acceso") {
    const token = req.cookies.get(COOKIE)?.value;
    if (token && (await verify(token))) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/panel", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/acceso", "/admin"],
};

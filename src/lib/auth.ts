import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "casa_taty_session";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Define JWT_SECRET en .env.local");
  return new TextEncoder().encode(s);
}

export async function createSession(staffId: string) {
  return new SignJWT({ staffId, role: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { staffId: string; role: string };
  } catch {
    return null;
  }
}

export async function requireStaff() {
  const session = await getSession();
  if (!session?.staffId) return null;
  return session;
}

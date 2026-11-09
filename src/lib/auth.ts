import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "casa_taty_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Define JWT_SECRET en .env.local");
  return new TextEncoder().encode(s);
}

function readCookie(req: Request, name: string) {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export async function createSession(staffId: string) {
  return new SignJWT({ staffId, role: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Valor para la cabecera Set-Cookie que guarda la sesión. */
export function sessionCookie(token: string, req: Request) {
  // Solo "Secure" si llega por HTTPS (Vercel); en la red local (http://192.168...) el navegador la descartaría.
  const https = req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${https ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export async function getSession(req: Request) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { staffId: string; role: string };
  } catch {
    return null;
  }
}

export async function requireStaff(req: Request) {
  const session = await getSession(req);
  if (!session?.staffId) return null;
  return session;
}

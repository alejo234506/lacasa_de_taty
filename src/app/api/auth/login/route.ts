import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, shouldAttemptMongo } from "@/lib/mongodb";
import { createSession, setSessionCookie } from "@/lib/auth";
import { Staff } from "@/models/Staff";
import { ensureSeed } from "@/lib/ensure-seed";
import { DEV_STAFF_ID } from "@/lib/dev-store";

const DEV_EMAIL = "taty@casadetaty.com";
const DEV_PASSWORD = "casa2026";

async function localLogin(normalized: string, password: string) {
  if (normalized === DEV_EMAIL && password === DEV_PASSWORD) {
    const token = await createSession(DEV_STAFF_ID);
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, nombre: "Taty M.", rol: "admin", modo: "local" });
  }
  return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();

  if (!shouldAttemptMongo()) {
    if (process.env.NODE_ENV === "development") {
      return localLogin(normalized, password);
    }
    return NextResponse.json(
      {
        error:
          "Base de datos no conectada. Configura MongoDB Atlas en .env.local",
      },
      { status: 503 }
    );
  }

  try {
    await connectDB();
    await ensureSeed();

    const staff = await Staff.findOne({ email: normalized });
    if (!staff) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await createSession(staff._id.toString());
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, nombre: staff.nombre, rol: staff.rol });
  } catch {
    if (process.env.NODE_ENV === "development") {
      return localLogin(normalized, password);
    }

    return NextResponse.json(
      {
        error:
          "Base de datos no conectada. En local usa taty@casadetaty.com / casa2026 — o configura MongoDB Atlas en .env.local",
      },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { ensureSeed } from "@/lib/ensure-seed";
import { connectDB, shouldAttemptMongo } from "@/lib/mongodb";

export async function POST() {
  if (!shouldAttemptMongo()) {
    return NextResponse.json({
      ok: true,
      message: "Modo local activo (sin MongoDB). Usa taty@casadetaty.com / casa2026",
      staff: { email: "taty@casadetaty.com", password: "casa2026" },
      modo: "local",
    });
  }

  try {
    await connectDB();
    await ensureSeed();
    return NextResponse.json({
      ok: true,
      message: "Base de datos MongoDB conectada",
      staff: { email: "taty@casadetaty.com", password: "casa2026" },
    });
  } catch {
    return NextResponse.json({
      ok: true,
      message: "Modo local activo (sin MongoDB). Usa taty@casadetaty.com / casa2026",
      staff: { email: "taty@casadetaty.com", password: "casa2026" },
      modo: "local",
    });
  }
}

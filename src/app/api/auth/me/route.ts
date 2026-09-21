import { NextResponse } from "next/server";
import { connectDB, shouldAttemptMongo } from "@/lib/mongodb";
import { requireStaff } from "@/lib/auth";
import { Staff } from "@/models/Staff";
import { DEV_STAFF_ID } from "@/lib/dev-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!shouldAttemptMongo() || session.staffId === DEV_STAFF_ID) {
    return NextResponse.json({
      nombre: "Taty M.",
      email: "taty@casadetaty.com",
      rol: "admin",
    });
  }

  try {
    await connectDB();
    const staff = await Staff.findById(session.staffId).select("nombre email rol");
    if (!staff) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      nombre: staff.nombre,
      email: staff.email,
      rol: staff.rol,
    });
  } catch {
    return NextResponse.json({
      nombre: "Taty M.",
      email: "taty@casadetaty.com",
      rol: "admin",
    });
  }
}

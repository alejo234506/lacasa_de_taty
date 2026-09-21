import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { devRoomAction, updateDevRoom } from "@/lib/dev-store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const roomId = Number(id);
  const body = await req.json();

  if (body.action) {
    const room = devRoomAction(roomId, body.action, {
      ocupante: body.ocupante,
      tarifa: body.tarifa,
      consumo: body.consumo,
    });
    if (!room) {
      return NextResponse.json({ error: "Habitación no encontrada" }, { status: 404 });
    }
    return NextResponse.json(room);
  }

  const room = updateDevRoom(roomId, body);
  if (!room) {
    return NextResponse.json({ error: "Habitación no encontrada" }, { status: 404 });
  }
  return NextResponse.json(room);
}

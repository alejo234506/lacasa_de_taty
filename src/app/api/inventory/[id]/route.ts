import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { updateDevInventory } from "@/lib/dev-store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const item = updateDevInventory(id, Number(body.cantidad));
  if (!item) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json(item);
}

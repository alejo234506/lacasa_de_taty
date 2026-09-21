import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { deleteDevSale } from "@/lib/dev-store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const ok = deleteDevSale(id);
  if (!ok) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

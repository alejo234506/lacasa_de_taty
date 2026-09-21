import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import { createDevSale, getDevSales } from "@/lib/dev-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }
  return noStoreJson(getDevSales());
}

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const body = await req.json();
  const { tipo, cliente, pago, total } = body;

  if (!tipo || !cliente || !pago || typeof total !== "number") {
    return noStoreJson({ error: "Datos incompletos" }, 400);
  }

  const sale = createDevSale({ tipo, cliente, pago, total });
  return noStoreJson(sale);
}

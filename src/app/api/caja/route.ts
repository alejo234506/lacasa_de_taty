import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import {
  arqueoDevCaja,
  createDevExpense,
  deleteDevExpense,
  getDevCaja,
  reponerDevCaja,
} from "@/lib/dev-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }
  return noStoreJson(getDevCaja());
}

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const body = await req.json();

  if (body.action === "gasto") {
    const expense = createDevExpense({
      concepto: body.concepto,
      rubro: body.rubro || "Otros",
      monto: Number(body.monto),
    });
    return noStoreJson(expense);
  }

  if (body.action === "reponer") {
    const saldo = reponerDevCaja(Number(body.monto) || 0);
    return noStoreJson({ saldo });
  }

  if (body.action === "arqueo") {
    const diff = arqueoDevCaja(Number(body.saldoReal));
    return noStoreJson({ diff, saldo: getDevCaja().saldo });
  }

  if (body.action === "eliminar") {
    const ok = deleteDevExpense(body.id);
    if (!ok) {
      return noStoreJson({ error: "Gasto no encontrado" }, 404);
    }
    return noStoreJson({ ok: true, saldo: getDevCaja().saldo });
  }

  return noStoreJson({ error: "Acción no válida" }, 400);
}

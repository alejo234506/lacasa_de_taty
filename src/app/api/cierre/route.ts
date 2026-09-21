import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import { cerrarDevPeriodo, getDevCierre } from "@/lib/dev-store";
import { loadActiveResidents } from "@/lib/residents-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }
  const residents = await loadActiveResidents();
  return noStoreJson(getDevCierre(residents));
}

export async function POST() {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }
  cerrarDevPeriodo();
  return noStoreJson({ ok: true, cerrado: true });
}

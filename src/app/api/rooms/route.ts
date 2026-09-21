import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import { getDevRooms } from "@/lib/dev-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  return noStoreJson(getDevRooms());
}

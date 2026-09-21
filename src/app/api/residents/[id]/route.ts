import { randomUUID } from "crypto";
import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import { withMongoOrDev } from "@/lib/mongodb";
import { Resident, residentLink } from "@/models/Resident";
import {
  updateDevResident,
  deleteDevResident,
  regenerateDevResidentLink,
  devResidentToJson,
} from "@/lib/dev-store";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.nombre === "string") update.nombre = body.nombre;
  if (typeof body.documento === "string") update.documento = body.documento;
  if (typeof body.habitacion === "string") update.habitacion = body.habitacion;
  if (typeof body.grupo === "string") update.grupo = body.grupo;
  if (typeof body.saldo === "number") update.saldo = body.saldo;
  if (typeof body.tarifaMensual === "number") update.tarifaMensual = body.tarifaMensual;
  if (typeof body.comidaIncluida === "boolean") update.comidaIncluida = body.comidaIncluida;
  if (typeof body.estudios === "string") update.estudios = body.estudios;

  const resident = await withMongoOrDev(
    async () => {
      const doc = await Resident.findByIdAndUpdate(id, update, { new: true });
      if (!doc) return null;
      return devResidentToJson({
        id: doc._id.toString(),
        nombre: doc.nombre,
        documento: doc.documento,
        habitacion: doc.habitacion,
        grupo: doc.grupo,
        comidaIncluida: doc.comidaIncluida,
        tarifaMensual: doc.tarifaMensual,
        saldo: doc.saldo,
        accessToken: doc.accessToken,
        activo: doc.activo,
        estudios: doc.estudios || "",
      });
    },
    () => {
      const doc = updateDevResident(id, update as Parameters<typeof updateDevResident>[1]);
      return doc ? devResidentToJson(doc) : null;
    }
  );

  if (!resident) {
    return noStoreJson({ error: "Residente no encontrado" }, 404);
  }
  return noStoreJson(resident);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const { id } = await params;

  const result = await withMongoOrDev(
    async () => {
      const newToken = randomUUID();
      const resident = await Resident.findByIdAndUpdate(id, { accessToken: newToken }, { new: true });
      if (!resident) return null;
      return { link: residentLink(newToken) };
    },
    () => regenerateDevResidentLink(id)
  );

  if (!result) {
    return noStoreJson({ error: "Residente no encontrado" }, 404);
  }
  return noStoreJson({
    link: result.link,
    message: "Link regenerado. El anterior ya no funciona.",
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const { id } = await params;

  const ok = await withMongoOrDev(
    async () => {
      const resident = await Resident.findByIdAndUpdate(id, { activo: false }, { new: true });
      return Boolean(resident);
    },
    () => Boolean(deleteDevResident(id))
  );

  if (!ok) {
    return noStoreJson({ error: "Residente no encontrado" }, 404);
  }
  return noStoreJson({ ok: true });
}

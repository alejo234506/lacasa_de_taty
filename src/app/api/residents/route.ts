import { randomUUID } from "crypto";
import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import { withMongoOrDev } from "@/lib/mongodb";
import { Resident, residentLink } from "@/models/Resident";
import {
  getDevResidents,
  createDevResident,
  devResidentToJson,
} from "@/lib/dev-store";

export const dynamic = "force-dynamic";

function toJson(r: {
  _id: { toString(): string };
  nombre: string;
  documento: string;
  habitacion: string;
  grupo: string;
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  estudios?: string;
  accessToken: string;
}) {
  return {
    id: r._id.toString(),
    nombre: r.nombre,
    documento: r.documento,
    habitacion: r.habitacion,
    grupo: r.grupo,
    comidaIncluida: r.comidaIncluida,
    tarifaMensual: r.tarifaMensual,
    saldo: r.saldo,
    estudios: r.estudios || "",
    link: residentLink(r.accessToken),
  };
}

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const residents = await withMongoOrDev(
    async () => {
      const docs = await Resident.find({ activo: true }).sort({ nombre: 1 });
      return docs.map(toJson);
    },
    () => getDevResidents().map(devResidentToJson)
  );

  return noStoreJson(residents);
}

export async function POST(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const body = await req.json();
  const { nombre, documento, habitacion, grupo, comidaIncluida, tarifaMensual, saldo, estudios } = body;

  if (!nombre || !documento || !habitacion || !grupo || typeof tarifaMensual !== "number") {
    return noStoreJson({ error: "Datos incompletos" }, 400);
  }

  const created = await withMongoOrDev(
    async () => {
      const resident = await Resident.create({
        nombre,
        documento,
        habitacion,
        grupo,
        comidaIncluida: comidaIncluida ?? true,
        tarifaMensual,
        saldo: saldo ?? 0,
        estudios: estudios ?? "",
        accessToken: randomUUID(),
        activo: true,
      });
      return toJson(resident);
    },
    () =>
      devResidentToJson(
        createDevResident({
          nombre,
          documento,
          habitacion,
          grupo,
          comidaIncluida: comidaIncluida ?? true,
          tarifaMensual,
          saldo: saldo ?? 0,
          estudios: estudios ?? "",
        })
      )
  );

  return noStoreJson(created);
}

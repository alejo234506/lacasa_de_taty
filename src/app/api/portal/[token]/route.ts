import { noStoreJson } from "@/lib/api-response";
import { withMongoOrDev } from "@/lib/mongodb";
import { Resident } from "@/models/Resident";
import { Minuta } from "@/models/Minuta";
import { currentMinutaWeek, getDevMinutaWeek, getDevResidentByToken } from "@/lib/dev-store";

export const dynamic = "force-dynamic";

function normalizeMinuta(
  dias: { dia: string; desayuno?: string; almuerzo: string; cena: string }[],
  fallback: { dia: string; desayuno: string; almuerzo: string; cena: string }[]
) {
  return dias.map((d, i) => ({
    dia: d.dia,
    desayuno: d.desayuno ?? fallback[i]?.desayuno ?? "Desayuno casero",
    almuerzo: d.almuerzo,
    cena: d.cena,
  }));
}

function payload(resident: {
  nombre: string;
  habitacion: string;
  grupo: string;
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  estudios?: string;
}, minuta: { dia: string; desayuno: string; almuerzo: string; cena: string }[]) {
  const reg = resident.grupo === "REGULAR_13_20";
  return {
    nombre: resident.nombre,
    habitacion: resident.habitacion,
    grupo: reg ? "Regular" : "Medicina",
    ventana: reg ? "13 → 20 de cada mes" : "30 → 05 de cada mes",
    comidaIncluida: resident.comidaIncluida,
    tarifaMensual: resident.tarifaMensual,
    saldo: resident.saldo,
    estudios: resident.estudios || "",
    alDia: resident.saldo === 0,
    minuta,
    mesLabel: "Septiembre 2026",
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const mes = new Date().toISOString().slice(0, 7);
  const semana = currentMinutaWeek();
  const fallbackMinuta = getDevMinutaWeek(mes, semana).dias;

  const data = await withMongoOrDev(
    async () => {
      const resident = await Resident.findOne({ accessToken: token, activo: true });
      if (!resident) return null;
      const minuta = await Minuta.findOne({ mes, semana });
      return payload(resident, normalizeMinuta(minuta?.dias ?? fallbackMinuta, fallbackMinuta));
    },
    () => {
      const resident = getDevResidentByToken(token);
      if (!resident) return null;
      return payload(resident, fallbackMinuta);
    }
  );

  if (!data) {
    return noStoreJson({ error: "Link no válido o expirado" }, 404);
  }
  return noStoreJson(data);
}

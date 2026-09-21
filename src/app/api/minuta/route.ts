import { requireStaff } from "@/lib/auth";
import { noStoreJson } from "@/lib/api-response";
import { withMongoOrDev } from "@/lib/mongodb";
import { Minuta } from "@/models/Minuta";
import { DIAS, MINUTA_BASE } from "@/lib/data";
import { getDevMinutaWeek, saveDevMinuta } from "@/lib/dev-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const { searchParams } = new URL(req.url);
  const semana = Number(searchParams.get("semana") || "1");
  const mes = searchParams.get("mes") || new Date().toISOString().slice(0, 7);

  const doc = await withMongoOrDev(
    async () => {
      let found = await Minuta.findOne({ mes, semana });
      if (!found) {
        found = await Minuta.create({
          mes,
          semana,
          dias: DIAS.map((dia, i) => {
            const shift = (i + semana) % 7;
            return {
              dia,
              desayuno: MINUTA_BASE[shift][0],
              almuerzo: MINUTA_BASE[shift][1],
              cena: MINUTA_BASE[shift][2],
            };
          }),
        });
      }
      return { mes: found.mes, semana: found.semana, dias: found.dias };
    },
    () => getDevMinutaWeek(mes, semana)
  );

  return noStoreJson(doc);
}

export async function PUT(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return noStoreJson({ error: "No autorizado" }, 401);
  }

  const body = await req.json();
  const { mes, semana, dias } = body;

  const saved = await withMongoOrDev(
    async () => {
      const doc = await Minuta.findOneAndUpdate(
        { mes, semana },
        { dias },
        { upsert: true, new: true }
      );
      return { ok: true, dias: doc.dias };
    },
    () => {
      saveDevMinuta(mes, semana, dias);
      return { ok: true, dias };
    }
  );

  return noStoreJson(saved);
}

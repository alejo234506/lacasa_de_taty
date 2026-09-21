import { withMongoOrDev } from "@/lib/mongodb";
import { Resident } from "@/models/Resident";
import { getDevResidents, type ResidentFinance } from "@/lib/dev-store";

export async function loadActiveResidents(): Promise<ResidentFinance[]> {
  return withMongoOrDev(
    async () => {
      const docs = await Resident.find({ activo: true }).select("nombre habitacion saldo tarifaMensual");
      return docs.map((r) => ({
        nombre: r.nombre,
        habitacion: r.habitacion,
        saldo: r.saldo,
        tarifaMensual: r.tarifaMensual,
      }));
    },
    () =>
      getDevResidents().map((r) => ({
        nombre: r.nombre,
        habitacion: r.habitacion,
        saldo: r.saldo,
        tarifaMensual: r.tarifaMensual,
      }))
  );
}

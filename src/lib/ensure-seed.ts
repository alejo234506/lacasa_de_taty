import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Staff } from "@/models/Staff";
import { Resident } from "@/models/Resident";
import { Minuta } from "@/models/Minuta";
import { PENS_BASE, DIAS, MINUTA_BASE } from "@/lib/data";

export async function ensureSeed() {
  await connectDB();

  const staffCount = await Staff.countDocuments();
  if (staffCount === 0) {
    const hash = await bcrypt.hash("casa2026", 10);
    await Staff.create({
      nombre: "Taty M.",
      email: "taty@casadetaty.com",
      passwordHash: hash,
      rol: "admin",
    });
  }

  const residentCount = await Resident.countDocuments();
  if (residentCount === 0) {
    for (const p of PENS_BASE) {
      const [nombre, documento, habitacion, grupo, comida, tarifa, saldo, estudios] = p;
      await Resident.create({
        nombre,
        documento,
        habitacion,
        grupo,
        comidaIncluida: comida,
        tarifaMensual: tarifa,
        saldo,
        estudios,
        accessToken: randomUUID(),
        activo: true,
      });
    }
  }

  const mes = "2026-09";
  for (let semana = 1; semana <= 4; semana++) {
    const exists = await Minuta.findOne({ mes, semana });
    if (!exists) {
      await Minuta.create({
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
  }

  return { seeded: true };
}

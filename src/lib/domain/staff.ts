import bcrypt from "bcryptjs";
import { repo } from "../db/repo";
import { DIAS, MINUTA_BASE } from "../data";

export interface StaffDoc {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: "admin" | "recepcion";
}

export interface MinutaDoc {
  id: string;
  mes: string;
  semana: number;
  dias: { dia: string; desayuno: string; almuerzo: string; cena: string }[];
}

const staffs = repo<StaffDoc>("staffs");
const minutas = repo<MinutaDoc>("minutas");

let seeded: Promise<void> | null = null;

/** Crea la usuaria administradora inicial si no hay personal registrado. */
export function ensureStaff() {
  seeded ??= (async () => {
    if ((await staffs.count()) === 0) {
      await staffs.create({
        nombre: "Taty M.",
        email: "taty@casadetaty.com",
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "casa2026", 10),
        rol: "admin",
      });
    }
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

export async function findStaffByEmail(email: string) {
  await ensureStaff();
  return (await staffs.list({ email })).at(0) ?? null;
}

export async function getStaff(id: string) {
  return staffs.get(id);
}

function minutaBase(semana: number) {
  return DIAS.map((dia, i) => {
    const shift = (i + semana) % 7;
    return { dia, desayuno: MINUTA_BASE[shift][0], almuerzo: MINUTA_BASE[shift][1], cena: MINUTA_BASE[shift][2] };
  });
}

export async function getMinuta(mes: string, semana: number) {
  const found = (await minutas.list({ mes, semana })).at(0);
  if (found) {
    const base = minutaBase(semana);
    return { mes, semana, dias: found.dias.map((d, i) => ({ ...d, desayuno: d.desayuno ?? base[i]?.desayuno ?? "Desayuno casero" })) };
  }
  return { mes, semana, dias: minutaBase(semana) };
}

export async function saveMinuta(mes: string, semana: number, dias: MinutaDoc["dias"]) {
  const found = (await minutas.list({ mes, semana })).at(0);
  if (found) await minutas.update(found.id, { dias });
  else await minutas.create({ id: `${mes}-${semana}`, mes, semana, dias });
  return { ok: true, dias };
}

export function currentMinutaWeek(date = new Date()) {
  return Math.min(4, Math.max(1, Math.ceil(date.getDate() / 7)));
}

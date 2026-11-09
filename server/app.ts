import { Hono, type Context } from "hono";
import bcrypt from "bcryptjs";
import { publicRoute, readBody, staffRoute, type RouteHandler } from "../src/lib/api-handler";
import { noStoreJson } from "../src/lib/api-response";
import { clearSessionCookie, createSession, requireStaff, sessionCookie } from "../src/lib/auth";
import { backend, repo } from "../src/lib/db/repo";
import {
  AppError,
  addConsumo,
  anularPago,
  arqueoCaja,
  cargarPeriodo,
  cargarPeriodoTodos,
  cerrarPeriodo,
  checkIn,
  checkOut,
  comidaMensualEquivalente,
  crearGasto,
  crearItem,
  crearReporte,
  crearVenta,
  createResident,
  createRoom,
  dashboard,
  deactivateResident,
  deleteRoom,
  editarItem,
  eliminarGasto,
  eliminarItem,
  eliminarVenta,
  ensureData,
  estadoCuenta,
  getCaja,
  getPago,
  listInventario,
  listPagos,
  listReportes,
  listResidents,
  listRooms,
  listStays,
  listVentas,
  movimientoInventario,
  periodoDe,
  periodoLabel,
  regenerateLink,
  registrarPago,
  reponerCaja,
  residentByToken,
  resolverReporte,
  resumenPeriodo,
  separarRoom,
  setBaseCaja,
  setRoomEstado,
  unirRooms,
  updateResident,
  updateRoom,
} from "../src/lib/domain/service";
import {
  currentMinutaWeek,
  ensureStaff,
  findStaffByEmail,
  getMinuta,
  getStaff,
  saveMinuta,
  type MinutaDoc,
} from "../src/lib/domain/staff";
import type { ReportePago, RoomBaseStatus } from "../src/lib/domain/types";

const q = (req: Request, key: string) => new URL(req.url).searchParams.get(key);

/** Adapta un handler (Request, params) => Response a Hono. */
const h = (fn: RouteHandler) => (c: Context) => fn(c.req.raw, c.req.param() as Record<string, string>);

type Id = { id: string };

export const app = new Hono().basePath("/api");

// ---------- Autenticación ----------
app.post("/auth/login", async (c) => {
  const { email, password } = await c.req.raw.json().catch(() => ({}));
  if (!email || !password) return noStoreJson({ error: "Correo y contraseña requeridos" }, 400);
  try {
    const staff = await findStaffByEmail(String(email).toLowerCase().trim());
    if (!staff || !(await bcrypt.compare(String(password), staff.passwordHash))) {
      return noStoreJson({ error: "Credenciales incorrectas" }, 401);
    }
    await ensureData();
    const token = await createSession(staff.id);
    return noStoreJson(
      { ok: true, nombre: staff.nombre, rol: staff.rol },
      { headers: { "Set-Cookie": sessionCookie(token, c.req.raw) } }
    );
  } catch (e) {
    console.error(e);
    return noStoreJson({ error: "No se pudo conectar con la base de datos. Revisa la configuración del servidor." }, 503);
  }
});

app.post("/auth/logout", () => noStoreJson({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } }));

app.get("/auth/me", async (c) => {
  const session = await requireStaff(c.req.raw);
  if (!session) return noStoreJson({ error: "No autorizado" }, 401);
  try {
    const staff = await getStaff(session.staffId);
    if (!staff) return noStoreJson({ error: "No autorizado" }, 401);
    return noStoreJson({ nombre: staff.nombre, email: staff.email, rol: staff.rol });
  } catch {
    return noStoreJson({ error: "Base de datos no disponible" }, 503);
  }
});

/** Prepara la base de datos (tablas y datos iniciales) e informa qué motor está en uso. */
app.post("/seed", async () => {
  try {
    const modo = await backend();
    await ensureStaff();
    await ensureData();
    return noStoreJson({ ok: true, modo });
  } catch (e) {
    return noStoreJson({ ok: false, error: (e as Error).message }, 503);
  }
});

// ---------- Caja / gastos ----------
app.get("/caja", h(staffRoute(async (req) => getCaja(q(req, "periodo") || undefined))));
app.post(
  "/caja",
  h(
    staffRoute(async (req) => {
      const body = await readBody(req);
      switch (body.action) {
        case "gasto":
          return crearGasto(body);
        case "eliminar":
          return eliminarGasto(String(body.id));
        case "reponer":
          return reponerCaja();
        case "arqueo":
          return arqueoCaja(body.saldoReal);
        case "base":
          return setBaseCaja(body.base);
        default:
          throw new AppError("Acción no válida");
      }
    })
  )
);

/** Genera mensualidades (o semana de comida) para todos los pensionados activos. */
app.post(
  "/cargos",
  h(
    staffRoute(async (req) => {
      const body = await readBody(req);
      return cargarPeriodoTodos(body.tipo === "SEMANA_COMIDA" ? "SEMANA_COMIDA" : "MES");
    })
  )
);

// ---------- Cierre ----------
app.get("/cierre", h(staffRoute(async (req) => resumenPeriodo(q(req, "periodo") || undefined))));
app.post(
  "/cierre",
  h(
    staffRoute(async (req) => {
      const body = await readBody(req);
      return cerrarPeriodo(typeof body.periodo === "string" ? body.periodo : periodoDe(), body.action === "reabrir");
    })
  )
);

app.get("/dashboard", h(staffRoute(() => dashboard())));

// ---------- Inventario ----------
app.get("/inventory", h(staffRoute(() => listInventario())));
app.post("/inventory", h(staffRoute(async (req) => crearItem(await readBody(req)))));
app.patch(
  "/inventory/:id",
  h(
    staffRoute<Id>(async (req, { id }) => {
      const body = await readBody(req);
      if (body.action === "movimiento") return movimientoInventario(id, body);
      return editarItem(id, body);
    })
  )
);
app.delete("/inventory/:id", h(staffRoute<Id>((_req, { id }) => eliminarItem(id))));

// ---------- Minuta ----------
app.get(
  "/minuta",
  h(
    staffRoute(async (req) => {
      const semana = Number(q(req, "semana") || "1");
      const mes = q(req, "mes") || periodoDe();
      return getMinuta(mes, semana);
    })
  )
);
app.put(
  "/minuta",
  h(
    staffRoute(async (req) => {
      const { mes, semana, dias } = await readBody(req);
      if (typeof mes !== "string" || !Array.isArray(dias)) throw new AppError("Datos incompletos");
      return saveMinuta(mes, Number(semana), dias as MinutaDoc["dias"]);
    })
  )
);

// ---------- Pagos ----------
app.get(
  "/pagos",
  h(staffRoute(async (req) => listPagos({ residentId: q(req, "residentId") || undefined, periodo: q(req, "periodo") || undefined })))
);
app.post("/pagos", h(staffRoute(async (req) => registrarPago(await readBody(req)))));
app.get("/pagos/:id", h(staffRoute<Id>((_req, { id }) => getPago(id))));
/** Anula la factura y devuelve el saldo a los pensionados. */
app.delete("/pagos/:id", h(staffRoute<Id>((_req, { id }) => anularPago(id))));

// ---------- Portal del pensionado (público) ----------
app.get(
  "/portal/:token",
  h(
    publicRoute<{ token: string }>(async (_req, { token }) => {
      const resident = await residentByToken(token);
      if (!resident) throw new AppError("Link no válido o expirado", 404);

      const mes = periodoDe();
      const semana = currentMinutaWeek();
      const { dias: minuta } = await getMinuta(mes, semana);

      const [pagos, reportes] = await Promise.all([
        listPagos({ residentId: resident.id }),
        repo<ReportePago>("reportes").list({ residentId: resident.id }),
      ]);

      const reg = resident.grupo === "REGULAR_13_20";
      const comidaMes = comidaMensualEquivalente(resident);
      return {
        nombre: resident.nombre,
        habitacion: resident.habitacion,
        grupo: reg ? "Regular" : "Medicina",
        ventana: reg ? "13 → 20 de cada mes" : "30 → 05 de cada mes",
        comidaIncluida: resident.planComida !== "NINGUNO",
        planComida: resident.planComida,
        tarifaHabitacion: resident.tarifaHabitacion,
        tarifaComida: resident.tarifaComida,
        tarifaMensual: resident.tarifaHabitacion + comidaMes,
        saldo: resident.saldo,
        estudios: resident.estudios,
        alDia: resident.saldo <= 0,
        minuta,
        mesLabel: periodoLabel(mes),
        pagos: pagos
          .filter((p) => !p.anulado)
          .slice(0, 12)
          .map((p) => ({
            numero: p.numero,
            fecha: p.fecha,
            metodo: p.metodo,
            monto: p.asignaciones?.find((a) => a.residentId === resident.id)?.monto ?? p.total,
          })),
        reportes: reportes
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
          .slice(0, 6)
          .map((r) => ({ fecha: r.fecha, monto: r.monto, metodo: r.metodo, estado: r.estado, motivo: r.motivo })),
      };
    })
  )
);
/** El pensionado avisa que pagó (describe la captura en texto). Queda pendiente de verificación. */
app.post(
  "/portal/:token",
  h(
    publicRoute<{ token: string }>(async (req, { token }) => {
      const rep = await crearReporte(token, await readBody(req));
      return { ok: true, id: rep.id, message: "Recibimos tu aviso de pago. Recepción lo verificará y generará tu factura." };
    })
  )
);

// ---------- Reportes de pago ----------
app.get(
  "/reportes",
  h(
    staffRoute(async (req) => {
      const estado = q(req, "estado");
      return listReportes(estado === "PENDIENTE" || estado === "APROBADO" || estado === "RECHAZADO" ? estado : undefined);
    })
  )
);
app.patch(
  "/reportes/:id",
  h(
    staffRoute<Id>(async (req, { id }) => {
      const body = await readBody(req);
      return resolverReporte(id, body.action === "rechazar" ? "rechazar" : "aprobar", body);
    })
  )
);

// ---------- Pensionados ----------
app.get("/residents", h(staffRoute(() => listResidents())));
app.post("/residents", h(staffRoute(async (req) => createResident(await readBody(req)))));
/** Estado de cuenta: cargos, pagos y reportes del pensionado. */
app.get("/residents/:id", h(staffRoute<Id>((_req, { id }) => estadoCuenta(id))));
app.patch("/residents/:id", h(staffRoute<Id>(async (req, { id }) => updateResident(id, await readBody(req)))));
app.post(
  "/residents/:id",
  h(
    staffRoute<Id>(async (req, { id }) => {
      const body = await readBody(req);
      if (body.action === "cargo") {
        return cargarPeriodo(id, body.tipo === "SEMANA_COMIDA" ? "SEMANA_COMIDA" : "MES", body.force === true);
      }
      const result = await regenerateLink(id);
      return { ...result, message: "Link regenerado. El anterior ya no funciona." };
    })
  )
);
app.delete("/residents/:id", h(staffRoute<Id>((_req, { id }) => deactivateResident(id))));

// ---------- Habitaciones ----------
app.get("/rooms", h(staffRoute(() => listRooms())));
app.post(
  "/rooms",
  h(
    staffRoute(async (req) => {
      const body = await readBody(req);
      if (body.action === "unir") return unirRooms(body.ids, body.nombre);
      return createRoom(body);
    })
  )
);
app.patch(
  "/rooms/:id",
  h(
    staffRoute<Id>(async (req, { id }) => {
      const body = await readBody(req);
      switch (body.action) {
        case "checkin":
          return checkIn(id, body);
        case "estado":
          return setRoomEstado(id, body.estado as RoomBaseStatus, typeof body.notas === "string" ? body.notas : undefined);
        case "separar":
          return separarRoom(id);
        default:
          return updateRoom(id, body);
      }
    })
  )
);
app.delete("/rooms/:id", h(staffRoute<Id>((_req, { id }) => deleteRoom(id))));

// ---------- Ventas comedor ----------
app.get("/sales", h(staffRoute(async (req) => listVentas(q(req, "periodo") || undefined))));
app.post("/sales", h(staffRoute(async (req) => crearVenta(await readBody(req)))));
app.delete("/sales/:id", h(staffRoute<Id>((_req, { id }) => eliminarVenta(id))));

// ---------- Estadías ----------
app.get(
  "/stays",
  h(
    staffRoute(async (req) => {
      const estado = q(req, "estado");
      return listStays(estado === "ACTIVA" || estado === "CERRADA" ? estado : undefined);
    })
  )
);
app.patch(
  "/stays/:id",
  h(
    staffRoute<Id>(async (req, { id }) => {
      const body = await readBody(req);
      if (body.action === "consumo") return addConsumo(id, body.concepto, body.monto);
      if (body.action === "checkout") return checkOut(id, body);
      throw new AppError("Acción no válida");
    })
  )
);

app.notFound(() => noStoreJson({ error: "Ruta no encontrada" }, 404));

/** Precarga las tablas de MySQL en memoria para que la primera persona no espere a la base de datos. */
export async function precargar() {
  const { isMysqlConfigured } = await import("../src/lib/db/mysql");
  if (!isMysqlConfigured()) return;
  const { COLLECTIONS } = await import("../src/lib/db/repo");
  void Promise.all(COLLECTIONS.filter((c) => c !== "counters").map((c) => repo(c).count())).catch(() => {});
}

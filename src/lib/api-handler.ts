import { requireStaff } from "./auth";
import { noStoreJson } from "./api-response";
import { AppError } from "./domain/service";
import { esErrorDeRed } from "./db/mysql";

export type RouteHandler = (req: Request, params: Record<string, string>) => Promise<Response>;

/** Envuelve un handler: exige sesión de personal y convierte errores en JSON. */
export function staffRoute<P = Record<string, string>>(fn: (req: Request, params: P) => Promise<unknown>): RouteHandler {
  return async (req, params) => {
    const session = await requireStaff(req);
    if (!session) return noStoreJson({ error: "No autorizado" }, 401);
    return run(async () => fn(req, params as P));
  };
}

export function publicRoute<P = Record<string, string>>(fn: (req: Request, params: P) => Promise<unknown>): RouteHandler {
  return async (req, params) => run(async () => fn(req, params as P));
}

async function run(fn: () => Promise<unknown>) {
  try {
    return noStoreJson(await fn());
  } catch (e) {
    if (e instanceof AppError) return noStoreJson({ error: e.message }, e.status);
    console.error(e);
    if (esErrorDeRed(e)) {
      return noStoreJson({ error: "No hay conexión con la base de datos. Revisa el internet e intenta de nuevo." }, 503);
    }
    return noStoreJson({ error: "Error interno del servidor" }, 500);
  }
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

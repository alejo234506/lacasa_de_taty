import fs from "node:fs";
import path from "node:path";

// Producción: sirve el frontend compilado (dist) y la API en el mismo puerto.
// En desarrollo no se usa: `npm run dev` corre la API dentro de Vite.

// Carga variables de entorno (.env.local tiene prioridad sobre .env).
for (const f of [".env.local", ".env"]) {
  if (fs.existsSync(f)) process.loadEnvFile(f);
}

const { serve } = await import("@hono/node-server");
const { serveStatic } = await import("@hono/node-server/serve-static");
const { Hono } = await import("hono");
const { app: api, precargar } = await import("./app");

const port = Number(process.env.PORT || 3000);
const dist = path.resolve("dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("No existe dist/index.html. Ejecuta primero: npm run build");
  process.exit(1);
}
const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const app = new Hono();
app.route("/", api);
app.use("/*", serveStatic({ root: "./dist" }));
// Rutas del frontend (React Router): siempre devuelven index.html.
app.get("*", (c) => c.html(indexHtml));

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`Casa Taty escuchando en http://localhost:${info.port}`);
});

void precargar();

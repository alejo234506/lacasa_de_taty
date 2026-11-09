import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { getRequestListener } from "@hono/node-server";

/**
 * Corre la API (server/app.ts) dentro del mismo servidor de Vite en desarrollo:
 * un solo proceso y un solo puerto, sin proxy. Los cambios en la API se recargan solos.
 */
function apiEnDesarrollo(): Plugin {
  return {
    name: "casa-taty-api",
    apply: "serve",
    configureServer(server) {
      for (const f of [".env.local", ".env"]) {
        if (fs.existsSync(f)) process.loadEnvFile(f);
      }
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/") && req.url !== "/api") return next();
        try {
          const { app } = await server.ssrLoadModule("/server/app.ts");
          await getRequestListener(app.fetch)(req, res);
        } catch (e) {
          server.ssrFixStacktrace(e as Error);
          console.error(e);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Error interno del servidor" }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiEnDesarrollo()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    port: Number(process.env.PORT || 3000),
    // Permite abrir el panel desde el celular en la misma red WiFi mientras se desarrolla.
    host: true,
  },
});

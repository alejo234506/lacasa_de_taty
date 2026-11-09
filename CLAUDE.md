# Casa Taty

App de administración de Alojamiento Casa Taty.

- Frontend: React 19 + Vite + React Router + Tailwind 4 (`index.html`, `src/main.tsx`, páginas en `src/pages/`).
- API: Hono sobre Node (`server/app.ts`, arranque en `server/index.ts`), lógica en `src/lib/domain` y datos en `src/lib/db` (MySQL, o `.data/casa-taty.json` si no hay base configurada).
- `npm run dev`: Vite en :3000 y API en :3001 (Vite reenvía `/api`). `npm run build` + `npm start`: todo en :3000.
- El código de servidor (`server/`, `src/lib/domain`, `src/lib/db`, `src/lib/auth.ts`, `src/lib/api-*.ts`) usa imports relativos, no `@/`.

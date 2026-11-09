export function noStoreJson(data: unknown, init?: number | ResponseInit) {
  const options: ResponseInit = typeof init === "number" ? { status: init } : (init ?? {});
  const headers = new Headers(options.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.set("Pragma", "no-cache");
  return Response.json(data, { ...options, headers });
}

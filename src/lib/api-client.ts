const NO_STORE: RequestInit = {
  cache: "no-store",
  headers: { "Cache-Control": "no-cache" },
};

export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { ...NO_STORE, signal });
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${url} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function apiSend<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Cache-Control", "no-cache");

  const res = await fetch(url, {
    ...NO_STORE,
    ...init,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
  return data as T;
}

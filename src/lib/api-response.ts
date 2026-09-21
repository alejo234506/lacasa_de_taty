import { NextResponse } from "next/server";

export function noStoreJson(data: unknown, init?: number | ResponseInit) {
  const options = typeof init === "number" ? { status: init } : init;
  const res = NextResponse.json(data, options);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}

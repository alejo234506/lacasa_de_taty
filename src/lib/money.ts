export const TRM = 3950;

export function formatMoney(n: number, moneda: "COP" | "USD" = "COP"): string {
  if (moneda === "USD") {
    return `$ ${(n / TRM).toLocaleString("en-US", { maximumFractionDigits: 0 })} USD`;
  }
  return `$ ${Math.round(n).toLocaleString("es-CO")}`;
}

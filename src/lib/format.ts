const nf = new Intl.NumberFormat("ru-RU");

/** 11 240 000 → «11,24 млн ₽» */
export const mln = (rub: number, digits = 2) =>
  `${(rub / 1e6).toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits })} млн ₽`;
export const rub = (n: number) => `${nf.format(Math.round(n))} ₽`;
export const m2 = (n: number) => `${n.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} м²`;
export const num = (n: number) => nf.format(n);

export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
export const flats = (n: number) => `${n} ${plural(n, "квартира", "квартиры", "квартир")}`;

/** Аннуитетный платёж. */
export function annuity(principal: number, ratePct: number, years: number) {
  const n = years * 12;
  const r = ratePct / 100 / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

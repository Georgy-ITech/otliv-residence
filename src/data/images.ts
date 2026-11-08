/* Ширины нарезки каждого фото (сгенерировано скриптом нарезки). Без них srcset не знает, какой файл есть. */
export const WIDTHS: Record<string, number[]> = {"city-night": [800, 1600, 2400, 3200, 4000, 5200], "city-russky": [800, 1600, 2400, 3200, 4000, 4032], "int-dining": [800, 1600, 2400, 2592], "int-living": [800, 1600, 2400, 3200, 4000, 5200], "int-loft": [800, 1600, 2400, 3200, 4000, 5200], "int-open": [800, 1600, 2400, 3000], "int-sleep": [800, 1600, 2400, 3200, 4000, 5200], "int-window": [800, 1600, 2400, 3024]};

const BASE = import.meta.env.BASE_URL;
export const srcset = (n: string) => (WIDTHS[n] ?? [800, 1600]).map((w) => `${BASE}img/${n}-${w}.webp ${w}w`).join(", ");

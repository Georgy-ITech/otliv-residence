/*
  Квартиры «Отлива» — 194 штуки, собраны детерминированно: одинаковые при каждой
  сборке, чтобы ссылка на квартиру не менялась. Цены и статусы — демонстрационные.
*/

export type View = "море" | "сопки" | "город";
export type Status = "free" | "reserved" | "sold";

export interface Room {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  area: number;
}

export interface Apartment {
  id: string;
  number: number;
  floor: number;
  slot: string;
  rooms: number; // 0 — студия
  area: number;
  price: number;
  pricePerM2: number;
  views: View[];
  corner: boolean;
  status: Status;
  plan: { x: number; y: number; w: number; h: number };
  side: "south" | "north" | "full";
  layout: Room[];
  terrace?: number;
}

export const FLOORS = 26;
export const FIRST_LIVING_FLOOR = 2;
export const PLATE = { w: 1000, h: 560 };
export const CORE = { x: 330, y: 0, w: 140, h: 240 };
export const CORRIDOR = { x: 0, y: 240, w: 1000, h: 80 };

export const M2_PER_UNIT = 66 / (260 * 240);

interface Slot {
  key: string;
  rooms: number;
  x: number;
  y: number;
  w: number;
  h: number;
  side: "south" | "north";
  views: View[];
  corner: boolean;
  template: keyof typeof TEMPLATES;
}

const SLOTS: Slot[] = [
  { key: "D", rooms: 2, x: 0, y: 320, w: 260, h: 240, side: "south", views: ["море", "город"], corner: true, template: "two" },
  { key: "C", rooms: 0, x: 260, y: 320, w: 120, h: 240, side: "south", views: ["море"], corner: false, template: "studio" },
  { key: "B", rooms: 1, x: 380, y: 320, w: 180, h: 240, side: "south", views: ["море"], corner: false, template: "one" },
  { key: "A", rooms: 3, x: 560, y: 320, w: 440, h: 240, side: "south", views: ["море"], corner: true, template: "three" },
  { key: "E", rooms: 3, x: 0, y: 0, w: 330, h: 240, side: "north", views: ["сопки", "город"], corner: true, template: "three" },
  { key: "F", rooms: 1, x: 470, y: 0, w: 170, h: 240, side: "north", views: ["сопки"], corner: false, template: "one" },
  { key: "G", rooms: 2, x: 640, y: 0, w: 210, h: 240, side: "north", views: ["сопки"], corner: false, template: "euroTwo" },
  { key: "H", rooms: 1, x: 850, y: 0, w: 150, h: 240, side: "north", views: ["сопки", "море"], corner: true, template: "one" },
];

type Tpl = { name: string; x: number; y: number; w: number; h: number }[];

// Комнаты в долях квартиры; окна — по нижнему краю (южная сторона), вход — по верхнему (коридор этажа).
// Для северных квартир шаблон зеркалится. Пропорции подобраны так, чтобы прихожая не была больше 12 м².
const TEMPLATES: Record<string, Tpl> = {
  studio: [
    { name: "Кухня-гостиная", x: 0, y: 0.34, w: 1, h: 0.66 },
    { name: "Санузел", x: 0, y: 0, w: 0.55, h: 0.34 },
    { name: "Прихожая", x: 0.55, y: 0, w: 0.45, h: 0.34 },
  ],
  one: [
    { name: "Кухня-гостиная", x: 0, y: 0.36, w: 0.56, h: 0.64 },
    { name: "Спальня", x: 0.56, y: 0.36, w: 0.44, h: 0.64 },
    { name: "Санузел", x: 0, y: 0, w: 0.42, h: 0.36 },
    { name: "Прихожая", x: 0.42, y: 0, w: 0.58, h: 0.36 },
  ],
  euroTwo: [
    { name: "Кухня-гостиная", x: 0, y: 0.36, w: 0.5, h: 0.64 },
    { name: "Спальня", x: 0.5, y: 0.36, w: 0.5, h: 0.64 },
    { name: "Прихожая", x: 0, y: 0, w: 0.45, h: 0.36 },
    { name: "Санузел", x: 0.45, y: 0, w: 0.3, h: 0.36 },
    { name: "Гардероб", x: 0.75, y: 0, w: 0.25, h: 0.36 },
  ],
  two: [
    { name: "Спальня", x: 0, y: 0.4, w: 0.36, h: 0.6 },
    { name: "Кухня-гостиная", x: 0.36, y: 0.4, w: 0.64, h: 0.6 },
    { name: "Детская", x: 0, y: 0, w: 0.36, h: 0.4 },
    { name: "Прихожая", x: 0.36, y: 0, w: 0.32, h: 0.4 },
    { name: "Санузел", x: 0.68, y: 0, w: 0.32, h: 0.4 },
  ],
  three: [
    { name: "Кухня-гостиная", x: 0, y: 0.38, w: 0.42, h: 0.62 },
    { name: "Спальня", x: 0.42, y: 0.38, w: 0.27, h: 0.62 },
    { name: "Мастер-спальня", x: 0.69, y: 0.38, w: 0.31, h: 0.62 },
    { name: "Прихожая", x: 0, y: 0, w: 0.3, h: 0.38 },
    { name: "Коридор", x: 0.3, y: 0.3, w: 0.7, h: 0.08 },
    { name: "Санузел", x: 0.3, y: 0, w: 0.18, h: 0.3 },
    { name: "Гардероб", x: 0.48, y: 0, w: 0.16, h: 0.3 },
    { name: "Ванная", x: 0.64, y: 0, w: 0.16, h: 0.3 },
    { name: "Кладовая", x: 0.8, y: 0, w: 0.2, h: 0.3 },
  ],
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function layoutFor(tpl: Tpl, area: number, side: "south" | "north"): Room[] {
  const usable = area * 0.93;
  return tpl.map((r) => ({
    ...r,
    y: side === "north" ? 1 - r.y - r.h : r.y,
    area: round1(usable * r.w * r.h),
  }));
}

function statusFor(floor: number, r: () => number): Status {
  const x = r();
  const sold = Math.max(0.12, 0.5 - floor * 0.016);
  if (x < sold) return "sold";
  if (x < sold + 0.12) return "reserved";
  return "free";
}

function build(): Apartment[] {
  const list: Apartment[] = [];
  let number = 1;
  for (let floor = FIRST_LIVING_FLOOR; floor < FLOORS; floor++) {
    for (const s of SLOTS) {
      const r = rng(floor * 97 + s.key.charCodeAt(0) * 13);
      const area = round1(s.w * s.h * M2_PER_UNIT);
      const sea = s.views.includes("море");
      const ppm =
        262000 *
        (1 + (floor - FIRST_LIVING_FLOOR) * 0.0075) *
        (sea ? (s.side === "south" ? 1.14 : 1.06) : 1) *
        (s.corner ? 1.04 : 1) *
        (s.rooms === 0 ? 1.07 : 1);
      const price = Math.round((ppm * area) / 10000) * 10000;
      list.push({
        id: `${floor}-${s.key}`,
        number: number++,
        floor,
        slot: s.key,
        rooms: s.rooms,
        area,
        price,
        pricePerM2: Math.round(price / area),
        views: s.views,
        corner: s.corner,
        status: statusFor(floor, r),
        plan: { x: s.x, y: s.y, w: s.w, h: s.h },
        side: s.side,
        layout: layoutFor(TEMPLATES[s.template], area, s.side),
      });
    }
  }
  // Последний этаж — два пентхауса с террасами на всю высоту плиты.
  const pent = [
    { key: "P1", x: 0, w: 480, area: 168.4, terrace: 46, views: ["море", "город", "сопки"] as View[] },
    { key: "P2", x: 520, w: 480, area: 176.9, terrace: 52, views: ["море", "сопки"] as View[] },
  ];
  for (const p of pent) {
    const price = Math.round((410000 * p.area) / 10000) * 10000;
    list.push({
      id: `${FLOORS}-${p.key}`,
      number: number++,
      floor: FLOORS,
      slot: p.key,
      rooms: 4,
      area: p.area,
      price,
      pricePerM2: Math.round(price / p.area),
      views: p.views,
      corner: true,
      status: p.key === "P1" ? "reserved" : "free",
      plan: { x: p.x, y: 0, w: p.w, h: PLATE.h },
      side: "full",
      terrace: p.terrace,
      layout: [
        { name: "Гостиная", x: 0, y: 0.5, w: 0.62, h: 0.5, area: 0 },
        { name: "Кухня-столовая", x: 0.62, y: 0.5, w: 0.38, h: 0.5, area: 0 },
        { name: "Мастер-спальня", x: 0, y: 0, w: 0.4, h: 0.32, area: 0 },
        { name: "Спальня", x: 0.4, y: 0, w: 0.3, h: 0.32, area: 0 },
        { name: "Спальня", x: 0.7, y: 0, w: 0.3, h: 0.32, area: 0 },
        { name: "Холл", x: 0, y: 0.32, w: 0.62, h: 0.18, area: 0 },
        { name: "Санузлы", x: 0.62, y: 0.32, w: 0.38, h: 0.18, area: 0 },
      ].map((room) => ({ ...room, area: round1(p.area * 0.93 * room.w * room.h) })),
    });
  }
  return list;
}

export const APARTMENTS: Apartment[] = build();
export const byId = new Map(APARTMENTS.map((a) => [a.id, a]));

export function floorStats(floor: number) {
  const on = APARTMENTS.filter((a) => a.floor === floor);
  const free = on.filter((a) => a.status === "free");
  return {
    total: on.length,
    free: free.length,
    minPrice: free.length ? Math.min(...free.map((a) => a.price)) : null,
  };
}

export const roomsLabel = (n: number) => (n === 0 ? "Студия" : `${n}-комнатная`);
export const roomsShort = (n: number) => (n === 0 ? "Ст" : `${n}к`);
export const statusLabel: Record<Status, string> = { free: "Свободна", reserved: "Бронь", sold: "Продана" };

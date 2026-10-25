/*
  Карта бухты строится, а не рисуется: поле глубин → изобаты маршевыми квадратами.
  Берег стилизованный, не копия настоящего полуострова — на карте это сказано в легенде.
  Один и тот же результат идёт в SVG на странице и в текстуру земли 3D-сцены.
*/

export const W = 1600;
export const H = 1000;
export const SITE = { x: 1040, y: 470 }; // мыс, где стоит дом
export const LEVELS = [0, 2, 5, 10, 20, 30] as const;

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { s += amp * (vnoise(x * f, y * f) * 2 - 1); f *= 2.03; amp *= 0.5; }
  return s;
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return { d: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t };
}
const smax = (a: number, b: number, k = 40) => {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (a - b)) / k));
  return b + (a - b) * h + k * h * (1 - h);
};

/** Высота суши (>0) или минус-удалённость от берега (<0). */
function land(x: number, y: number) {
  const shoreY = 560 - 0.24 * x + 34 * Math.sin(x / 150) + 16 * Math.sin(x / 47 + 1.3);
  const shore = shoreY - y;
  const c = segDist(x, y, 760, 300, SITE.x + 30, SITE.y + 25);
  const cape = (78 - 26 * c.t) - c.d;
  const isl = 64 - Math.hypot((x - 1365) * 0.8, y - 805) + 14 * fbm(x / 40, y / 40);
  const rock = 16 - Math.hypot(x - 1215, y - 640);
  return smax(smax(smax(shore, cape), isl), rock, 20) + 9 * fbm(x / 90, y / 90);
}

export function depthAt(x: number, y: number) {
  const l = land(x, y);
  if (l > 0) return -l * 0.1;
  const off = -l;
  return 34 * (1 - Math.exp(-off / 300)) + 1.6 * fbm(x / 120 + 7, y / 120);
}

type Pt = [number, number];

function contours(step: number) {
  const nx = Math.ceil(W / step) + 1, ny = Math.ceil(H / step) + 1;
  const g = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = depthAt(i * step, j * step);
  const out: Record<number, string> = {};
  for (const lv of LEVELS) {
    const segs: [Pt, Pt][] = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = g[j * nx + i] - lv, b = g[j * nx + i + 1] - lv, c = g[(j + 1) * nx + i + 1] - lv, d = g[(j + 1) * nx + i] - lv;
        const x = i * step, y = j * step;
        const lerp = (p: number, q: number) => p / (p - q);
        const e: Pt[] = [];
        if (a > 0 !== b > 0) e.push([x + lerp(a, b) * step, y]);
        if (b > 0 !== c > 0) e.push([x + step, y + lerp(b, c) * step]);
        if (c > 0 !== d > 0) e.push([x + step - lerp(c, d) * step, y + step]);
        if (d > 0 !== a > 0) e.push([x, y + step - lerp(d, a) * step]);
        if (e.length === 2) segs.push([e[0], e[1]]);
        else if (e.length === 4) { segs.push([e[0], e[1]]); segs.push([e[2], e[3]]); }
      }
    }
    out[lv] = chain(segs);
  }
  return out;
}

// Склейка отрезков в ломаные и сглаживание серединами — чтобы изобата шла пером, а не лесенкой.
function chain(segs: [Pt, Pt][]) {
  const key = (p: Pt) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
  const adj = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      (adj.get(k) ?? adj.set(k, []).get(k)!).push(i);
    }
  });
  const used = new Uint8Array(segs.length);
  let d = "";
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line: Pt[] = [segs[i][0], segs[i][1]];
    for (const dir of [1, -1]) {
      for (;;) {
        const end = dir === 1 ? line[line.length - 1] : line[0];
        const next = (adj.get(key(end)) ?? []).find((n) => !used[n]);
        if (next === undefined) break;
        used[next] = 1;
        const s = segs[next];
        const p = key(s[0]) === key(end) ? s[1] : s[0];
        if (dir === 1) line.push(p); else line.unshift(p);
      }
    }
    if (line.length < 4) continue;
    d += `M${line[0][0].toFixed(1)} ${line[0][1].toFixed(1)}`;
    for (let k = 1; k < line.length - 1; k++) {
      const mx = (line[k][0] + line[k + 1][0]) / 2, my = (line[k][1] + line[k + 1][1]) / 2;
      d += `Q${line[k][0].toFixed(1)} ${line[k][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    d += "";
  }
  return d;
}

export interface Sounding { x: number; y: number; m: number; dm: number }

function soundings(): Sounding[] {
  const list: Sounding[] = [];
  const cell = 74;
  for (let y = cell / 2; y < H; y += cell) {
    for (let x = cell / 2; x < W; x += cell) {
      const jx = x + (hash(x, y) - 0.5) * cell * 0.7;
      const jy = y + (hash(y, x) - 0.5) * cell * 0.7;
      const dep = depthAt(jx, jy);
      if (dep < 1.2) continue;
      if (Math.hypot(jx - SITE.x, jy - SITE.y) < 140) continue;
      list.push({ x: jx, y: jy, m: Math.floor(dep), dm: Math.floor((dep % 1) * 10) });
    }
  }
  return list;
}

let cache: { iso: Record<number, string>; soundings: Sounding[] } | null = null;
export function bay() {
  cache ??= { iso: contours(7), soundings: soundings() };
  return cache;
}

/** Береговая заливка: суша замкнута рамкой карты сверху-слева. */
export function landPath() {
  return bay().iso[0];
}

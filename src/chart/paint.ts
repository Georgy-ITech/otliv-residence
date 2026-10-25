import { W, H, SITE, LEVELS, bay, depthAt } from "./bay";

export const C = {
  paper: "#fbfbf8",
  land: "#efe2b8",
  landInk: "#b8a06a",
  shoal: ["#b6d4e1", "#cbe2eb", "#e0eef3"],
  iso: "#4f7f96",
  ink: "#16191c",
  magenta: "#a1267f",
};

let fills: HTMLCanvasElement | null = null;
let landMask: HTMLCanvasElement | null = null;

/** Заливки глубин считаются один раз в малом разрешении: края всё равно накрывают изобаты. */
function fillLayer() {
  if (fills) return fills;
  const fw = 480, fh = 300;
  const c = document.createElement("canvas");
  c.width = fw;
  c.height = fh;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(fw, fh);
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pal = { land: hex(C.land), s0: hex(C.shoal[0]), s1: hex(C.shoal[1]), s2: hex(C.shoal[2]), deep: hex(C.paper) };
  for (let j = 0; j < fh; j++) {
    for (let i = 0; i < fw; i++) {
      const d = depthAt(((i + 0.5) / fw) * W, ((j + 0.5) / fh) * H);
      const col = d <= 0 ? pal.land : d < 2 ? pal.s0 : d < 5 ? pal.s1 : d < 10 ? pal.s2 : pal.deep;
      const k = (j * fw + i) * 4;
      img.data[k] = col[0];
      img.data[k + 1] = col[1];
      img.data[k + 2] = col[2];
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const m = document.createElement("canvas");
  m.width = fw;
  m.height = fh;
  const mctx = m.getContext("2d")!;
  const mi = mctx.createImageData(fw, fh);
  for (let k = 0; k < fw * fh; k++) {
    const isLand = img.data[k * 4] === pal.land[0] && img.data[k * 4 + 2] === pal.land[2];
    mi.data[k * 4 + 3] = isLand ? 255 : 0;
  }
  mctx.putImageData(mi, 0, 0);
  landMask = m;
  fills = c;
  return c;
}

const DASH: Record<number, number[]> = { 0: [], 2: [2, 3], 5: [6, 3], 10: [10, 3, 2, 3], 20: [14, 4], 30: [] };

export interface PaintOpts {
  labels?: boolean;
  grid?: boolean;
  soundings?: boolean;
}

/** Рисует карту в координатах W×H; вызывающий задаёт масштаб через ctx.setTransform. */
export function paintChart(ctx: CanvasRenderingContext2D, o: PaintOpts = {}) {
  const { iso, soundings } = bay();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fillLayer(), 0, 0, W, H);

  // Гравюрная штриховка суши — тонкие параллели, как на старых картах; обрезается маской суши.
  const hatch = document.createElement("canvas");
  hatch.width = W;
  hatch.height = H;
  const hx = hatch.getContext("2d")!;
  hx.strokeStyle = "rgba(160,132,74,0.24)";
  hx.lineWidth = 0.8;
  for (let y = -H; y < H * 2; y += 9) {
    hx.beginPath();
    hx.moveTo(0, y);
    hx.lineTo(W, y - W * 0.35);
    hx.stroke();
  }
  hx.globalCompositeOperation = "destination-in";
  hx.imageSmoothingEnabled = true;
  hx.drawImage(landMask!, 0, 0, W, H);
  ctx.drawImage(hatch, 0, 0);

  if (o.grid !== false) {
    ctx.strokeStyle = "rgba(22,25,28,0.08)";
    ctx.lineWidth = 1;
    for (let x = 200; x < W; x += 200) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 200; y < H; y += 200) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  for (const lv of LEVELS) {
    if (!iso[lv]) continue;
    ctx.setLineDash(DASH[lv]);
    ctx.strokeStyle = lv === 0 ? C.ink : C.iso;
    ctx.lineWidth = lv === 0 ? 2.2 : lv === 30 ? 0.7 : 1.1;
    ctx.globalAlpha = lv === 0 ? 1 : 0.75;
    ctx.stroke(new Path2D(iso[lv]));
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  if (o.soundings !== false) {
    ctx.fillStyle = C.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of soundings) {
      ctx.font = "italic 500 17px Alegreya, serif";
      ctx.fillText(String(s.m), s.x, s.y);
      if (s.m < 10) {
        ctx.font = "italic 500 11px Alegreya, serif";
        ctx.fillText(String(s.dm), s.x + 9, s.y + 6);
      }
    }
  }

  if (o.labels !== false) {
    ctx.fillStyle = "rgba(22,25,28,0.78)";
    ctx.textAlign = "center";
    ctx.font = "italic 500 44px Alegreya, serif";
    spaced(ctx, "Уссурийский залив", 1180, 905, 9);
    ctx.font = "italic 500 22px Alegreya, serif";
    ctx.fillText("м. Отлив", SITE.x + 95, SITE.y + 74);
    ctx.fillText("о. Безымянный", 1365, 905 - 60);
    ctx.font = "500 15px 'Golos Text', sans-serif";
    ctx.fillStyle = "rgba(22,25,28,0.62)";
    spaced(ctx, "ПОЛУОСТРОВ", 330, 150, 6);
    rose(ctx, 250, 760, 92);
  }
  ctx.restore();
}

function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, gap: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + gap);
  let x = cx - widths.reduce((a, b) => a + b, 0) / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => { ctx.fillText(c, x, cy); x += widths[i]; });
  ctx.textAlign = "center";
}

/** Компасная роза магентой — главный знак навигационной карты. */
export function rose(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = C.magenta;
  ctx.fillStyle = C.magenta;
  ctx.lineWidth = 1.2;
  for (const rr of [r, r * 0.86]) { ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const l = i % 9 === 0 ? 0.14 : 0.07;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * r * (1 - l), Math.sin(a) * r * (1 - l));
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(r * 0.09, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(-r * 0.09, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.rotate(0);
  ctx.font = "italic 600 20px Alegreya, serif";
  ctx.textAlign = "center";
  ctx.fillText("N", 0, -r - 10);
  ctx.restore();
}

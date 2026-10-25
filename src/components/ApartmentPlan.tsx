import { M2_PER_UNIT, type Apartment, type Room } from "../data/apartments";
import { m2 } from "../lib/format";

/*
  Обмерный план квартиры: несущий контур заливкой, перегородки тоньше, двери с дугой
  открывания, окна — проёмами в наружной стене, балкон за окнами, масштабная линейка
  и стрелка севера в манере карты. Все квартиры рисуются в одном масштабе.
*/

const UNIT_M = Math.sqrt(M2_PER_UNIT); // метров в одной единице плана
const M = 1 / UNIT_M; // единиц в метре
const OUTER = 9;
const INNER = 3;
const DOOR = 0.85 * M;
const HUBS = ["Прихожая", "Холл", "Коридор"];
const OPEN = ["Кухня-гостиная", "Гостиная"];

interface Box { x: number; y: number; w: number; h: number; r: Room }
interface Door { x: number; y: number; horiz: boolean; into: 1 | -1 }

/** Общая стена двух комнат: отрезок, если он длиннее проёма двери. */
function shared(a: Box, b: Box) {
  const eps = 1;
  const ox0 = Math.max(a.x, b.x), ox1 = Math.min(a.x + a.w, b.x + b.w);
  const oy0 = Math.max(a.y, b.y), oy1 = Math.min(a.y + a.h, b.y + b.h);
  if (Math.abs(a.y + a.h - b.y) < eps && ox1 - ox0 > DOOR + 12) return { horiz: true, at: a.y + a.h, from: ox0, to: ox1, into: 1 as const };
  if (Math.abs(b.y + b.h - a.y) < eps && ox1 - ox0 > DOOR + 12) return { horiz: true, at: a.y, from: ox0, to: ox1, into: -1 as const };
  if (Math.abs(a.x + a.w - b.x) < eps && oy1 - oy0 > DOOR + 12) return { horiz: false, at: a.x + a.w, from: oy0, to: oy1, into: 1 as const };
  if (Math.abs(b.x + b.w - a.x) < eps && oy1 - oy0 > DOOR + 12) return { horiz: false, at: a.x, from: oy0, to: oy1, into: -1 as const };
  return null;
}

function doorsFor(boxes: Box[]): Door[] {
  const out: Door[] = [];
  for (const b of boxes) {
    if (HUBS.includes(b.r.name)) continue;
    const order = [...boxes.filter((o) => HUBS.includes(o.r.name)), ...(OPEN.includes(b.r.name) ? [] : boxes.filter((o) => OPEN.includes(o.r.name)))];
    for (const o of order) {
      if (o === b) continue;
      const s = shared(b, o);
      if (!s) continue;
      // Дверь ближе к углу со стороны прихожей — как ставят в реальных планировках.
      const pos = s.from + 8 + DOOR / 2;
      out.push(s.horiz ? { x: pos, y: s.at, horiz: true, into: (s.into * -1) as 1 | -1 } : { x: s.at, y: pos, horiz: false, into: (s.into * -1) as 1 | -1 });
      break;
    }
  }
  return out;
}

export default function ApartmentPlan({ a }: { a: Apartment }) {
  const W = a.plan.w, H = a.plan.h;
  const north = a.side === "north";
  const balcony = a.side !== "north" ? Math.round((a.terrace ? 2.4 : 1.3) * M) : 0;
  const pad = 54;
  const boxes: Box[] = a.layout.map((r) => ({ x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H, r }));
  const doors = doorsFor(boxes);
  const hub = boxes.find((b) => HUBS.includes(b.r.name));
  const windowSide = north ? 0 : H;
  const entryY = north ? H : 0;

  // Окна: проём в наружной стене каждой комнаты, выходящей на фасад (кроме санузлов и гардеробных).
  const dry = (n: string) => !/Санузел|Санузлы|Ванная|Гардероб|Кладовая|Коридор|Прихожая|Холл/.test(n);
  const wins: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const b of boxes) {
    if (!dry(b.r.name)) continue;
    const touches = (y: number) => Math.abs(b.y - y) < 1 || Math.abs(b.y + b.h - y) < 1;
    const sides = a.side === "full" ? [0, H] : [windowSide];
    for (const y of sides) if (touches(y) && b.w > 60) wins.push({ x1: b.x + b.w * 0.22, y1: y, x2: b.x + b.w * 0.78, y2: y });
    if (a.corner && a.plan.x === 0 && b.x < 1 && b.h > 60) wins.push({ x1: 0, y1: b.y + b.h * 0.25, x2: 0, y2: b.y + b.h * 0.75 });
    if (a.corner && a.plan.x + a.plan.w === 1000 && Math.abs(b.x + b.w - W) < 1 && b.h > 60) wins.push({ x1: W, y1: b.y + b.h * 0.25, x2: W, y2: b.y + b.h * 0.75 });
  }

  const vbH = H + pad * 2 + balcony;
  const vbY = -pad;

  return (
    <svg
      className="aplan"
      style={{ width: `${Math.min(100, ((W + pad * 2) / 590) * 100)}%` }}
      viewBox={`${-pad} ${vbY} ${W + pad * 2} ${vbH}`}
      role="img"
      aria-label={`Планировка: ${a.layout.map((r) => `${r.name} ${m2(r.area)}`).join(", ")}${a.terrace ? `, терраса ${m2(a.terrace)}` : balcony ? ", балкон" : ""}`}
    >
      <defs>
        <pattern id="wall-poche" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="var(--ink)" />
        </pattern>
        <pattern id="wet" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 10L10 0" stroke="var(--iso)" strokeWidth="0.8" opacity="0.35" />
        </pattern>
      </defs>

      {/* Балкон или терраса за окнами — пунктиром, как уровень ниже на обмерном плане. */}
      {balcony ? (
        <g className="aplan__balc">
          <rect x={OUTER} y={H} width={W - OUTER * 2} height={balcony} />
          <text x={W / 2} y={H + balcony / 2 + 5} textAnchor="middle">{a.terrace ? `терраса ${m2(a.terrace)}` : "балкон"}</text>
        </g>
      ) : null}

      {boxes.map((b, i) => (
        <rect key={`f${i}`} x={b.x} y={b.y} width={b.w} height={b.h} className={/Санузел|Санузлы|Ванная/.test(b.r.name) ? "aplan__wet" : "aplan__floor"} fill={/Санузел|Санузлы|Ванная/.test(b.r.name) ? "url(#wet)" : undefined} />
      ))}
      {/* Перегородки: обводка комнат, кроме связки прихожая—коридор, которая читается одним пространством. */}
      {boxes.map((b, i) => (b.r.name === "Коридор" ? null : <rect key={`w${i}`} x={b.x} y={b.y} width={b.w} height={b.h} className="aplan__part" strokeWidth={INNER} />))}
      <rect x={OUTER / 2} y={OUTER / 2} width={W - OUTER} height={H - OUTER} className="aplan__outer" strokeWidth={OUTER} />

      {/* Окна — разрыв стены с двойной рамой. */}
      {wins.map((w, i) => {
        const horiz = w.y1 === w.y2;
        const off = horiz ? (w.y1 === 0 ? OUTER / 2 : -OUTER / 2) : w.x1 === 0 ? OUTER / 2 : -OUTER / 2;
        return horiz ? (
          <g key={i} className="aplan__win">
            <rect x={w.x1} y={(w.y1 === 0 ? 0 : H - OUTER)} width={w.x2 - w.x1} height={OUTER} />
            <line x1={w.x1} x2={w.x2} y1={w.y1 + off - 1.6} y2={w.y1 + off - 1.6} />
            <line x1={w.x1} x2={w.x2} y1={w.y1 + off + 1.6} y2={w.y1 + off + 1.6} />
          </g>
        ) : (
          <g key={i} className="aplan__win">
            <rect x={w.x1 === 0 ? 0 : W - OUTER} y={w.y1} width={OUTER} height={w.y2 - w.y1} />
            <line y1={w.y1} y2={w.y2} x1={w.x1 + off - 1.6} x2={w.x1 + off - 1.6} />
            <line y1={w.y1} y2={w.y2} x1={w.x1 + off + 1.6} x2={w.x1 + off + 1.6} />
          </g>
        );
      })}

      {/* Двери: проём и дуга открывания внутрь комнаты. */}
      {doors.map((d, i) => {
        const r = DOOR;
        return d.horiz ? (
          <g key={i} className="aplan__door">
            <rect x={d.x - r / 2} y={d.y - INNER} width={r} height={INNER * 2} className="aplan__gap" />
            <path d={`M${d.x - r / 2} ${d.y} L${d.x - r / 2} ${d.y + d.into * r} A${r} ${r} 0 0 ${d.into > 0 ? 0 : 1} ${d.x + r / 2} ${d.y}`} />
          </g>
        ) : (
          <g key={i} className="aplan__door">
            <rect x={d.x - INNER} y={d.y - r / 2} width={INNER * 2} height={r} className="aplan__gap" />
            <path d={`M${d.x} ${d.y - r / 2} L${d.x + d.into * r} ${d.y - r / 2} A${r} ${r} 0 0 ${d.into > 0 ? 1 : 0} ${d.x} ${d.y + r / 2}`} />
          </g>
        );
      })}

      {/* Входная дверь — из коридора этажа в прихожую; у пентхауса вход с лифтового холла не рисуется: холл этажа общий. */}
      {hub && a.side !== "full" ? (
        <g className="aplan__door aplan__door--entry">
          <rect x={hub.x + hub.w / 2 - DOOR / 2} y={entryY - (entryY ? OUTER : 0)} width={DOOR} height={OUTER} className="aplan__gap" />
          <path d={`M${hub.x + hub.w / 2 - DOOR / 2} ${entryY} L${hub.x + hub.w / 2 - DOOR / 2} ${entryY + (entryY ? -DOOR : DOOR)} A${DOOR} ${DOOR} 0 0 ${entryY ? 1 : 0} ${hub.x + hub.w / 2 + DOOR / 2} ${entryY}`} />
        </g>
      ) : null}

      {boxes.map((b, i) => {
        if (b.r.name === "Коридор") return null;
        const base = Math.min(W, H) * 0.075;
        const words = b.r.name.includes("-") && b.w < b.r.name.length * base * 0.5 ? b.r.name.replace("-", "-|").split("|") : [b.r.name];
        const longest = Math.max(...words.map((t) => t.length));
        const fs = Math.max(13, Math.min(base, (b.w - 14) / (longest * 0.52), b.h / (words.length + 2.6)));
        const ty = b.y + b.h / 2 - ((words.length - 1) * fs * 1.1) / 2 + fs * 0.15 + (b.h < 90 ? DOOR * 0.25 : 0);
        return (
          <g key={`t${i}`}>
            <text className="aplan__name" x={b.x + b.w / 2} y={ty} textAnchor="middle" style={{ fontSize: fs }}>
              {words.map((t, k) => (
                <tspan key={k} x={b.x + b.w / 2} dy={k ? fs * 1.1 : 0}>{t}</tspan>
              ))}
            </text>
            <text className="aplan__area" x={b.x + b.w / 2} y={ty + (words.length - 1) * fs * 1.1 + fs * 1.3} textAnchor="middle" style={{ fontSize: fs * 0.88 }}>
              {b.r.area.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
            </text>
          </g>
        );
      })}

      {/* Масштабная линейка 0–2 м и стрелка севера — как на полях карты. */}
      <g className="aplan__scale" transform={`translate(0 ${vbY + 22})`}>
        {[0, 1].map((k) => <rect key={k} x={k * M} y="0" width={M} height="5" className={k % 2 ? "is-open" : ""} />)}
        <text x="0" y="-5">0</text>
        <text x={2 * M} y="-5" textAnchor="middle">2 м</text>
      </g>
      <g className="aplan__north" transform={`translate(${W + pad / 2} ${vbY + 26})`}>
        <path d="M0 -14 L6 8 L0 4 L-6 8 Z" />
        <text y="22" textAnchor="middle">С</text>
      </g>
    </svg>
  );
}

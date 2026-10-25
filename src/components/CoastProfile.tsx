import type { Apartment } from "../data/apartments";

/*
  Вид из окна в манере «вида берега» с полей лоции: линейный профиль горизонта
  со шкалой пеленгов сверху. Чем выше этаж, тем ниже горизонт в кадре и тем
  больше островов поднимается над водой. Северные окна смотрят на сопки и крыши.
*/
const W = 960, H = 200;
const RHUMB: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W", 150: "SSE", 210: "SSW", 120: "ESE", 330: "NNW", 300: "WNW", 30: "NNE" };

function seeded(n: number) {
  const s = Math.sin(n * 91.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Силуэт острова: пологий холм с неровным гребнем. */
function isle(x0: number, w: number, base: number, hgt: number, seed: number) {
  let d = `M${x0} ${base}`;
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bump = Math.sin(t * Math.PI) ** 0.8 * hgt;
    const jag = (seeded(seed + i) - 0.5) * hgt * 0.18;
    d += ` L${(x0 + t * w).toFixed(1)} ${(base - bump - jag).toFixed(1)}`;
  }
  return d + " Z";
}

function ridge(seed: number, base: number, amp: number) {
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += 16) {
    const y = base - amp * (0.5 + 0.5 * Math.sin(x / 110 + seed) * Math.cos(x / 47 + seed * 2)) - (seeded(x + seed) - 0.5) * 4;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + ` L${W} ${H} Z`;
}

function roofs(x0: number, x1: number, base: number) {
  let d = `M${x0} ${H}`;
  let x = x0, i = 0;
  while (x < x1) {
    const w = 18 + seeded(i) * 34;
    const h = 8 + seeded(i + 40) * 34;
    d += ` L${x.toFixed(1)} ${(base - h).toFixed(1)} L${Math.min(x1, x + w).toFixed(1)} ${(base - h).toFixed(1)}`;
    x += w;
    i++;
  }
  return d + ` L${x1} ${H} Z`;
}

export default function CoastProfile({ a }: { a: Apartment }) {
  const k = (a.floor - 2) / 24;
  const sea = a.views.includes("море");
  const horizon = 104 - k * 30;
  const bearing0 = a.side === "north" ? 300 : 120; // пеленг левого края кадра
  const label = (deg: number) => `${((deg % 360) + 360) % 360}°`;

  return (
    <figure className="profile">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={sea ? `Схема вида на залив с ${a.floor} этажа` : `Схема вида на сопки с ${a.floor} этажа`}>
        <defs>
          <pattern id="isle-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
          </pattern>
        </defs>
        <rect width={W} height={H} className="profile__sky" />

        {/* Шкала пеленгов: каждые 10°, подписи каждые 30°. */}
        {Array.from({ length: 13 }, (_, i) => {
          const x = (i / 12) * W;
          const deg = bearing0 + i * 10;
          return (
            <g key={i} className="profile__brg">
              <line x1={x} y1="0" x2={x} y2={deg % 30 === 0 ? 14 : 8} />
              {deg % 30 === 0 && i > 0 && i < 12 ? <text x={x} y="28" textAnchor="middle">{label(deg)}{RHUMB[((deg % 360) + 360) % 360] ? ` ${RHUMB[((deg % 360) + 360) % 360]}` : ""}</text> : null}
            </g>
          );
        })}

        {sea ? (
          <>
            <rect y={horizon} width={W} height={H - horizon} className="profile__sea" />
            {Array.from({ length: 9 }, (_, i) => {
              const y = horizon + 6 + i * i * 2.6;
              return <line key={i} x1={0} x2={W} y1={y} y2={y} className="profile__swell" style={{ opacity: 0.18 + i * 0.05 }} />;
            })}
            {/* Дальние острова видны только сверху: с низких этажей их съедает горизонт. */}
            <path className="profile__isle profile__isle--far" d={isle(80, 210, horizon, 6 + 16 * k, 3)} />
            <path className="profile__hatch" d={isle(80, 210, horizon, 6 + 16 * k, 3)} fill="url(#isle-hatch)" opacity="0.6" />
            <path className="profile__isle" d={isle(470, 300, horizon, 14 + 22 * k, 9)} />
            <path className="profile__hatch" d={isle(470, 300, horizon, 14 + 22 * k, 9)} fill="url(#isle-hatch)" />
            {k > 0.3 ? <path className="profile__isle profile__isle--far" d={isle(800, 120, horizon, 4 + 10 * k, 17)} /> : null}
            <line x1="0" x2={W} y1={horizon} y2={horizon} className="profile__line" />
            {a.views.includes("город") ? <path className="profile__city" d={roofs(0, 230, horizon + 34 - k * 10)} /> : null}
            <text className="profile__name" x="620" y={horizon - 26 - 22 * k} textAnchor="middle">о. Безымянный</text>
          </>
        ) : (
          <>
            <path className="profile__hill profile__hill--far" d={ridge(1.7, horizon + 6, 64)} />
            <path className="profile__hill" d={ridge(4.2, horizon + 62, 46 - k * 16)} />
            <path className="profile__hatch" d={ridge(4.2, horizon + 62, 46 - k * 16)} fill="url(#isle-hatch)" />
            <path className="profile__hatch" d={ridge(1.7, horizon + 6, 64)} fill="url(#isle-hatch)" opacity="0.5" />
            <path className="profile__city" d={roofs(0, W, horizon + 118 - k * 34)} />
            <text className="profile__name" x="480" y={horizon - 50} textAnchor="middle">сопки полуострова</text>
          </>
        )}
      </svg>
      <figcaption>
        {sea ? "Вид на залив" : "Вид на сопки"} · {a.floor} этаж · окно на высоте около {Math.round(a.floor * 3.4)} м. Схема в манере лоции, не фотография.
      </figcaption>
    </figure>
  );
}

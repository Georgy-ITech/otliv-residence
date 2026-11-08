import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APARTMENTS, FLOORS, FIRST_LIVING_FLOOR, roomsLabel, statusLabel, type Apartment } from "../../data/apartments";
import { flats, m2, mln } from "../../lib/format";
import { gsap, reducedMotion } from "../../lib/motion";
import ApartmentPlan from "../ApartmentPlan";

const TYPES = [
  { v: 0, l: "Студии" },
  { v: 1, l: "1-комн." },
  { v: 2, l: "2-комн." },
  { v: 3, l: "3-комн." },
  { v: 4, l: "Пентхаусы" },
];
const PRICES = APARTMENTS.map((a) => a.price);
const P_MIN = Math.floor(Math.min(...PRICES) / 1e6);
const P_MAX = Math.ceil(Math.max(...PRICES) / 1e6);
const A_MAX = Math.ceil(Math.max(...APARTMENTS.map((a) => a.area)));

/* Фасад-шахматка: этажи — ряды, квартиры — ячейки по позиции на плите. */
const ROWS = Array.from({ length: FLOORS - FIRST_LIVING_FLOOR + 1 }, (_, i) => FLOORS - i).map((f) => ({
  f,
  apts: APARTMENTS.filter((a) => a.floor === f).sort((a, b) => a.plan.x - b.plan.x || a.plan.y - b.plan.y),
}));

export default function Chess() {
  const root = useRef<HTMLElement>(null);
  const [types, setTypes] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState(P_MAX);
  const [minArea, setMinArea] = useState(0);
  const [onlyFree, setOnlyFree] = useState(true);
  const [pick, setPick] = useState<Apartment | null>(null);
  const [floor, setFloor] = useState<number | null>(null);

  const ok = useMemo(() => {
    const s = new Set<string>();
    for (const a of APARTMENTS) {
      if (onlyFree && a.status !== "free") continue;
      if (types.length && !types.includes(Math.min(a.rooms, 4))) continue;
      if (a.price > maxPrice * 1e6 || a.area < minArea) continue;
      s.add(a.id);
    }
    return s;
  }, [types, maxPrice, minArea, onlyFree]);

  // Этажи падают сверху и ложатся друг на друга, снизу вверх — дом собирается.
  useEffect(() => {
    if (!root.current || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(".chess__row", {
        yPercent: -260,
        opacity: 0,
        ease: "power3.in",
        duration: 0.5,
        stagger: { each: 0.045, from: "end" },
        scrollTrigger: { trigger: ".chess__facade", start: "top 75%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const shown = pick ?? APARTMENTS.find((a) => ok.has(a.id)) ?? null;

  return (
    <section id="kvartiry" className="chess" ref={root} aria-labelledby="chess-title">
      <header className="chess__head">
        <h2 id="chess-title" className="h2">Шахматка</h2>
        <p className="chess__count" aria-live="polite"><span className="num">{ok.size}</span> {flats(ok.size).replace(/^\d+ /, "")} под ваш запрос</p>
      </header>

      <div className="chess__filters" role="group" aria-label="Фильтры">
        <div className="chess__types">
          {TYPES.map((t) => {
            const on = types.includes(t.v);
            return (
              <button key={t.v} type="button" className="tchip" aria-pressed={on} onClick={() => setTypes(on ? types.filter((x) => x !== t.v) : [...types, t.v])}>
                {t.l}
              </button>
            );
          })}
        </div>
        <label className="chess__range">
          <span>Цена до <b className="num">{maxPrice} млн ₽</b></span>
          <input type="range" min={P_MIN} max={P_MAX} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ "--p": `${((maxPrice - P_MIN) / (P_MAX - P_MIN)) * 100}%` } as React.CSSProperties} />
        </label>
        <label className="chess__range">
          <span>Площадь от <b className="num">{minArea} м²</b></span>
          <input type="range" min={0} max={A_MAX} step={5} value={minArea} onChange={(e) => setMinArea(Number(e.target.value))} style={{ "--p": `${(minArea / A_MAX) * 100}%` } as React.CSSProperties} />
        </label>
        <label className="chess__free">
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
          <span>Только свободные</span>
        </label>
      </div>

      <div className="chess__body">
        <div className="chess__facade" onMouseLeave={() => setFloor(null)}>
          {ROWS.map((r) => (
            <div key={r.f} className={`chess__row ${floor === r.f ? "is-floor" : ""}`} onMouseEnter={() => setFloor(r.f)}>
              <span className="chess__f num">{r.f}</span>
              <div className={`chess__cells ${r.apts.length < 4 ? "chess__cells--pent" : ""}`}>
                {r.apts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`cellx cellx--${a.status} ${ok.has(a.id) ? "is-ok" : "is-off"} ${shown?.id === a.id ? "is-pick" : ""}`}
                    onMouseEnter={() => setPick(a)}
                    onFocus={() => setPick(a)}
                    onClick={() => setPick(a)}
                    aria-label={`${a.floor} этаж, ${roomsLabel(a.rooms)}, ${m2(a.area)}, ${statusLabel[a.status]}${a.status === "free" ? `, ${mln(a.price)}` : ""}`}
                  >
                    <span className="cellx__r">{a.rooms === 0 ? "С" : a.rooms === 4 ? "П" : a.rooms}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="chess__ground" aria-hidden="true" />
        </div>

        <aside className="chess__card" aria-live="polite">
          {shown ? (
            <>
              <div className="chess__plan apt__plan"><ApartmentPlan a={shown} /></div>
              <p className="chess__meta"><span className={`dot dot--${shown.status}`} />{statusLabel[shown.status]} · {shown.floor} этаж · кв. {shown.number}</p>
              <h3 className="chess__name">{roomsLabel(shown.rooms)}, {m2(shown.area)}</h3>
              <p className="chess__price num">{mln(shown.price)}</p>
              <p className="chess__views">Вид: {shown.views.join(", ")}{shown.terrace ? ` · терраса ${shown.terrace} м²` : ""}</p>
              <Link to={`/kvartira/${shown.id}`} className="chess__go">
                <span>Открыть квартиру</span>
                <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6c5-6 9-6 14 0s9 6 14 0M30 1l6 5-6 5" /></svg>
              </Link>
            </>
          ) : (
            <p className="chess__empty">Под такие условия квартир нет. Поднимите цену или снимите тип.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

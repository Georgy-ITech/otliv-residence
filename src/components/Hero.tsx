import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APARTMENTS, FLOORS, FIRST_LIVING_FLOOR, floorStats } from "../data/apartments";
import { flats, mln } from "../lib/format";
import { usePrefersReducedMotion } from "../lib/hooks";
import FloorSheet from "./FloorSheet";
import { Arrow } from "./Icons";

const BASE = import.meta.env.BASE_URL;

/*
  Этажи размечены по фотографии (кадр 2304×3276): правая, главная башня.
  Низ 2-го этажа и верх 26-го — по линиям плит балконов; между ними шаг равный.
*/
const IMG = { w: 2304, h: 3276 };
const TOWER = { x0: 0.247, x1: 0.571, yBottom: 0.918, yTop: 0.126 };
const STEP = (TOWER.yBottom - TOWER.yTop) / (FLOORS - FIRST_LIVING_FLOOR + 1);
const floorRect = (f: number) => {
  const y1 = TOWER.yBottom - (f - FIRST_LIVING_FLOOR) * STEP;
  return { x: TOWER.x0 * IMG.w, y: (y1 - STEP) * IMG.h, w: (TOWER.x1 - TOWER.x0) * IMG.w, h: STEP * IMG.h };
};

const ROOM_OPTS = [
  { v: 0, l: "Студия" },
  { v: 1, l: "1" },
  { v: 2, l: "2" },
  { v: 3, l: "3" },
  { v: 4, l: "4+" },
];
const PRICE_STEPS = [12, 16, 20, 25, 35, 80];

export default function Hero() {
  const navigate = useNavigate();
  const reduce = usePrefersReducedMotion();
  const photo = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ floor: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [rooms, setRooms] = useState<number[]>([]);
  const [maxIdx, setMaxIdx] = useState(PRICE_STEPS.length - 1);
  const [stepFloor, setStepFloor] = useState(14);

  // Медленный наплыв фото при прокрутке — кинематографичное «дыхание» первого экрана.
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const f = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, window.scrollY / window.innerHeight);
        photo.current?.style.setProperty("--p", String(p));
      });
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => { window.removeEventListener("scroll", f); cancelAnimationFrame(raf); };
  }, [reduce]);

  const max = PRICE_STEPS[maxIdx] * 1e6;
  const matching = useMemo(
    () => APARTMENTS.filter((a) => a.status === "free" && a.price <= max && (rooms.length === 0 || rooms.includes(Math.min(a.rooms, 4)))).length,
    [rooms, max],
  );
  const go = () => {
    const q = new URLSearchParams();
    if (rooms.length) q.set("rooms", rooms.join(","));
    if (maxIdx < PRICE_STEPS.length - 1) q.set("max", String(PRICE_STEPS[maxIdx]));
    navigate(`/kvartiry${q.size ? `?${q}` : ""}`);
  };
  const stats = hover ? floorStats(hover.floor) : null;
  const floors = Array.from({ length: FLOORS - FIRST_LIVING_FLOOR + 1 }, (_, i) => FIRST_LIVING_FLOOR + i);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__photo" ref={photo}>
        <picture>
          <source media="(max-width: 700px)" srcSet={`${BASE}img/hero-900.webp`} />
          <img src={`${BASE}img/hero-1600.webp`} alt="Белая башня с волнистыми балконами над морем на закате" width={IMG.w} height={IMG.h} fetchPriority="high" />
        </picture>
        {/* Этажи поверх фото: тот же viewBox и обрезка, что у object-fit: cover. */}
        <svg className="hero__floors" viewBox={`0 0 ${IMG.w} ${IMG.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {floors.map((f) => {
            const r = floorRect(f);
            const s = floorStats(f);
            const on = hover?.floor === f || active === f;
            return (
              <rect
                key={f}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                className={`hero__floor ${on ? "is-on" : ""} ${s.free ? "" : "is-out"}`}
                onMouseMove={(e) => setHover({ floor: f, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
                onClick={() => { setActive(f); setStepFloor(f); }}
              />
            );
          })}
        </svg>
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__place">Владивосток · полуостров Басаргина</p>
        <h1 id="hero-title" className="hero__title">
          Отлив
          <span>Резиденции у Уссурийского залива</span>
        </h1>
        <p className="hero__lead">Двадцать шесть этажей над морем: волна белых террас, окна в залив и закаты, которые видно с каждого этажа.</p>

        <form className="quick" onSubmit={(e) => { e.preventDefault(); go(); }}>
          <fieldset className="quick__row">
            <legend>Комнат</legend>
            <div className="chips">
              {ROOM_OPTS.map((o) => {
                const on = rooms.includes(o.v);
                return (
                  <button key={o.v} type="button" className="chip" aria-pressed={on} onClick={() => setRooms(on ? rooms.filter((r) => r !== o.v) : [...rooms, o.v])}>
                    {o.l}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="quick__row">
            <span className="quick__label">Бюджет до</span>
            <span className="quick__range">
              <input
                style={{ "--p": `${(maxIdx / (PRICE_STEPS.length - 1)) * 100}%` } as React.CSSProperties}
                type="range"
                min={0}
                max={PRICE_STEPS.length - 1}
                value={maxIdx}
                onChange={(e) => setMaxIdx(Number(e.target.value))}
                aria-valuetext={maxIdx === PRICE_STEPS.length - 1 ? "Любой" : `${PRICE_STEPS[maxIdx]} млн рублей`}
              />
              <output>{maxIdx === PRICE_STEPS.length - 1 ? "любой" : `${PRICE_STEPS[maxIdx]} млн ₽`}</output>
            </span>
          </label>
          <button className="btn btn--primary quick__go" type="submit" disabled={matching === 0}>
            {matching === 0 ? "Нет свободных — поднимите бюджет" : `Показать ${flats(matching)}`}
            {matching ? <Arrow /> : null}
          </button>
        </form>

        <div className="floorstep" role="group" aria-label="Выбор этажа">
          <span className="floorstep__k">Этаж на доме</span>
          <button type="button" className="icon-btn" onClick={() => setStepFloor(Math.max(FIRST_LIVING_FLOOR, stepFloor - 1))} disabled={stepFloor <= FIRST_LIVING_FLOOR} aria-label="Этаж ниже">
            <Arrow dir="down" />
          </button>
          <output className="floorstep__v" aria-live="polite"><span className="num">{stepFloor}</span></output>
          <button type="button" className="icon-btn" onClick={() => setStepFloor(Math.min(FLOORS, stepFloor + 1))} disabled={stepFloor >= FLOORS} aria-label="Этаж выше">
            <Arrow dir="up" />
          </button>
          <button type="button" className="btn btn--line floorstep__go" onClick={() => setActive(stepFloor)}>План этажа</button>
        </div>
      </div>

      {hover && stats ? (
        <div className="sounding" style={{ left: hover.x, top: hover.y }} role="status">
          <b>{hover.floor} этаж</b>
          <span>{stats.free ? `${flats(stats.free)} свободно · от ${mln(stats.minPrice!, 1)}` : "Свободных нет"}</span>
        </div>
      ) : null}

      {active ? <FloorSheet floor={active} onClose={() => setActive(null)} onFloor={(f) => { setActive(f); setStepFloor(f); }} /> : null}
    </section>
  );
}

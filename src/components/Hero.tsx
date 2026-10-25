import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APARTMENTS, FLOORS, FIRST_LIVING_FLOOR, floorStats } from "../data/apartments";
import { flats, mln } from "../lib/format";
import { usePrefersReducedMotion, useMedia } from "../lib/hooks";
import FloorSheet from "./FloorSheet";
import Neatline from "./Neatline";
import { Arrow } from "./Icons";

const Scene = lazy(() => import("../three/Scene"));

const ROOM_OPTS = [
  { v: 0, l: "Ст" },
  { v: 1, l: "1" },
  { v: 2, l: "2" },
  { v: 3, l: "3" },
  { v: 4, l: "4" },
];
const PRICE_STEPS = [12, 16, 20, 25, 35, 80];

export default function Hero() {
  const navigate = useNavigate();
  const reduce = usePrefersReducedMotion();
  const compact = useMedia("(max-width: 599px)");
  const [stepFloor, setStepFloor] = useState(14);
  const wrap = useRef<HTMLElement>(null);
  const [time, setTime] = useState(0.18);
  const [hover, setHover] = useState<{ floor: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [rooms, setRooms] = useState<number[]>([]);
  const [maxIdx, setMaxIdx] = useState(PRICE_STEPS.length - 1);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  // Время суток идёт от прокрутки первого экрана: утро → закат → огни в окнах.
  useEffect(() => {
    if (reduce) { setTime(0.4); return; }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const span = Math.max(1, el.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -r.top / span));
        setTime(0.18 + p * 0.67);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
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
  const clock = timeLabel(time);

  return (
    <section ref={wrap} className={`hero ${reduce ? "hero--still" : ""}`} aria-labelledby="hero-title">
      <div className="hero__stage">
        <Neatline />
        <div className="hero__scene" aria-hidden="true">
          {webgl ? (
            <Suspense fallback={null}>
              <Scene
                time={time}
                hover={hover?.floor ?? null}
                active={active}
                compact={compact}
                onHover={(floor, e) => setHover(floor && e ? { floor, x: e.x, y: e.y } : null)}
                onPick={(f) => { setActive(f); setStepFloor(f); }}
              />
            </Suspense>
          ) : null}
        </div>

        <div className="cartouche">
          <h1 id="hero-title" className="cartouche__title">Отлив</h1>
          <p className="cartouche__lead">Квартиры у Уссурийского залива. Владивосток, полуостров Басаргина — 180 метров до воды.</p>
          <form className="quick" onSubmit={(e) => { e.preventDefault(); go(); }}>
            <fieldset className="quick__row">
              <legend>Комнат</legend>
              <div className="chips">
                {ROOM_OPTS.map((o) => {
                  const on = rooms.includes(o.v);
                  return (
                    <button
                      key={o.v}
                      type="button"
                      className="chip"
                      aria-pressed={on}
                      aria-label={o.v === 0 ? "Студия" : `${o.v}-комнатная${o.v === 4 ? " и больше" : ""}`}
                      onClick={() => setRooms(on ? rooms.filter((r) => r !== o.v) : [...rooms, o.v])}
                    >
                      {o.l}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="quick__row">
              <span className="quick__label">Цена до</span>
              <span className="quick__range">
                <input
                  style={{ "--p": `${(maxIdx / (PRICE_STEPS.length - 1)) * 100}%` } as React.CSSProperties}
                  type="range"
                  min={0}
                  max={PRICE_STEPS.length - 1}
                  step={1}
                  value={maxIdx}
                  onChange={(e) => setMaxIdx(Number(e.target.value))}
                  aria-valuetext={maxIdx === PRICE_STEPS.length - 1 ? "Любая" : `${PRICE_STEPS[maxIdx]} млн рублей`}
                />
                <output>{maxIdx === PRICE_STEPS.length - 1 ? "любая" : `${PRICE_STEPS[maxIdx]} млн ₽`}</output>
              </span>
            </label>
            <button className="btn btn--primary quick__go" type="submit" disabled={matching === 0}>
              {matching === 0 ? "Нет свободных — измените цену" : `Показать ${flats(matching)}`}
            </button>
          </form>
          <p className="cartouche__hint">Или выберите этаж прямо на доме.</p>
          {/* На телефоне линейка этажей слишком мелкая для пальца — вместо неё степпер с целями 44px. */}
          <div className="floorstep" role="group" aria-label="Выбор этажа">
            <button type="button" className="icon-btn" onClick={() => setStepFloor(Math.max(FIRST_LIVING_FLOOR, stepFloor - 1))} disabled={stepFloor <= FIRST_LIVING_FLOOR} aria-label="Этаж ниже">
              <Arrow dir="down" />
            </button>
            <output className="floorstep__v" aria-live="polite"><span className="num">{stepFloor}</span> этаж</output>
            <button type="button" className="icon-btn" onClick={() => setStepFloor(Math.min(FLOORS, stepFloor + 1))} disabled={stepFloor >= FLOORS} aria-label="Этаж выше">
              <Arrow dir="up" />
            </button>
            <button type="button" className="btn btn--line floorstep__go" onClick={() => setActive(stepFloor)}>План этажа</button>
          </div>
        </div>

        <FloorRuler hover={hover?.floor ?? null} active={active} onHover={(f) => setHover(f ? { floor: f, x: -1, y: -1 } : null)} onPick={setActive} />

        <p className="hero__clock" aria-hidden="true">Солнце над заливом <span className="num">{clock}</span></p>

        {hover && hover.x >= 0 && stats ? (
          <div className="sounding" style={{ left: hover.x, top: hover.y }} role="status">
            <b>{hover.floor} этаж</b>
            <span>{stats.free ? `${flats(stats.free)} свободно · от ${mln(stats.minPrice!, 1)}` : "Свободных нет"}</span>
          </div>
        ) : null}

        {active ? <FloorSheet floor={active} onClose={() => setActive(null)} onFloor={setActive} /> : null}
      </div>
    </section>
  );
}

function FloorRuler({ hover, active, onHover, onPick }: { hover: number | null; active: number | null; onHover: (f: number | null) => void; onPick: (f: number) => void }) {
  const floors = Array.from({ length: FLOORS - FIRST_LIVING_FLOOR + 1 }, (_, i) => FLOORS - i);
  return (
    <nav className="ruler" aria-label="Выбор этажа">
      <span className="ruler__cap">Этаж</span>
      <ol>
        {floors.map((f) => {
          const s = floorStats(f);
          return (
            <li key={f}>
              <button
                type="button"
                className={`ruler__f ${f === hover ? "is-hover" : ""} ${f === active ? "is-active" : ""} ${s.free === 0 ? "is-out" : ""}`}
                onMouseEnter={() => onHover(f)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(f)}
                onBlur={() => onHover(null)}
                onClick={() => onPick(f)}
                aria-label={`${f} этаж, ${s.free ? `${flats(s.free)} свободно` : "свободных нет"}`}
              >
                <span>{f}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function timeLabel(t: number) {
  const minutes = Math.round((7 + t * 15.5) * 60);
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

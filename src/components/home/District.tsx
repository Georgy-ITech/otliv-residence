import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "../../lib/motion";
import { MAP } from "../../data/districtMap";

const BASE = import.meta.env.BASE_URL;
const [HX, HY] = MAP.home;
const CLOSE = 3.1;

const PLACES = [
  { id: "beach", name: "Галечный пляж", v: "3 мин", how: "пешком", x: HX + 10, y: HY + 39, d: `M${HX} ${HY} Q${HX + 12} ${HY + 20} ${HX + 10} ${HY + 39}`, walk: true },
  { id: "quay", name: "Набережная и сквер", v: "7 мин", how: "пешком", x: HX - 32, y: HY + 75, d: `M${HX} ${HY} Q${HX - 6} ${HY + 42} ${HX - 32} ${HY + 75}`, walk: true },
  { id: "school", name: "Школа и детский сад", v: "9 мин", how: "пешком", x: HX - 59, y: HY - 123, d: `M${HX} ${HY} Q${HX + 14} ${HY - 80} ${HX - 59} ${HY - 123}`, walk: true },
  { id: "bridge", name: "Русский мост", v: "15 мин", how: "на машине", x: MAP.bridge[0], y: MAP.bridge[1], d: MAP.bridgeR, walk: false },
  { id: "center", name: "Центр города", v: "25 мин", how: "на машине", x: MAP.center[0], y: MAP.center[1], d: MAP.centerR, walk: false },
];

const LABELS = [
  { t: "Уссурийский залив", p: [1150, 1000], sea: true },
  { t: "о. Русский", p: MAP.labels.russky, sea: false },
  { t: "Босфор Восточный", p: MAP.labels.bosfor, sea: true },
  { t: "мыс Басаргина", p: MAP.labels.basargin, sea: false },
];

export default function District() {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<SVGGElement>(null);
  const scrollK = useRef(1);
  const view = useRef({ k: 1 });
  const [hot, setHot] = useState<string | null>(null);

  // k = 0 — дом вблизи, пешие маршруты; k = 1 — весь район, дорога до моста и центра.
  const apply = () => {
    const { k } = view.current;
    const z = 1 + (CLOSE - 1) * (1 - k);
    const tx = (MAP.w * 0.5 - HX * CLOSE) * (1 - k);
    const ty = (MAP.h * 0.5 - HY * CLOSE) * (1 - k);
    cam.current?.setAttribute("transform", `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${z.toFixed(3)})`);
    const s = svg.current?.style;
    s?.setProperty("--inv", (1 / z).toFixed(3));
    s?.setProperty("--near", String(Math.max(0, 1 - k * 2.2)));
    s?.setProperty("--far", String(Math.min(1, Math.max(0, k * 2 - 0.5))));
  };

  useEffect(() => {
    apply();
    if (!root.current || reducedMotion()) return;
    scrollK.current = 0;
    view.current.k = 0;
    apply();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ".dmap",
          start: "top 80%",
          end: "center 40%",
          scrub: 0.6,
          onUpdate: (st) => {
            scrollK.current = gsap.parseEase("power2.inOut")(Math.max(0, (st.progress - 0.25) / 0.75));
            if (!root.current?.dataset.hot) { view.current.k = scrollK.current; apply(); }
          },
        },
      });
      tl.fromTo(".dmap__tilt", { rotateX: 44, scale: 0.9 }, { rotateX: 8, scale: 1, duration: 1 }, 0)
        .fromTo(".dmap__route--walk", { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.04, duration: 0.25 }, 0)
        .fromTo(".dmap__route--car", { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.08, duration: 0.42 }, 0.5);
      gsap.from(".dist__item", { x: -40, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".dist__list", start: "top 80%", once: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  // Наведение на пункт ведёт камеру: пешие точки — к дому, дальние — на весь район.
  useEffect(() => {
    if (!root.current) return;
    const place = PLACES.find((p) => p.id === hot);
    if (place) root.current.dataset.hot = "1"; else delete root.current.dataset.hot;
    const target = place ? (place.walk ? 0 : 1) : scrollK.current;
    if (reducedMotion()) { view.current.k = target; apply(); return; }
    const tw = gsap.to(view.current, { k: target, duration: 0.9, ease: "power3.inOut", onUpdate: apply });
    return () => { tw.kill(); };
  }, [hot]);

  return (
    <section id="rayon" className="dist" ref={root} aria-labelledby="dist-title">
      <div className="dist__text">
        <h2 id="dist-title" className="h2">Тихая сторона Владивостока</h2>
        <p>Полуостров Басаргина: сопки, бухты и тропы вдоль берега. Мосты и центр рядом, а за окном только залив.</p>
        <ul className="dist__list">
          {PLACES.map((p) => (
            <li key={p.id} className={`dist__item ${hot === p.id ? "is-hot" : ""}`} onMouseEnter={() => setHot(p.id)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(p.id)} onBlur={() => setHot(null)} tabIndex={0}>
              <span className="dist__name">{p.name}</span>
              <b className="dist__v num">{p.v}</b>
              <span className="dist__how">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  {p.walk ? <path d="M11 3a1.6 1.6 0 1 1 0 .1M9 18l2-5 2 2v3M8 9l3-2 2 3 2 1M11 7l-1 6" /> : <path d="M3 13l1.5-5h11L17 13v3H3zM6 16v1.5M14 16v1.5M5 13h1M14 13h1" />}
                </svg>
                {p.how}
              </span>
            </li>
          ))}
        </ul>
        <p className="dist__note">Время в пути — оценка, положение дома условное. Берег, дороги и застройка: © участники OpenStreetMap, рельеф: Mapzen.</p>
      </div>

      <div className="dmap" aria-hidden="true">
        <div className="dmap__tilt">
          <svg ref={svg} viewBox={`0 0 ${MAP.w} ${MAP.h}`} className={hot ? "has-hot" : ""}>
            <g ref={cam}>
              <image href={`${BASE}img/district-4000.webp`} width={MAP.w} height={MAP.h} />
              {MAP.span.map((d) => <path key={d} d={d} className="dmap__bridge" />)}
              {LABELS.map((l) => (
                <g key={l.t} transform={`translate(${l.p[0]} ${l.p[1]})`} className="dmap__far">
                  <text className={`dmap__label ${l.sea ? "dmap__label--sea" : ""}`} textAnchor="middle">{l.t}</text>
                </g>
              ))}
              {PLACES.map((p) => (
                <path key={p.id} d={p.d} pathLength={1} className={`dmap__route ${p.walk ? "dmap__route--walk" : "dmap__route--car"} ${hot === p.id ? "is-hot" : ""}`} />
              ))}
              {PLACES.map((p) => (
                <g key={p.id} className={`dmap__pin ${p.walk ? "dmap__near" : "dmap__far"} ${hot === p.id ? "is-hot" : ""}`} transform={`translate(${p.x} ${p.y})`}>
                  <g className="dmap__inv">
                    <circle r="8" />
                    <text y="-18" textAnchor="middle">{p.name}</text>
                  </g>
                </g>
              ))}
              <g transform={`translate(${HX} ${HY})`}>
                <g className="dmap__inv dmap__home">
                  <circle r="26" className="dmap__pulse" />
                  <circle r="11" />
                  <text y="44" textAnchor="middle">Отлив</text>
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}

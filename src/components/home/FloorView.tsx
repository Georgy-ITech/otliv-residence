import { srcset } from "../../data/images";
import { useEffect, useRef, useState } from "react";
import { FLOORS } from "../../data/apartments";
import { ScrollTrigger, reducedMotion, startLenis } from "../../lib/motion";

const BASE = import.meta.env.BASE_URL;

/* Высота окна над водой и дальность горизонта: d ≈ 3,57·√h км (h в метрах). */
const heightM = (f: number) => 6 + (f - 1) * 3.3;
const horizonKm = (f: number) => 3.57 * Math.sqrt(heightM(f));
const SEEN = [
  { f: 1, t: "сосны во дворе и кромка пляжа" },
  { f: 6, t: "над кронами открывается залив" },
  { f: 11, t: "Русский мост целиком" },
  { f: 17, t: "остров Русский и выход в море" },
  { f: 23, t: "Уссурийский залив до самого горизонта" },
];

export default function FloorView() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [floor, setFloor] = useState(1);

  useEffect(() => {
    if (!root.current || !stage.current) return;
    if (reducedMotion()) { stage.current.style.setProperty("--p", "0.5"); stage.current.style.setProperty("--z", "1.5"); setFloor(13); return; }
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (s) => {
        const p = s.progress;
        stage.current?.style.setProperty("--p", p.toFixed(4));
        // Ниже всего картина меняется быстрее: первые этажи упираются в кроны, дальше — открытый залив.
        stage.current?.style.setProperty("--z", (1 + 1 * Math.pow(1 - p, 1.6)).toFixed(4));
        setFloor(1 + Math.round(s.progress * (FLOORS - 1)));
      },
    });
    return () => st.kill();
  }, []);

  // Ползунок двигает саму страницу: этаж всегда равен положению прокрутки.
  const goFloor = (f: number) => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + ((f - 1) / (FLOORS - 1)) * (el.offsetHeight - window.innerHeight);
    const lenis = startLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo(0, y);
  };

  const seen = [...SEEN].reverse().find((s) => floor >= s.f)!;

  return (
    <section className="fview" ref={root} aria-labelledby="fview-title">
      <div className="fview__stage" ref={stage}>
        <div className="fview__pano">
          <img src={`${BASE}img/city-russky-1600.webp`} srcSet={srcset("city-russky")} sizes="calc(max(100vw, 133svh) * 2)" alt="Вид на Уссурийский залив и Русский мост с высоты" loading="lazy" width={1600} height={1200} />
        </div>
        <div className="fview__haze" aria-hidden="true" />
        <svg className="fview__frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M33.3 0V100M66.6 0V100M0 76H100" />
        </svg>

        <div className="fview__ui">
          <h2 id="fview-title" className="fview__title">Вид из окна</h2>
          <p className="fview__floor" aria-live="polite">
            <span className="fview__n num">{floor}</span>
            <span className="fview__k">этаж</span>
          </p>
          <dl className="fview__facts">
            <div><dt>над водой</dt><dd className="num">{Math.round(heightM(floor))} м</dd></div>
            <div><dt>горизонт</dt><dd className="num">{horizonKm(floor).toFixed(1).replace(".", ",")} км</dd></div>
          </dl>
          <p className="fview__seen">В окне: {seen.t}</p>
        </div>

        <label className="fview__scale">
          <span className="sr-only">Этаж</span>
          <input
            type="range" min={1} max={FLOORS} step={1} value={floor}
            onChange={(e) => goFloor(Number(e.target.value))}
            aria-valuetext={`${floor} этаж`}
          />
          <span className="fview__ticks" aria-hidden="true">
            {Array.from({ length: FLOORS }, (_, i) => <i key={i} className={FLOORS - i === floor ? "is-on" : ""} />)}
          </span>
        </label>
      </div>
    </section>
  );
}

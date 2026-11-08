import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, reducedMotion } from "../lib/motion";
import Water from "./Water";

const BASE = import.meta.env.BASE_URL;

/*
  Первый экран — уровень воды (--h). Над водой — разметка, под водой — WebGL-вода
  с отражением сцены. При прокрутке вода отступает и открывает заголовок и цифры.
*/
function Scene() {
  return (
    <div className="hero__scene">
      <div className="hero__photo">
        <span className="hero__scrim" aria-hidden="true" />
        <picture>
          <source media="(max-width: 760px)" srcSet={`${BASE}img/hero-wide-750m.webp 750w, ${BASE}img/hero-wide-1200m.webp 1200w, ${BASE}img/hero-wide-1600m.webp 1600w`} sizes="max(100vw, 57svh)" />
          <img
            src={`${BASE}img/hero-wide-1600.webp`}
            srcSet={`${BASE}img/hero-wide-1600.webp 1600w, ${BASE}img/hero-wide-2400.webp 2400w, ${BASE}img/hero-wide-3200.webp 3200w, ${BASE}img/hero-wide-4400.webp 4400w`}
            sizes="max(100vw, 178svh)"
            alt="Белая башня с волнистыми террасами над заливом на закате"
            width={2400}
            height={1350}
            fetchPriority="high"
          />
        </picture>
      </div>

      <p className="hero__place">Владивосток · полуостров Басаргина</p>
      <h1 id="hero-title" className="hero__title">Отлив</h1>
      <p className="hero__sub">
        Резиденции у Уссурийского залива. 194&nbsp;квартиры, сдача в IV квартале 2028 года.
      </p>

      <dl className="hero__nums">
        <div className="hnum hnum--floors">
          <dt>этажей над водой</dt>
          <dd>
            <span className="hnum__ticks" aria-hidden="true">
              {Array.from({ length: 26 }, (_, i) => <i key={i} />)}
            </span>
            <b className="num">26</b>
          </dd>
        </div>
        <div className="hnum hnum--sea">
          <dt>до линии прибоя</dt>
          <dd>
            <b className="num">180<small> м</small></b>
            <svg className="hnum__dim" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M1 1v10M1 6h92" />
              <path d="M93 6c4-5 8-5 12 0s8 5 14 0" />
            </svg>
          </dd>
        </div>
        <div className="hnum hnum--ceil">
          <dt>высота потолков</dt>
          <dd>
            <svg className="hnum__vdim" viewBox="0 0 12 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M1 1h10M6 1v98M1 99h10" />
            </svg>
            <b className="num">3,15<small> м</small></b>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = stage.current;
    if (reducedMotion() || !root.current || !st) return;
    const sec = root.current;
    // Первый экран — обычный кадр во весь экран, без прокрутки-«пустышки».
    sec.classList.add("is-drained");
    ScrollTrigger.refresh();
    let drain: gsap.core.Tween | undefined;
    // Дом построен заставкой; под ней уже стоит вода у нижней части дома. Пока заставка растворяется,
    // вода видна, затем медленно сходит — с балконов и букв стекают капли.
    const arrive = () => {
      sec.classList.add("is-arrive");
      drain = gsap.to(st, { "--h": 0.95, duration: 3.4, delay: 0.7, ease: "power2.inOut" });
    };
    if (window.__otlivReady || window.scrollY > 10) { st.style.setProperty("--h", "0.95"); sec.classList.add("is-arrive"); }
    else {
      st.style.setProperty("--h", "0.62");
      sec.classList.add("is-waiting");
      window.addEventListener("otliv:ready", arrive, { once: true });
    }
    return () => { window.removeEventListener("otliv:ready", arrive); drain?.kill(); };
  }, []);

  return (
    <section className="hero" ref={root} aria-labelledby="hero-title">
      <div className="hero__stage" ref={stage}>
        <div className="hero__air"><Scene /></div>
        <Water stage={stage} still={reducedMotion()} />
      </div>
    </section>
  );
}

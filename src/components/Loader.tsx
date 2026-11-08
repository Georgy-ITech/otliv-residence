import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "../lib/motion";

const BASE = import.meta.env.BASE_URL;
const MIN_MS = 2200;
const MAX_MS = 8000;
/** Если ролик не начал играть за это время (медленная сеть, запрет автозапуска) — обходимся без него. */
const VIDEO_WAIT_MS = 3000;

declare global {
  interface Window { __otlivReady?: boolean }
}

/** Сигнал первому экрану: заставка ушла. */
function release() {
  window.__otlivReady = true;
  window.dispatchEvent(new Event("otliv:ready"));
}

function loadImage(src: string) {
  return new Promise<void>((done) => {
    const i = new Image();
    i.onload = i.onerror = () => done();
    i.src = src;
  });
}

/*
  Заставка — покадровая стройка: дом с первого экрана растёт бетоном, за ним «надевается»
  фасад. Последний кадр ролика совпадает с кадром первого экрана, поэтому заставка просто
  растворяется, и под ней оказывается тот же дом. Счётчик и линия внизу идут за роликом,
  но не обгоняют реальную загрузку (шрифты и кадр первого экрана).
*/
export default function Loader() {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);
  const [gone, setGone] = useState(false);
  const [mobile] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  const video = useRef<HTMLVideoElement>(null);
  const real = useRef(0);

  useEffect(() => {
    if (reducedMotion()) { release(); setGone(true); return; }
    const hero = document.querySelector<HTMLImageElement>(".hero__photo img");
    const jobs = [
      document.fonts?.ready ?? Promise.resolve(),
      hero ? hero.decode().catch(() => undefined) : Promise.resolve(),
      loadImage(`${BASE}img/hero-wet.webp`),
    ];
    jobs.forEach((j) => Promise.resolve(j).then(() => { real.current += 1 / jobs.length; }));

    const v = video.current;
    let playing = false;
    v?.addEventListener("playing", () => { playing = true; }, { once: true });
    v?.play().catch(() => undefined);

    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const t = performance.now() - t0;
      const noVideo = !playing && t > VIDEO_WAIT_MS;
      const film = v && playing && v.duration ? (v.ended ? 1 : v.currentTime / v.duration) : noVideo ? t / MIN_MS : 0;
      const p = Math.min(film, real.current, 1);
      const shown = t > MAX_MS ? 1 : p;
      setPct(Math.round(shown * 100));
      if (shown >= 1) {
        setOut(true);
        release();
        window.setTimeout(() => setGone(true), 900);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;
  const name = mobile ? "build-intro-m" : "build-intro";
  return (
    <div className={`loader ${out ? "is-out" : ""}`} aria-hidden="true">
      <video
        ref={video}
        className="loader__film"
        muted
        playsInline
        preload="auto"
        poster={`${BASE}img/${name}-first.webp`}
      >
        <source src={`${BASE}img/${name}.webm`} type="video/webm" />
        <source src={`${BASE}img/${name}.mp4`} type="video/mp4" />
      </video>
      <svg className="loader__mark" viewBox="0 0 132 32">
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path pathLength={1} d="M9 7c2.4-2 4.6-2 7 0s4.6 2 7 0" />
          <path pathLength={1} d="M5 14c2.6-2.2 5.4-2.2 8 0s5.4 2.2 8 0 5.4-2.2 7 0" />
          <path pathLength={1} d="M2 21c3-2.4 6-2.4 9 0s6 2.4 9 0 6-2.4 10 0" />
          <path pathLength={1} className="loader__sea" d="M1 28h30" />
        </g>
        <text x="42" y="23" className="logo__word loader__word">
          {"ОТЛИВ".split("").map((ch, i) => (
            <tspan key={i} style={{ "--i": i } as React.CSSProperties}>{ch}</tspan>
          ))}
        </text>
      </svg>
      <div className="loader__foot">
        <span>Идёт строительство · сдача IV кв. 2028</span>
        <span className="num">{String(pct).padStart(3, "0")}</span>
      </div>
      <span className="loader__line" style={{ scale: `${pct / 100} 1` }} />
    </div>
  );
}

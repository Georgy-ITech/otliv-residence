import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "../../lib/motion";
import { srcset } from "../../data/images";

const BASE = import.meta.env.BASE_URL;

const SHOTS = [
  { n: "int-living", t: "Гостиная на закат", d: "Окна в пол на всю ширину, терраса до трёх метров.", size: "wide" },
  { n: "int-window", t: "Окно в залив", d: "Южная сторона целиком смотрит на воду.", size: "tall" },
  { n: "int-open", t: "Гостиная с террасой", d: "Раздвижные двери открывают комнату на террасу и залив.", size: "wide" },
  { n: "int-dining", t: "Кухня-столовая", d: "Потолки 3,15 м и угловое остекление.", size: "tall" },
  { n: "int-sleep", t: "Спальня у воды", d: "Окно в пол: первое, что видишь утром, — залив.", size: "wide" },
  { n: "int-loft", t: "Пентхаусы", d: "Открытая планировка и проём на море во всю стену.", size: "wide" },
];

export default function Gallery() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = root.current;
    if (!sec || reducedMotion()) return;
    sec.classList.add("is-live");
    const ctx = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>(".scene");
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 1 },
      });
      const parts = (s: HTMLElement) => ({
        img: s.querySelector("img"),
        dim: s.querySelector(".scene__dim"),
        cap: s.querySelectorAll(".scene__cap .mask > *"),
      });

      // Первый кадр: из окна рядом с заголовком — на весь экран.
      const first = parts(scenes[0]);
      // Стартовая маска явно в fromTo: браузер сокращает inset(52% 6% 8% 6%) до inset(52% 6% 8%), и GSAP читал левый край как 0 — фото прыгало влево в начале прокрутки.
      const firstClip = window.innerWidth <= 760 ? "inset(52% 6% 8% 6%)" : "inset(16% 6% 16% 50%)";
      gsap.set(scenes[0], { clipPath: firstClip });
      gsap.set(first.cap, { yPercent: 110 });
      tl.fromTo(scenes[0], { clipPath: firstClip }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power2.inOut", immediateRender: true }, 0)
        .fromTo(first.img, { scale: 1.12 }, { scale: 1, duration: 0.8, ease: "power2.inOut" }, 0)
        .to(".gal__intro", { xPercent: -14, opacity: 0, duration: 0.5, ease: "power1.in" }, 0.05)
        .to(first.cap, { yPercent: 0, duration: 0.3, stagger: 0.05, ease: "power3.out" }, 0.55);

      // Следующие кадры раздвигаются из щели, как панорамные двери; прежний уходит в глубину.
      // Стартовая маска задаётся явно в fromTo: браузер сокращает inset(0% 50% 0% 50%) до inset(0% 50%), и GSAP читал левый край как 0.
      scenes.slice(1).forEach((s, i) => {
        const at = 1 + i * 1.4;
        const prev = parts(scenes[i]);
        const cur = parts(s);
        // У вертикального кадра раскрывается само фото, а прежний кадр остаётся затемнённым фоном.
        const door = s.classList.contains("scene--tall") ? s.querySelector(".scene__img") : s;
        gsap.set(cur.cap, { yPercent: 110 });
        tl.to(prev.cap, { yPercent: -110, duration: 0.25, stagger: 0.03, ease: "power2.in" }, at)
          .to(prev.img, { scale: 1.12, duration: 0.8, ease: "power1.in" }, at)
          .to(prev.dim, { opacity: 0.7, duration: 0.8 }, at)
          .fromTo(door, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut", immediateRender: true }, at + 0.05)
          .fromTo(cur.img, { scale: 1.12 }, { scale: 1, duration: 1.2, ease: "power2.out" }, at + 0.05)
          .to(cur.cap, { yPercent: 0, duration: 0.3, stagger: 0.05, ease: "power3.out" }, at + 0.75);
      });
      tl.fromTo(".gal__line", { scaleX: 0 }, { scaleX: 1, duration: tl.duration() }, 0);
    }, sec);
    return () => { ctx.revert(); sec.classList.remove("is-live"); };
  }, []);

  return (
    <section className="gal" ref={root} aria-labelledby="gal-title">
      <div className="gal__stage">
        <div className="gal__intro">
          <h2 id="gal-title" className="gal__title">Свет,<br />вода<br />и тишина</h2>
          <p>Шесть сцен из жизни у залива.</p>
          </div>
        {SHOTS.map((s, i) => (
          <figure key={s.n} className={`scene scene--${s.size} ${i % 2 ? "scene--flip" : ""}`}>
            <div className="scene__img">
              <img
                src={`${BASE}img/${s.n}-1600.webp`}
                srcSet={srcset(s.n)}
                sizes={s.size === "wide" ? "max(100vw, 150svh)" : "(max-width: 760px) max(100vw, 75svh), max(50vw, 75svh)"}
                alt={s.t}
              />
            </div>
            <figcaption className="scene__cap">
              <span className="mask"><b>{s.t}</b></span>
              <span className="mask"><span className="scene__d">{s.d}</span></span>
            </figcaption>
            <span className="scene__dim" aria-hidden="true" />
          </figure>
        ))}
        <span className="gal__line" aria-hidden="true" />
      </div>
    </section>
  );
}

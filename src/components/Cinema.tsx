import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FACTS } from "../data/site";
import { Arrow } from "./Icons";

const BASE = import.meta.env.BASE_URL;
const img = (n: string) => ({
  src: `${BASE}img/${n}-1600.webp`,
  srcSet: `${BASE}img/${n}-800.webp 800w, ${BASE}img/${n}-1600.webp 1600w`,
});

/** Появление по прокрутке: элемент уже видим по умолчанию, класс лишь добавляет движение. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("rv");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("rv--in"); io.disconnect(); } }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Manifest() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="manifest" aria-labelledby="manifest-title">
      <h2 id="manifest-title" className="manifest__text">
        Дом, который <em>повторяет море</em>: белые террасы ложатся волной, и каждая квартира получает свой кусок горизонта.
      </h2>
      <dl className="facts">
        {FACTS.map((f) => (
          <div key={f.k}>
            <dd className="num">{f.v}</dd>
            <dt>{f.k}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

const ROOMS = [
  { n: "int-living", t: "Гостиная на закат", d: "Окна в пол на всю ширину, терраса глубиной до трёх метров." },
  { n: "int-window", t: "Окно в залив", d: "Каждая квартира южной стороны смотрит на воду." },
  { n: "int-dining", t: "Кухня-столовая", d: "Потолки 3,15 м и угловое остекление в квартирах на две стороны." },
  { n: "int-kitchen", t: "Пентхаусы", d: "Два пентхауса с террасами 46 и 52 м² на последнем этаже." },
  { n: "int-bedroom", t: "Спальня над морем", d: "Тишина: окна с тройным стеклопакетом, шум прибоя — только если открыть." },
];

export function Interiors() {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.7, behavior: "smooth" });
  return (
    <section className="interiors" aria-labelledby="int-title">
      <div className="interiors__head">
        <h2 id="int-title" className="h2">Жизнь с видом на горизонт</h2>
        <div className="interiors__nav">
          <button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label="Назад"><Arrow dir="left" /></button>
          <button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label="Дальше"><Arrow /></button>
        </div>
      </div>
      <div className="interiors__track" ref={track} tabIndex={0} aria-label="Интерьеры, листайте вбок">
        {ROOMS.map((r) => (
          <figure key={r.n} className="still">
            <img {...img(r.n)} sizes="(max-width: 700px) 86vw, 46vw" alt={r.t} loading="lazy" width={1600} height={1067} />
            <figcaption>
              <b>{r.t}</b>
              <span>{r.d}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="interiors__note">Фотографии интерьеров — референс отделки и видов, не съёмка квартир «Отлива».</p>
    </section>
  );
}

const PLACES = [
  { name: "Галечный пляж", v: "3 мин", how: "пешком" },
  { name: "Набережная и сквер", v: "7 мин", how: "пешком" },
  { name: "Школа и детский сад", v: "9 мин", how: "пешком" },
  { name: "Русский мост", v: "15 мин", how: "на машине" },
  { name: "Центр города", v: "25 мин", how: "на машине" },
];

export function City() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="rayon" className="city" aria-labelledby="city-title">
      <div className="city__media">
        <img {...img("city-russky")} sizes="(max-width: 860px) 100vw, 60vw" alt="Русский мост над заливом" loading="lazy" width={1600} height={1067} className="city__a" />
        <img {...img("city-golden")} sizes="(max-width: 860px) 60vw, 28vw" alt="Золотой мост на закате" loading="lazy" width={1600} height={1067} className="city__b" />
      </div>
      <div className="city__text">
        <h2 id="city-title" className="h2">Город у воды, в двадцати минутах от центра</h2>
        <p>Полуостров Басаргина — тихая сторона Владивостока: сопки, бухты и прогулочные тропы вдоль берега. Мосты и центр — рядом, но за окном только залив.</p>
        <ul className="places">
          {PLACES.map((p) => (
            <li key={p.name}>
              <span>{p.name}</span>
              <b className="num">{p.v}</b>
              <i>{p.how}</i>
            </li>
          ))}
        </ul>
        <p className="muted">Время в пути — оценка.</p>
      </div>
    </section>
  );
}

export function Choose() {
  return (
    <section className="choose" aria-labelledby="choose-title">
      <img {...img("coast")} sizes="100vw" alt="" loading="lazy" width={1600} height={900} className="choose__bg" />
      <div className="choose__inner">
        <h2 id="choose-title" className="h2">Выберите квартиру по этажу, виду и бюджету</h2>
        <p>194 квартиры от студий до пентхаусов: шахматка, фильтры, планировки в масштабе и вид из окна для каждого этажа.</p>
        <div className="choose__acts">
          <Link className="btn btn--primary" to="/kvartiry">Все квартиры <Arrow /></Link>
          <Link className="btn btn--line" to="/kvartiry?mode=grid">Шахматка</Link>
        </div>
      </div>
    </section>
  );
}

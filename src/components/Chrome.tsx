import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SITE } from "../data/site";
import { useList } from "../lib/store";
import { APARTMENTS } from "../data/apartments";
import { startLenis } from "../lib/motion";
import { WIDTHS, srcset } from "../data/images";

const BASE = import.meta.env.BASE_URL;
const FREE = APARTMENTS.filter((a) => a.status === "free").length;

const MENU = [
  { to: "/kvartiry", label: "Квартиры", note: `${FREE} свободно`, img: "int-living" },
  { to: "/?to=ipoteka", label: "Ипотека", note: "расчёт платежа", img: "int-dining" },
  { to: "/?to=rayon", label: "Район", note: "Басаргина и мосты", img: "city-russky" },
  { to: "/?to=stroyka", label: "Стройка", note: "сдача IV кв. 2028", img: "coast" },
  { to: "/?to=zapis", label: "Просмотр", note: "запись на показ", img: "city-night" },
];

/** Знак: три террасы-волны, сужающиеся кверху, — силуэт башни у воды. */
export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 132 32" aria-hidden="true">
      <g className="logo__mark" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M9 7c2.4-2 4.6-2 7 0s4.6 2 7 0" />
        <path d="M5 14c2.6-2.2 5.4-2.2 8 0s5.4 2.2 8 0 5.4-2.2 7 0" />
        <path d="M2 21c3-2.4 6-2.4 9 0s6 2.4 9 0 6-2.4 10 0" />
        <path className="logo__sea" d="M1 28h30" />
      </g>
      <text x="42" y="23" className="logo__word">ОТЛИВ</text>
    </svg>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const { pathname, search } = useLocation();
  const fav = useList("fav");
  const cmp = useList("cmp");
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // На главной фон шапки появляется, только когда первый экран прокручен: кадр остаётся целым.
    const f = () => {
      const hero = document.querySelector<HTMLElement>(".hero");
      const lim = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight : 24;
      setScrolled(window.scrollY > lim);
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    const lenis = startLenis();
    if (open) lenis?.stop(); else lenis?.start();
    document.documentElement.classList.toggle("menu-open", open);
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <>
      <header className={`head ${scrolled || pathname !== "/" ? "is-solid" : ""} ${open ? "is-open" : ""}`}>
        <Link to="/" className="head__logo" aria-label="Отлив — на главную"><Logo /></Link>
        <Link to="/kvartiry" className="head__flats">
          <span className="head__flats-k">Квартиры</span>
          <span className="head__flats-n num">{FREE}</span>
        </Link>
        {fav.length || cmp.length ? (
          <NavLink to="/sravnenie" className="head__cmp">Сравнение <span className="num">{cmp.length}</span></NavLink>
        ) : null}
        <button ref={btn} type="button" className="head__menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
          <span className="head__menu-t">{open ? "Закрыть" : "Меню"}</span>
          <span className="head__menu-i" aria-hidden="true"><i /><i /></span>
        </button>
        <span className="head__horizon" aria-hidden="true" />
      </header>
      {/* Плёночное зерно поверх всего сайта: плоский тёмный фон перестаёт выглядеть пластиком. */}
      <div className="grain" aria-hidden="true" />

      <div id="menu" className={`menu ${open ? "is-open" : ""}`} inert={!open} aria-label="Меню">
        <div className="menu__media" aria-hidden="true">
          {MENU.map((m, i) => (
            <img key={m.img} src={`${BASE}img/${m.img}-1600.webp`} srcSet={WIDTHS[m.img] ? srcset(m.img) : `${BASE}img/${m.img}-800.webp 800w, ${BASE}img/${m.img}-1600.webp 1600w`} sizes="(max-width: 760px) 100vw, 45vw" alt="" className={i === hover ? "is-on" : ""} loading="lazy" />
          ))}
        </div>
        <nav className="menu__nav" aria-label="Разделы">
          {MENU.map((m, i) => (
            <Link key={m.to} to={m.to} className="menu__link" style={{ "--i": i } as React.CSSProperties} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
              <span className="menu__label">{m.label}</span>
              <span className="menu__note">{m.note}</span>
            </Link>
          ))}
        </nav>
        <div className="menu__foot">
          <a className="menu__phone num" href={SITE.phoneHref}>{SITE.phone}</a>
          <p>{SITE.hours}</p>
          <p>{SITE.address}</p>
        </div>
      </div>
    </>
  );
}

const ICONS = {
  phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  wave: "M2 9c3-3 5-3 8 0s5 3 8 0 3-2 4-1M2 15c3-3 5-3 8 0s5 3 8 0 3-2 4-1",
};

function Ico({ d }: { d: string }) {
  return <svg className="foot__ico" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
}

export function Footer() {
  const up = () => {
    const lenis = startLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0 });
  };

  return (
    <footer className="foot">
      <div className="foot__grid">
        <div className="foot__lead">
          <p className="foot__claim">Дом у воды, который виден с моря.</p>
          <Link to="/?to=zapis" className="foot__cta">
            <span>Записаться на просмотр</span>
            <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6c5-6 9-6 14 0s9 6 14 0M30 1l6 5-6 5" /></svg>
          </Link>
        </div>
        <nav className="foot__nav" aria-label="Разделы в подвале">
          <p className="foot__h">Разделы</p>
          {MENU.map((m) => <Link key={m.to} to={m.to}>{m.label}</Link>)}
        </nav>
        <div className="foot__contacts">
          <p className="foot__h">Связаться</p>
          <a className="num" href={SITE.phoneHref}><Ico d={ICONS.phone} />{SITE.phone}</a>
          <p><Ico d={ICONS.clock} />{SITE.hours.replace("Офис продаж: ", "")}</p>
          <p><Ico d={ICONS.pin} />Полуостров Басаргина, берег Уссурийского залива</p>
          <p><Ico d={ICONS.wave} />180 м до линии прибоя</p>
        </div>
        <button type="button" className="foot__up" onClick={up} aria-label="Наверх">
          <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" /><path d="M24 33V15M16 22l8-8 8 8" /></svg>
        </button>
      </div>


      <div className="foot__base">
        <p className="foot__legal">Берег и координаты на карте условные. Цены, статусы квартир и ход строительства приведены для демонстрации интерфейса. Фотографии интерьеров — референс отделки и видов.</p>
        <p className="foot__sig">
          © 2026 «Отлив» · Концепт-проект · Дизайн и разработка —{" "}
          <a href={SITE.kwork} target="_blank" rel="noopener">Georgy_Tech</a>
        </p>
      </div>
    </footer>
  );
}

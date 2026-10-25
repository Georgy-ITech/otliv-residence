import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SITE } from "../data/site";
import { useList } from "../lib/store";
import { Phone } from "./Icons";

export const SECTIONS = [
  { id: "ipoteka", label: "Ипотека" },
  { id: "rayon", label: "Район" },
  { id: "stroyka", label: "Ход строительства" },
  { id: "zapis", label: "Контакты" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  const fav = useList("fav");
  const cmp = useList("cmp");

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => setOpen(false), [pathname, search]);

  return (
    <header className={`head ${scrolled || pathname !== "/" ? "is-solid" : ""} ${open ? "is-open" : ""}`}>
      <Link to="/" className="mark" aria-label="Отлив — на главную">
        Отлив
      </Link>
      <nav className="head__nav" id="main-nav" aria-label="Разделы">
        <NavLink to="/kvartiry">Квартиры</NavLink>
        {SECTIONS.map((s) => (
          <Link key={s.id} to={`/?to=${s.id}`}>{s.label}</Link>
        ))}
        {fav.length || cmp.length ? (
          <NavLink to="/sravnenie" className="head__cmp">
            Сравнение <span className="num">{cmp.length}</span>
          </NavLink>
        ) : null}
      </nav>
      <a className="head__phone num" href={SITE.phoneHref}>
        <Phone />
        <span>{SITE.phone}</span>
      </a>
      <Link to="/kvartiry" className="btn btn--primary head__cta">Выбрать квартиру</Link>
      <button type="button" className="head__burger" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
        <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
        <i /><i />
      </button>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot__grid">
        <div>
          <p className="foot__mark">Отлив</p>
          <p className="foot__addr">{SITE.address}</p>
        </div>
        <div className="foot__contacts">
          <a className="num" href={SITE.phoneHref}>{SITE.phone}</a>
          <p>{SITE.hours}</p>
        </div>
        <nav className="foot__nav" aria-label="Разделы в подвале">
          <Link to="/kvartiry">Квартиры</Link>
          {SECTIONS.map((s) => (
            <Link key={s.id} to={`/?to=${s.id}`}>{s.label}</Link>
          ))}
        </nav>
      </div>
      <p className="foot__legal">
        Берег и координаты на карте условные. Цены, статусы квартир и ход строительства приведены для демонстрации интерфейса.
      </p>
      <p className="foot__sig">
        © 2026 «Отлив» · Концепт-проект · Дизайн и разработка —{" "}
        <a href={SITE.kwork} target="_blank" rel="noopener">Georgy_Tech</a>
      </p>
    </footer>
  );
}

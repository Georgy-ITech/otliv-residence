import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Hero from "../components/Hero";
import Gallery from "../components/home/Gallery";
import FloorView from "../components/home/FloorView";
import Chess from "../components/home/Chess";
import District from "../components/home/District";
import Build from "../components/home/Build";
import { Mortgage } from "../components/Sections";
import ViewingForm from "../components/ViewingForm";
import { startLenis } from "../lib/motion";

/*
  Композиции чередуются: вода во весь экран → горизонтальная лента → закреплённая панорама →
  инструмент-шахматка → текст на воздухе с калькулятором → асимметрия с картой → закреплённый
  рост дома → форма.
*/
export default function Home() {
  const [params] = useSearchParams();
  const to = params.get("to");

  // Ссылки меню ведут на «/?to=раздел»: хеш занят роутером, поэтому прокрутка — по параметру.
  useEffect(() => {
    if (!to) return;
    const id = window.setTimeout(() => {
      const el = document.getElementById(to);
      if (!el) return;
      const lenis = startLenis();
      if (lenis) lenis.scrollTo(el, { duration: 1.4 });
      else el.scrollIntoView({ block: "start" });
    }, 120);
    return () => window.clearTimeout(id);
  }, [to]);

  useEffect(() => {
    document.title = "Отлив — резиденции у Уссурийского залива, Владивосток";
  }, []);

  return (
    <>
      <Hero />
      <Gallery />
      <FloorView />
      <Chess />
      <Mortgage />
      <District />
      <Build />
      <ViewingForm />
    </>
  );
}

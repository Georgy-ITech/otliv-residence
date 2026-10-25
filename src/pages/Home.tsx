import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Hero from "../components/Hero";
import { Choose, City, Interiors, Manifest } from "../components/Cinema";
import { Journal, Mortgage, Types } from "../components/Sections";
import ViewingForm from "../components/ViewingForm";

export default function Home() {
  const [params] = useSearchParams();
  const to = params.get("to");

  // Ссылки шапки ведут на «/?to=раздел»: хеш занят роутером, поэтому прокрутка — по параметру.
  useEffect(() => {
    if (!to) return;
    const id = requestAnimationFrame(() => document.getElementById(to)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(id);
  }, [to]);

  useEffect(() => {
    document.title = "Отлив — резиденции у Уссурийского залива, Владивосток";
  }, []);

  return (
    <>
      <Hero />
      <Manifest />
      <Interiors />
      <Types />
      <Choose />
      <City />
      <Mortgage />
      <Journal />
      <ViewingForm />
    </>
  );
}

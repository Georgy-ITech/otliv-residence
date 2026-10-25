import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { APARTMENTS, byId, roomsLabel, statusLabel } from "../data/apartments";
import { m2, mln, rub } from "../lib/format";
import { toggle, useList } from "../lib/store";
import ApartmentPlan from "../components/ApartmentPlan";
import CoastProfile from "../components/CoastProfile";
import FloorPlan from "../components/FloorPlan";
import { Mortgage } from "../components/Sections";
import ViewingForm from "../components/ViewingForm";
import { Arrow, Mark, Scales } from "../components/Icons";
import NotFound from "./NotFound";

export default function ApartmentPage() {
  const { id = "" } = useParams();
  const a = byId.get(id);
  const fav = useList("fav");
  const cmp = useList("cmp");

  useEffect(() => {
    if (a) document.title = `${roomsLabel(a.rooms)}, ${m2(a.area)}, ${a.floor} этаж — Отлив`;
    window.scrollTo(0, 0);
  }, [a]);

  if (!a) return <NotFound />;

  const same = APARTMENTS.filter((x) => x.slot === a.slot && x.id !== a.id && x.status === "free")
    .sort((x, y) => Math.abs(x.floor - a.floor) - Math.abs(y.floor - a.floor))
    .slice(0, 4);
  const isFav = fav.includes(a.id), isCmp = cmp.includes(a.id);

  return (
    <article className="apt">
      <nav className="crumbs" aria-label="Навигация">
        <Link to="/kvartiry">Квартиры</Link>
        <span aria-hidden="true">/</span>
        <span>№ {a.number}</span>
      </nav>

      <div className="apt__top">
        <div className="apt__plan">
          <ApartmentPlan a={a} />
          <p className="apt__scale">Площади комнат в м². {a.side === "north" ? "Окна — на сопки, вверху плана." : "Окна к заливу — внизу плана."}</p>
        </div>
        <div className="apt__info">
          <h1 className="h1">{roomsLabel(a.rooms)}, {m2(a.area)}</h1>
          <p className={`apt__status apt__status--${a.status}`}>{statusLabel[a.status]}{a.status === "reserved" ? " — можно встать в лист ожидания" : ""}</p>
          {a.status !== "sold" ? (
            <p className="apt__price num">
              {mln(a.price)}
              <span>{rub(a.pricePerM2)} за м²</span>
            </p>
          ) : null}
          <dl className="spec">
            <div><dt>Этаж</dt><dd className="num">{a.floor} из 26</dd></div>
            <div><dt>Номер</dt><dd className="num">{a.number}</dd></div>
            <div><dt>Вид из окон</dt><dd>{a.views.join(", ")}</dd></div>
            <div><dt>Окна</dt><dd>{a.corner ? "на две стороны" : "на одну сторону"}</dd></div>
            {a.terrace ? <div><dt>Терраса</dt><dd className="num">{m2(a.terrace)}</dd></div> : null}
            <div><dt>Потолки</dt><dd className="num">3,15 м</dd></div>
          </dl>
          <div className="apt__acts">
            <a className="btn btn--primary" href="#apt-zapis" onClick={(e) => { e.preventDefault(); document.getElementById("apt-zapis")?.scrollIntoView({ behavior: "smooth" }); }}>
              Записаться на просмотр
            </a>
            <button type="button" className="btn btn--line" aria-pressed={isFav} onClick={() => toggle("fav", a.id)}>
              <Mark on={isFav} /> {isFav ? "Отмечена" : "Отметить"}
            </button>
            <button type="button" className="btn btn--line" aria-pressed={isCmp} onClick={() => toggle("cmp", a.id)}>
              <Scales /> {isCmp ? "В сравнении" : "Сравнить"}
            </button>
          </div>
          {isCmp && cmp.length > 1 ? <Link className="apt__cmp" to="/sravnenie">Открыть сравнение ({cmp.length}) <Arrow /></Link> : null}
        </div>
      </div>

      <section className="sec apt__view" aria-labelledby="view-title">
        <h2 id="view-title" className="h2">Вид из окна</h2>
        <CoastProfile a={a} />
      </section>

      <section className="sec apt__floor" aria-labelledby="floor-title">
        <h2 id="floor-title" className="h2">{a.floor} этаж</h2>
        <FloorPlan floor={a.floor} highlight={a.id} />
      </section>

      {a.status !== "sold" ? <Mortgage initialPrice={a.price} compact /> : null}

      {same.length ? (
        <section className="sec" aria-labelledby="same-title">
          <h2 id="same-title" className="h2">Такая же планировка на других этажах</h2>
          <table className="ledger">
            <tbody>
              {same.map((x) => (
                <tr key={x.id}>
                  <th scope="row"><Link to={`/kvartira/${x.id}`}>{x.floor} этаж</Link></th>
                  <td className="num">{m2(x.area)}</td>
                  <td className="num">{mln(x.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <ViewingForm aptId={a.id} id="apt-zapis" />
    </article>
  );
}

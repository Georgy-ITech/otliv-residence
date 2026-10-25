import { useEffect } from "react";
import { Link } from "react-router-dom";
import { byId, roomsLabel, statusLabel } from "../data/apartments";
import { m2, mln, rub } from "../lib/format";
import { clear, toggle, useList } from "../lib/store";
import ApartmentPlan from "../components/ApartmentPlan";
import { Close } from "../components/Icons";

export default function Compare() {
  const ids = useList("cmp");
  const list = ids.map((id) => byId.get(id)).filter((a) => a !== undefined);

  useEffect(() => {
    document.title = "Сравнение квартир — Отлив";
  }, []);

  if (list.length === 0) {
    return (
      <div className="compare">
        <h1 className="h1">Сравнение</h1>
        <div className="empty">
          <p className="h3">Пока сравнивать нечего</p>
          <p>Откройте квартиру и нажмите «Сравнить» — можно положить рядом до трёх.</p>
          <Link className="btn btn--primary" to="/kvartiry">К квартирам</Link>
        </div>
      </div>
    );
  }

  const rows: [string, (a: (typeof list)[number]) => string][] = [
    ["Цена", (a) => (a.status === "sold" ? statusLabel.sold : mln(a.price))],
    ["За м²", (a) => rub(a.pricePerM2)],
    ["Площадь", (a) => m2(a.area)],
    ["Этаж", (a) => String(a.floor)],
    ["Вид", (a) => a.views.join(", ")],
    ["Окна", (a) => (a.corner ? "на две стороны" : "на одну сторону")],
    ["Статус", (a) => statusLabel[a.status]],
  ];

  return (
    <div className="compare">
      <div className="sec__head">
        <h1 className="h1">Сравнение</h1>
        <button type="button" className="btn btn--line" onClick={() => clear("cmp")}>Очистить</button>
      </div>
      <div className="compare__scroll">
        <table className="ledger compare__table" style={{ "--cols": list.length } as React.CSSProperties}>
          <thead>
            <tr>
              <td />
              {list.map((a) => (
                <th key={a.id} scope="col">
                  <div className="compare__head">
                    <Link to={`/kvartira/${a.id}`}>{roomsLabel(a.rooms)} № {a.number}</Link>
                    <button type="button" className="icon-btn" onClick={() => toggle("cmp", a.id)} aria-label={`Убрать квартиру ${a.number} из сравнения`}><Close /></button>
                  </div>
                  <ApartmentPlan a={a} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, f]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                {list.map((a) => <td key={a.id} className="num">{f(a)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

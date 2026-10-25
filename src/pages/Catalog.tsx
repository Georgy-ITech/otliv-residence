import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { APARTMENTS, FLOORS, FIRST_LIVING_FLOOR, roomsLabel, roomsShort, statusLabel, type Apartment, type View } from "../data/apartments";
import { flats, m2, mln } from "../lib/format";
import { toggle, useList } from "../lib/store";
import { Grid, Mark, Rows } from "../components/Icons";

const ROOMS = [0, 1, 2, 3, 4];
const VIEWS: View[] = ["море", "сопки", "город"];
const SLOT_ORDER = ["E", "F", "G", "H", "D", "C", "B", "A"];
const SORTS = {
  price: { l: "Сначала дешевле", f: (a: Apartment, b: Apartment) => a.price - b.price },
  area: { l: "Сначала больше", f: (a: Apartment, b: Apartment) => b.area - a.area },
  floor: { l: "Сначала выше", f: (a: Apartment, b: Apartment) => b.floor - a.floor },
};
type SortKey = keyof typeof SORTS;

const nums = (s: string | null) => (s ? s.split(",").map(Number).filter((n) => !Number.isNaN(n)) : []);

export default function Catalog() {
  const [p, setP] = useSearchParams();
  const fav = useList("fav");
  const cmp = useList("cmp");

  const f = {
    rooms: nums(p.get("rooms")),
    max: Number(p.get("max")) || 0,
    minArea: Number(p.get("amin")) || 0,
    floorMin: Number(p.get("fmin")) || FIRST_LIVING_FLOOR,
    views: (p.get("views")?.split(",").filter(Boolean) ?? []) as View[],
    all: p.get("all") === "1",
    fav: p.get("fav") === "1",
    mode: (p.get("mode") === "grid" ? "grid" : "list") as "grid" | "list",
    sort: (p.get("sort") as SortKey) in SORTS ? (p.get("sort") as SortKey) : "price",
  };

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(p);
    if (v === null || v === "") n.delete(k); else n.set(k, v);
    setP(n, { replace: true });
  };
  const toggleIn = (k: string, list: (string | number)[], v: string | number) =>
    set(k, (list.includes(v as never) ? list.filter((x) => x !== v) : [...list, v]).join(",") || null);

  // В шахматке статус виден по самой ячейке, поэтому фильтр «только свободные» там не гасит бронь и проданные.
  const matchShape = (a: Apartment) =>
    (!f.rooms.length || f.rooms.includes(Math.min(a.rooms, 4))) &&
    (!f.max || a.price <= f.max * 1e6) &&
    a.area >= f.minArea &&
    a.floor >= f.floorMin &&
    (!f.views.length || f.views.some((v) => a.views.includes(v))) &&
    (!f.fav || fav.includes(a.id));
  const match = (a: Apartment) => (f.all || a.status === "free") && matchShape(a);

  const result = useMemo(() => APARTMENTS.filter(match).sort(SORTS[f.sort].f), [p, fav]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasFilters = [...p.keys()].some((k) => !["mode", "sort"].includes(k));

  useEffect(() => {
    document.title = "Квартиры — Отлив, Владивосток";
  }, []);

  return (
    <div className="catalog">
      <header className="catalog__head">
        <h1 className="h1">Квартиры</h1>
        <p className="catalog__count" aria-live="polite">
          {result.length ? `Нашлось: ${flats(result.length)}` : "Ничего не нашлось"}
        </p>
      </header>

      <aside className="filters" aria-label="Фильтры">
        <fieldset>
          <legend>Комнат</legend>
          <div className="chips">
            {ROOMS.map((r) => (
              <button key={r} type="button" className="chip" aria-pressed={f.rooms.includes(r)} onClick={() => toggleIn("rooms", f.rooms, r)}>
                {r === 0 ? "Ст" : r === 4 ? "4+" : r}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="filters__field">
          <span>Цена до, млн ₽</span>
          <select value={f.max || ""} onChange={(e) => set("max", e.target.value || null)}>
            <option value="">Любая</option>
            {[10, 12, 14, 16, 20, 25, 35].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="filters__field">
          <span>Площадь от, м²</span>
          <select value={f.minArea || ""} onChange={(e) => set("amin", e.target.value || null)}>
            <option value="">Любая</option>
            {[35, 45, 60, 80, 100].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="filters__field">
          <span>Этаж от</span>
          <select value={f.floorMin} onChange={(e) => set("fmin", e.target.value === String(FIRST_LIVING_FLOOR) ? null : e.target.value)}>
            {[2, 5, 10, 15, 20].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Вид из окон</legend>
          <div className="chips">
            {VIEWS.map((v) => (
              <button key={v} type="button" className="chip" aria-pressed={f.views.includes(v)} onClick={() => toggleIn("views", f.views, v)}>
                {v}
              </button>
            ))}
          </div>
        </fieldset>
        {f.mode === "list" ? <label className="check">
          <input type="checkbox" checked={f.all} onChange={(e) => set("all", e.target.checked ? "1" : null)} />
          <span>Показать проданные и бронь</span>
        </label> : null}
        <label className="check">
          <input type="checkbox" checked={f.fav} onChange={(e) => set("fav", e.target.checked ? "1" : null)} />
          <span>Только отмеченные <span className="num">({fav.length})</span></span>
        </label>
        {hasFilters ? (
          <button type="button" className="btn btn--line filters__reset" onClick={() => setP(new URLSearchParams(f.mode === "grid" ? { mode: "grid" } : {}), { replace: true })}>
            Сбросить фильтры
          </button>
        ) : null}
      </aside>

      <div className="catalog__main">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Вид каталога">
            <button type="button" aria-pressed={f.mode === "list"} onClick={() => set("mode", null)}><Rows /> Списком</button>
            <button type="button" aria-pressed={f.mode === "grid"} onClick={() => set("mode", "grid")}><Grid /> Шахматкой</button>
          </div>
          {f.mode === "list" ? (
            <label className="toolbar__sort">
              <span className="sr-only">Сортировка</span>
              <select value={f.sort} onChange={(e) => set("sort", e.target.value === "price" ? null : e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
              </select>
            </label>
          ) : null}
          {cmp.length ? <Link className="toolbar__cmp" to="/sravnenie">Сравнить <span className="num">{cmp.length}</span></Link> : null}
        </div>

        {result.length === 0 && f.mode === "list" ? (
          <div className="empty">
            <p className="h3">Под эти условия квартир нет</p>
            <p>Чаще всего мешает цена или этаж. Попробуйте поднять цену или включить проданные, чтобы увидеть, где такие квартиры были.</p>
            <button type="button" className="btn btn--primary" onClick={() => setP(new URLSearchParams(), { replace: true })}>Сбросить фильтры</button>
          </div>
        ) : f.mode === "list" ? (
          <table className="ledger ledger--apts">
            <thead>
              <tr>
                <th scope="col">Квартира</th>
                <th scope="col" className="num">Этаж</th>
                <th scope="col" className="num">Площадь</th>
                <th scope="col">Вид</th>
                <th scope="col" className="num">Цена</th>
                <th scope="col"><span className="sr-only">Действия</span></th>
              </tr>
            </thead>
            <tbody>
              {result.map((a) => (
                <tr key={a.id} className={`is-${a.status}`}>
                  <th scope="row">
                    <Link to={`/kvartira/${a.id}`}>{roomsLabel(a.rooms)} <span className="muted num">№ {a.number}</span></Link>
                  </th>
                  <td className="num">{a.floor}</td>
                  <td className="num">{m2(a.area)}</td>
                  <td>{a.views.join(", ")}</td>
                  <td className="num">{a.status === "free" ? mln(a.price) : <span className="muted">{statusLabel[a.status]}</span>}</td>
                  <td className="ledger__acts">
                    <button type="button" className="icon-btn" aria-pressed={fav.includes(a.id)} onClick={() => toggle("fav", a.id)} aria-label={fav.includes(a.id) ? "Снять отметку" : "Отметить квартиру"}>
                      <Mark on={fav.includes(a.id)} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Chess match={matchShape} />
        )}
      </div>
    </div>
  );
}

/** Шахматка: строки — этажи сверху вниз, столбцы — квартиры по кругу плиты. Неподходящие гаснут, но остаются. */
function Chess({ match }: { match: (a: Apartment) => boolean }) {
  const floors = Array.from({ length: FLOORS - FIRST_LIVING_FLOOR + 1 }, (_, i) => FLOORS - i);
  return (
    <div className="chess" role="table" aria-label="Шахматка квартир">
      <div className="chess__row chess__row--head" role="row">
        <span role="columnheader" className="chess__floor">Этаж</span>
        <span role="columnheader" className="chess__side">окна на сопки</span>
        <span role="columnheader" className="chess__side chess__side--sea">окна на залив</span>
      </div>
      {floors.map((fl) => {
        const row = APARTMENTS.filter((a) => a.floor === fl);
        const cells = fl === FLOORS ? row : SLOT_ORDER.map((s) => row.find((a) => a.slot === s)!);
        return (
          <div key={fl} className={`chess__row ${fl === FLOORS ? "chess__row--pent" : ""}`} role="row">
            <span className="chess__floor num" role="rowheader">{fl}</span>
            {cells.map((a) => {
              const on = match(a);
              const cls = `cell cell--${a.status} ${on ? "" : "is-dim"}`;
              const label = `${roomsLabel(a.rooms)}, ${m2(a.area)}, ${fl} этаж, ${a.status === "free" ? mln(a.price) : statusLabel[a.status].toLowerCase()}`;
              return a.status === "sold" ? (
                <span key={a.id} role="cell" className={cls} aria-label={label}>{roomsShort(a.rooms)}</span>
              ) : (
                <Link key={a.id} role="cell" to={`/kvartira/${a.id}`} className={cls} aria-label={label} tabIndex={on ? 0 : -1}>
                  {a.status === "free" ? <i className="light" aria-hidden="true" /> : null}
                  <b>{roomsShort(a.rooms)}</b>
                  <span className="num">{a.status === "free" ? (a.price / 1e6).toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "бронь"}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
      <ul className="legend" aria-label="Обозначения">
        <li><i className="legend__k legend__k--free"><i className="light" /></i>свободна, цена в млн ₽</li>
        <li><i className="legend__k legend__k--reserved" />бронь</li>
        <li><i className="legend__k legend__k--sold" />продана</li>
        <li><i className="legend__k legend__k--dim" />не подходит под фильтр</li>
      </ul>
    </div>
  );
}

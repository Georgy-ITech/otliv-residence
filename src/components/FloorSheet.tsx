import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { APARTMENTS, FLOORS, FIRST_LIVING_FLOOR, floorStats, roomsLabel } from "../data/apartments";
import { flats, m2, mln } from "../lib/format";
import FloorPlan from "./FloorPlan";
import { Arrow, Close } from "./Icons";

/** Лист этажа пристыкован к первому экрану, а не модалка: дом остаётся виден и кликабелен. */
export default function FloorSheet({ floor, onClose, onFloor }: { floor: number; onClose: () => void; onFloor: (f: number) => void }) {
  const ref = useRef<HTMLElement>(null);
  const s = floorStats(floor);
  const free = APARTMENTS.filter((a) => a.floor === floor && a.status === "free");

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [floor, onClose]);

  return (
    <aside ref={ref} className="sheet" tabIndex={-1} aria-labelledby="sheet-title">
      <header className="sheet__head">
        <div className="sheet__nav">
          <button type="button" className="icon-btn" onClick={() => onFloor(Math.max(FIRST_LIVING_FLOOR, floor - 1))} disabled={floor <= FIRST_LIVING_FLOOR} aria-label="Этаж ниже">
            <Arrow dir="down" />
          </button>
          <h2 id="sheet-title">{floor} этаж</h2>
          <button type="button" className="icon-btn" onClick={() => onFloor(Math.min(FLOORS, floor + 1))} disabled={floor >= FLOORS} aria-label="Этаж выше">
            <Arrow dir="up" />
          </button>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть план этажа">
          <Close />
        </button>
      </header>
      <p className="sheet__sum">
        {s.free ? <>{flats(s.free)} свободно из {s.total} · от {mln(s.minPrice!, 1)}</> : <>Свободных квартир нет — посмотрите соседние этажи</>}
      </p>
      <FloorPlan floor={floor} />
      <ul className="legend" aria-label="Обозначения">
        <li><i className="legend__k legend__k--free"><i className="light" /></i>свободна</li>
        <li><i className="legend__k legend__k--reserved" />бронь</li>
        <li><i className="legend__k legend__k--sold" />продана</li>
      </ul>
      {free.length ? (
        <ul className="sheet__list">
          {free.map((a) => (
            <li key={a.id}>
              <Link to={`/kvartira/${a.id}`}>
                <span>{roomsLabel(a.rooms)}</span>
                <span className="num">{m2(a.area)}</span>
                <span className="num">{mln(a.price, 1)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { APARTMENTS, FLOORS } from "../data/apartments";
import { FACTS } from "../data/site";
import { SITE as BAY_SITE } from "../chart/bay";
import { annuity, flats, mln, rub } from "../lib/format";
import ChartCanvas from "./ChartCanvas";
import { Arrow } from "./Icons";

/* ---------- Дом: условные обозначения вместо плиток с цифрами ---------- */
export function House() {
  return (
    <section className="sec house" aria-labelledby="house-title">
      <div className="house__text">
        <h2 id="house-title" className="h2">Башня на мысу, окнами в залив</h2>
        <p>
          Двадцать шесть этажей на каменистом мысу полуострова Басаргина. Южный фасад смотрит на Уссурийский залив,
          северный — на сопки. Квартиры с окнами на две стороны занимают углы, на последнем этаже — два пентхауса
          с террасами.
        </p>
        <p>
          Внизу — лобби с двойной высотой и терраса к воде, под домом — паркинг на 160 мест. До галечного пляжа
          три минуты по собственной лестнице с мыса.
        </p>
      </div>
      <dl className="legend-table">
        {FACTS.map((f) => (
          <div key={f.k}>
            <dt>{f.k}</dt>
            <dd className="num">{f.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- Квартиры по типам: таблица цен «от» ---------- */
export function Types() {
  const rows = useMemo(() => {
    const groups = [
      { k: 0, label: "Студии", q: "rooms=0" },
      { k: 1, label: "Однокомнатные", q: "rooms=1" },
      { k: 2, label: "Двухкомнатные", q: "rooms=2" },
      { k: 3, label: "Трёхкомнатные", q: "rooms=3" },
      { k: 4, label: "Пентхаусы", q: "rooms=4" },
    ];
    return groups.map((g) => {
      const all = APARTMENTS.filter((a) => a.rooms === g.k);
      const free = all.filter((a) => a.status === "free");
      const areas = all.map((a) => a.area);
      return { ...g, free: free.length, from: free.length ? Math.min(...free.map((a) => a.price)) : null, amin: Math.min(...areas), amax: Math.max(...areas) };
    });
  }, []);
  const totalFree = APARTMENTS.filter((a) => a.status === "free").length;
  return (
    <section className="sec types" aria-labelledby="types-title">
      <div className="sec__head">
        <h2 id="types-title" className="h2">{flats(totalFree)} в продаже</h2>
        <Link to="/kvartiry" className="btn btn--line">
          Все квартиры и шахматка <Arrow />
        </Link>
      </div>
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">Тип</th>
            <th scope="col" className="num">Площадь</th>
            <th scope="col" className="num">Свободно</th>
            <th scope="col" className="num">Цена от</th>
            <th scope="col"><span className="sr-only">Перейти</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <th scope="row">{r.label}</th>
              <td className="num">{r.amin === r.amax ? `${r.amin}` : `${r.amin}–${r.amax}`} м²</td>
              <td className="num">{r.free}</td>
              <td className="num">{r.from ? mln(r.from) : "—"}</td>
              <td>
                <Link to={`/kvartiry?${r.q}`} className="ledger__go" aria-label={`Показать: ${r.label.toLowerCase()}`}>
                  <Arrow />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ---------- Ипотека и рассрочка ---------- */
const HANDOVER = new Date(2028, 11, 1);
function monthsToHandover() {
  const now = new Date();
  return Math.max(6, (HANDOVER.getFullYear() - now.getFullYear()) * 12 + HANDOVER.getMonth() - now.getMonth());
}

export function Mortgage({ initialPrice = 12_800_000, compact = false }: { initialPrice?: number; compact?: boolean }) {
  const [mode, setMode] = useState<"credit" | "plan">("credit");
  const [price, setPrice] = useState(initialPrice);
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(18);
  const loan = price * (1 - down / 100);
  const pay = annuity(loan, rate, years);
  const months = monthsToHandover();
  const planDown = Math.max(30, down);
  const planPay = (price * (1 - planDown / 100)) / months;

  return (
    <section id={compact ? undefined : "ipoteka"} className={`sec calc ${compact ? "calc--compact" : ""}`} aria-labelledby="calc-title">
      <div className="calc__head">
        <h2 id="calc-title" className={compact ? "h3" : "h2"}>Ипотека или рассрочка</h2>
        <div className="seg" role="tablist" aria-label="Способ оплаты">
          <button role="tab" aria-selected={mode === "credit"} onClick={() => setMode("credit")} type="button">Ипотека</button>
          <button role="tab" aria-selected={mode === "plan"} onClick={() => setMode("plan")} type="button">Рассрочка</button>
        </div>
      </div>
      <div className="calc__body">
        <div className="calc__inputs">
          <Slider label="Стоимость квартиры" value={price} min={7_000_000} max={75_000_000} step={100_000} onChange={setPrice} format={(v) => mln(v)} />
          <Slider label="Первый взнос" value={mode === "plan" ? planDown : down} min={mode === "plan" ? 30 : 15} max={90} step={1} onChange={setDown} format={(v) => `${v} % · ${mln((price * v) / 100)}`} />
          {mode === "credit" ? (
            <>
              <Slider label="Срок" value={years} min={5} max={30} step={1} onChange={setYears} format={(v) => `${v} лет`} />
              <Slider label="Ставка банка" value={rate} min={2} max={28} step={0.5} onChange={setRate} format={(v) => `${v.toLocaleString("ru-RU")} %`} />
            </>
          ) : null}
        </div>
        <output className="calc__out" aria-live="polite">
          <span className="calc__k">{mode === "credit" ? "Платёж в месяц" : `Платёж в месяц, ${months} мес. до сдачи`}</span>
          <span className="calc__v num">{rub(mode === "credit" ? pay : planPay)}</span>
          <dl className="calc__rows">
            {mode === "credit" ? (
              <>
                <div><dt>Кредит</dt><dd className="num">{rub(loan)}</dd></div>
                <div><dt>Переплата за срок</dt><dd className="num">{rub(pay * years * 12 - loan)}</dd></div>
              </>
            ) : (
              <>
                <div><dt>Взнос сейчас</dt><dd className="num">{rub((price * planDown) / 100)}</dd></div>
                <div><dt>Без процентов</dt><dd>до IV квартала 2028</dd></div>
              </>
            )}
          </dl>
          <p className="calc__note">
            {mode === "credit" ? "Укажите ставку своего банка — расчёт пересчитается. Это ориентир, не оферта." : "Условия рассрочки — для демонстрации расчёта."}
          </p>
        </output>
      </div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="slider">
      <span className="slider__row">
        <span>{label}</span>
        <span className="num slider__val">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ "--p": `${pct}%` } as React.CSSProperties} />
    </label>
  );
}

/* ---------- Район: курсы от дома, как прокладка на карте ---------- */
const PLACES = [
  { name: "Галечный пляж", min: 3, how: "пешком", x: 1117, y: 516 },
  { name: "Остановка автобуса", min: 4, how: "пешком", x: 900, y: 330 },
  { name: "Детский сад", min: 6, how: "пешком", x: 700, y: 250 },
  { name: "Набережная и сквер", min: 7, how: "пешком", x: 1373, y: 204 },
  { name: "Школа", min: 9, how: "пешком", x: 560, y: 160 },
  { name: "Центр города", min: 25, how: "на машине", x: 430, y: 40 },
];

export function District() {
  const [hot, setHot] = useState<number | null>(null);
  const view = useMemo(() => ({ x: 380, y: 0, w: 1100, h: 720 }), []);
  const overlay = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      PLACES.forEach((p, i) => {
        const on = hot === null || hot === i;
        ctx.save();
        ctx.globalAlpha = on ? 1 : 0.25;
        ctx.strokeStyle = "#a1267f";
        ctx.fillStyle = "#a1267f";
        ctx.lineWidth = hot === i ? 3 : 2;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(BAY_SITE.x, BAY_SITE.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        const mx = (BAY_SITE.x + p.x) / 2, my = (BAY_SITE.y + p.y) / 2;
        ctx.font = "italic 600 22px Alegreya, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fbfbf8";
        ctx.fillRect(mx - 34, my - 15, 68, 28);
        ctx.fillStyle = "#a1267f";
        ctx.fillText(`${p.min} мин`, mx, my + 7);
        ctx.restore();
      });
      // Дом — знак ориентира: кружок с точкой, как маяк на карте.
      ctx.save();
      ctx.fillStyle = "#16191c";
      ctx.beginPath();
      ctx.arc(BAY_SITE.x, BAY_SITE.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbfbf8";
      ctx.beginPath();
      ctx.arc(BAY_SITE.x, BAY_SITE.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    [hot],
  );
  return (
    <section id="rayon" className="sec district" aria-labelledby="district-title">
      <div className="district__map">
        <ChartCanvas view={view} overlay={overlay} opts={{ soundings: true }} label="Карта района: дом на мысу и маршруты до пляжа, школы, детского сада, набережной и остановки" />
      </div>
      <div className="district__text">
        <h2 id="district-title" className="h2">Всё нужное — в пределах прогулки</h2>
        <ol className="courses">
          {PLACES.map((p, i) => (
            <li key={p.name}>
              <button type="button" onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)}>
                <span>{p.name}</span>
                <span className="num">{p.min} мин {p.how}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="muted">Время в пути — оценка по прямой и пешеходным дорожкам.</p>
      </div>
    </section>
  );
}

/* ---------- Ход строительства: вахтенный журнал и разрез с готовыми этажами ---------- */
const LOG = [
  { d: "18 марта 2026", t: "Шпунтовое ограждение и котлован", f: 0 },
  { d: "29 мая 2026", t: "Фундаментная плита залита за трое суток", f: 0 },
  { d: "14 июля 2026", t: "Стилобат, паркинг и лобби", f: 1 },
  { d: "2 сентября 2026", t: "Монолит до шестого этажа", f: 6 },
  { d: "16 октября 2026", t: "Девятый этаж, начат фасад к заливу", f: 9 },
];
export function Journal() {
  const done = LOG[LOG.length - 1].f;
  return (
    <section id="stroyka" className="sec journal" aria-labelledby="journal-title">
      <div className="journal__text">
        <h2 id="journal-title" className="h2">Ход строительства</h2>
        <table className="ledger ledger--log">
          <thead>
            <tr><th scope="col">Дата</th><th scope="col">Работы</th><th scope="col" className="num">Этаж</th></tr>
          </thead>
          <tbody>
            {[...LOG].reverse().map((l) => (
              <tr key={l.d}>
                <td className="num">{l.d}</td>
                <td>{l.t}</td>
                <td className="num">{l.f || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <svg className="elevation" viewBox="-80 0 300 520" role="img" aria-label={`Возведено ${done} этажей из ${FLOORS}`}>
        {Array.from({ length: FLOORS }, (_, i) => {
          const f = i + 1;
          const y = 500 - f * 18;
          return <rect key={f} x={f === FLOORS ? 46 : 30} y={y} width={f === FLOORS ? 128 : 160} height={16} className={f <= done ? "el--done" : "el--plan"} />;
        })}
        <line x1="0" y1="502" x2="220" y2="502" className="el--ground" />
        <line x1="0" y1={500 - done * 18 - 1} x2="26" y2={500 - done * 18 - 1} className="el--tick" />
        <text x="0" y={500 - done * 18 - 10} className="el--mark">{done} из {FLOORS}</text>
      </svg>
    </section>
  );
}

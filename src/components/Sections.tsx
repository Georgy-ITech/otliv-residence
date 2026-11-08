import { useEffect, useRef, useState } from "react";
import { annuity, mln, rub } from "../lib/format";
import { ScrollTrigger, reducedMotion } from "../lib/motion";

/* ---------- Ипотека и рассрочка: барабанные цифры и кривая долга-отлива ---------- */
const HANDOVER = new Date(2028, 11, 1);
function monthsToHandover() {
  const now = new Date();
  return Math.max(6, (HANDOVER.getFullYear() - now.getFullYear()) * 12 + HANDOVER.getMonth() - now.getMonth());
}

/** Число как барабан: каждая цифра — колонка 0–9, которая прокручивается к нужной. */
export function Roll({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`roll ${className}`} role="img" aria-label={text}>
      {[...text].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={`${text.length - i}`} className="roll__col" aria-hidden="true">
            <span className="roll__strip" style={{ "--d": Number(ch) } as React.CSSProperties}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : (
          <span key={`${text.length - i}`} className="roll__ch" aria-hidden="true">{ch}</span>
        ),
      )}
    </span>
  );
}

export function Mortgage({ initialPrice = 12_800_000, compact = false }: { initialPrice?: number; compact?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"credit" | "plan">("credit");
  const [price, setPrice] = useState(initialPrice);
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(18);
  const [drawn, setDrawn] = useState(false);
  const loan = price * (1 - down / 100);
  const pay = annuity(loan, rate, years);
  const months = monthsToHandover();
  const planDown = Math.max(30, down);
  const planPay = (price * (1 - planDown / 100)) / months;
  const over = pay * years * 12 - loan;
  const firstPay = (price * down) / 100;
  const total = firstPay + pay * years * 12;
  const share = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  // График прорисовывается, когда секция входит в экран.
  useEffect(() => {
    if (!root.current || reducedMotion()) { setDrawn(true); return; }
    const st = ScrollTrigger.create({ trigger: root.current, start: "top 70%", once: true, onEnter: () => setDrawn(true) });
    return () => st.kill();
  }, []);

  const monthly = Math.round(mode === "credit" ? pay : planPay);

  return (
    <section ref={root} id={compact ? undefined : "ipoteka"} className={`mort ${compact ? "mort--compact" : ""} ${drawn ? "is-drawn" : ""}`} aria-labelledby="calc-title">
      <div className="mort__head">
        <h2 id="calc-title" className={compact ? "h3" : "mort__title"}>Сколько платить в месяц</h2>
        <div className="mort__tabs" role="tablist" aria-label="Способ оплаты">
          <button role="tab" aria-selected={mode === "credit"} onClick={() => setMode("credit")} type="button">Ипотека</button>
          <button role="tab" aria-selected={mode === "plan"} onClick={() => setMode("plan")} type="button">Рассрочка до сдачи</button>
          <span className="mort__tabline" style={{ "--x": mode === "credit" ? 0 : 1 } as React.CSSProperties} aria-hidden="true" />
        </div>
      </div>

      <div className="mort__body">
        <div className="mort__inputs">
          <Slider label="Стоимость квартиры" value={price} min={7_000_000} max={75_000_000} step={100_000} onChange={setPrice} format={(v) => mln(v)} />
          <Slider label="Первый взнос" value={mode === "plan" ? planDown : down} min={mode === "plan" ? 30 : 15} max={90} step={1} onChange={setDown} format={(v) => `${v} % · ${mln((price * v) / 100)}`} />
          {mode === "credit" ? (
            <>
              <Slider label="Срок" value={years} min={5} max={30} step={1} onChange={setYears} format={(v) => `${v} лет`} />
              <Slider label="Ставка банка" value={rate} min={2} max={28} step={0.5} onChange={setRate} format={(v) => `${v.toLocaleString("ru-RU")} %`} />
            </>
          ) : null}
        </div>

        <output className="mort__out" aria-live="polite">
          <span className="mort__k">{mode === "credit" ? "Платёж в месяц" : `В месяц, ${months} платежей до сдачи`}</span>
          <span className="mort__v num"><Roll text={new Intl.NumberFormat("ru-RU").format(monthly)} /><small> ₽</small></span>

          {mode === "credit" ? (
            <div className="mort__split">
              <p className="mort__split-h">Сколько вы отдадите за квартиру в итоге</p>
              <div className="mort__bar" aria-hidden="true">
                <span className="mort__seg mort__seg--down" style={{ "--w": share(firstPay) } as React.CSSProperties} />
                <span className="mort__seg mort__seg--loan" style={{ "--w": share(loan) } as React.CSSProperties} />
                <span className="mort__seg mort__seg--over" style={{ "--w": share(over) } as React.CSSProperties} />
              </div>
              <dl className="mort__rows">
                <div><dt><i className="mort__sw mort__sw--down" />Первый взнос, сейчас</dt><dd className="num">{rub(firstPay)}</dd></div>
                <div><dt><i className="mort__sw mort__sw--loan" />Кредит банка, вернёте за {years} лет</dt><dd className="num">{rub(loan)}</dd></div>
                <div><dt><i className="mort__sw mort__sw--over" />Проценты банку сверху</dt><dd className="num">{rub(over)}</dd></div>
                <div className="mort__total"><dt>Итого</dt><dd className="num">{rub(total)}</dd></div>
              </dl>
              <p className="mort__income">Банки обычно одобряют, если платёж не больше половины дохода: нужен доход от <b className="num">{rub(pay * 2)}</b> в месяц.</p>
            </div>
          ) : (
            <div className="mort__plan">
              <div className="mort__bars" aria-hidden="true">
                {Array.from({ length: months }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
              </div>
              <p>Взнос сейчас <b className="num">{rub((price * planDown) / 100)}</b>, остальное равными частями без процентов до IV квартала 2028.</p>
            </div>
          )}
          <p className="mort__note">{mode === "credit" ? "Ориентир, не оферта: поставьте ставку своего банка." : "Условия рассрочки — для демонстрации расчёта."}</p>
        </output>
      </div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="wslider">
      <span className="wslider__row">
        <span>{label}</span>
        <span className="num wslider__val">{format(value)}</span>
      </span>
      <span className="wslider__track" style={{ "--pn": pct / 100 } as React.CSSProperties}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </span>
    </label>
  );
}

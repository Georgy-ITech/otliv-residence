import { useMemo, useState } from "react";
import { byId, roomsLabel } from "../data/apartments";
import { SITE } from "../data/site";
import { m2 } from "../lib/format";

type Errors = Partial<Record<"name" | "phone", string>>;

function maskPhone(v: string) {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = "+7";
  if (p[0]) out += ` ${p[0]}`;
  if (p[1]) out += ` ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  return out;
}

const FORMATS = [
  { v: "showroom", t: "Шоурум", d: "Отделка в натуральную величину и макет дома", icon: "M4 20V9l8-5 8 5v11M9 20v-6h6v6M2 20h20" },
  { v: "site", t: "На площадке", d: "Подъём на смотровую на высоте вашего этажа", icon: "M6 21V5h9v16M15 9h4v12M6 9h9M6 13h9M6 17h9M2 21h20M17 3l3 2" },
  { v: "online", t: "Онлайн", d: "Видеозвонок из шоурума, 30 минут", icon: "M3 6h12v12H3zM15 10l6-3v10l-6-3" },
];
const TIMES = ["10:00", "12:00", "14:00", "16:00", "18:00"];
const STEPS = ["Формат", "Дата", "Контакты"];

function nextDays(n: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 1; out.length < n; i++) out.push(new Date(d.getTime() + i * 864e5));
  return out;
}
const wd = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
const dm = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export default function ViewingForm({ aptId, id = "zapis" }: { aptId?: string; id?: string }) {
  const apt = aptId ? byId.get(aptId) : undefined;
  const days = useMemo(() => nextDays(8), []);
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<string | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const fmt = FORMATS.find((f) => f.v === format);
  const canNext = step === 0 ? !!format : step === 1 ? day !== null && !!time : true;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) { if (canNext) setStep(step + 1); return; }
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Напишите, как к вам обращаться";
    if (phone.replace(/\D/g, "").length !== 11) next.phone = "Нужен номер из 10 цифр после +7";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(next.name ? `${id}-name` : `${id}-phone`)?.focus();
      return;
    }
    setState("sending");
    setTimeout(() => setState("done"), 900);
  };

  const reset = () => { setState("idle"); setStep(0); setFormat(null); setDay(null); setTime(null); setName(""); setPhone(""); };

  return (
    <section id={id} className="book" aria-labelledby={`${id}-title`}>
      <div className="book__text">
        <h2 id={`${id}-title`} className="book__title">Приезжайте посмотреть</h2>
        <p>Покажем отделку, макет дома и вид с площадки на уровне вашего этажа. Встреча занимает около часа.</p>
        <a className="book__phone num" href={SITE.phoneHref}>{SITE.phone}</a>
        <p className="book__hours">{SITE.hours}</p>
      </div>

      <div className={`book__card ${state === "done" ? "is-done" : ""} ${state === "sending" ? "is-sending" : ""}`}>
        <div className="book__wave" aria-hidden="true">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 20 C50 0 100 40 150 20 S250 0 300 20 S380 40 400 20 V40 H0Z" /></svg>
        </div>

        {state === "done" ? (
          <div className="book__done" role="status">
            <svg className="book__check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
            <p className="book__done-t">Ждём вас, {name.trim().split(" ")[0]}</p>
            <dl className="book__sum">
              <div><dt>Формат</dt><dd>{fmt?.t}</dd></div>
              <div><dt>Когда</dt><dd>{day !== null ? `${dm.format(days[day])}, ${time}` : ""}</dd></div>
              <div><dt>Телефон</dt><dd className="num">{phone}</dd></div>
            </dl>
            <p className="book__done-d">Менеджер перезвонит в течение 15 минут и подтвердит время.</p>
            <button type="button" className="book__again" onClick={reset}>Новая заявка</button>
          </div>
        ) : (
          <form className="book__form" onSubmit={submit} noValidate>
            <ol className="book__steps" aria-label="Шаги">
              {STEPS.map((s, i) => (
                <li key={s} className={i === step ? "is-on" : i < step ? "is-past" : ""} aria-current={i === step ? "step" : undefined}>
                  <button type="button" disabled={i > step} onClick={() => setStep(i)}><span className="num">{i + 1}</span>{s}</button>
                </li>
              ))}
              <span className="book__progress" style={{ "--s": step } as React.CSSProperties} aria-hidden="true" />
            </ol>
            {apt ? <p className="book__apt">Квартира {apt.number}: {roomsLabel(apt.rooms).toLowerCase()}, {m2(apt.area)}, {apt.floor} этаж</p> : null}

            <div className="book__pane" key={step}>
              {step === 0 ? (
                <fieldset className="book__formats">
                  <legend className="sr-only">Формат просмотра</legend>
                  {FORMATS.map((f) => (
                    <label key={f.v} className={`fmt ${format === f.v ? "is-on" : ""}`}>
                      <input type="radio" name={`${id}-fmt`} value={f.v} checked={format === f.v} onChange={() => setFormat(f.v)} />
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={f.icon} /></svg>
                      <b>{f.t}</b>
                      <span>{f.d}</span>
                    </label>
                  ))}
                </fieldset>
              ) : step === 1 ? (
                <div className="book__when">
                  <fieldset className="book__days">
                    <legend>День</legend>
                    {days.map((d, i) => (
                      <label key={i} className={`dayc ${day === i ? "is-on" : ""}`}>
                        <input type="radio" name={`${id}-day`} checked={day === i} onChange={() => setDay(i)} />
                        <span>{wd.format(d)}</span>
                        <b className="num">{d.getDate()}</b>
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="book__times">
                    <legend>Время</legend>
                    {TIMES.map((t) => (
                      <label key={t} className={`timec ${time === t ? "is-on" : ""}`}>
                        <input type="radio" name={`${id}-time`} checked={time === t} onChange={() => setTime(t)} />
                        <span className="num">{t}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              ) : (
                <div className="book__fields">
                  <div className={`wfield ${errors.name ? "is-error" : ""} ${name ? "is-filled" : ""}`}>
                    <input id={`${id}-name`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-err` : undefined} placeholder=" " />
                    <label htmlFor={`${id}-name`}>Имя</label>
                    <svg className="wfield__line" viewBox="0 0 300 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4 Q7.5 0 15 4 T30 4 T45 4 T60 4 T75 4 T90 4 T105 4 T120 4 T135 4 T150 4 T165 4 T180 4 T195 4 T210 4 T225 4 T240 4 T255 4 T270 4 T285 4 T300 4" /></svg>
                    {errors.name ? <p className="wfield__err" id={`${id}-name-err`}>{errors.name}</p> : null}
                  </div>
                  <div className={`wfield ${errors.phone ? "is-error" : ""} ${phone ? "is-filled" : ""}`}>
                    <input id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${id}-phone-err` : undefined} placeholder=" " />
                    <label htmlFor={`${id}-phone`}>Телефон</label>
                    <svg className="wfield__line" viewBox="0 0 300 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4 Q7.5 0 15 4 T30 4 T45 4 T60 4 T75 4 T90 4 T105 4 T120 4 T135 4 T150 4 T165 4 T180 4 T195 4 T210 4 T225 4 T240 4 T255 4 T270 4 T285 4 T300 4" /></svg>
                    {errors.phone ? <p className="wfield__err" id={`${id}-phone-err`}>{errors.phone}</p> : null}
                  </div>
                  <p className="book__recap">{fmt?.t} · {day !== null ? `${dm.format(days[day])}, ${time}` : ""}</p>
                </div>
              )}
            </div>

            <div className="book__nav">
              {step > 0 ? <button type="button" className="book__back" onClick={() => setStep(step - 1)}>Назад</button> : <span />}
              <button className="book__next" type="submit" disabled={!canNext || state === "sending"}>
                <span>{state === "sending" ? "Отправляем…" : step < 2 ? "Дальше" : "Записаться"}</span>
                <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6c5-6 9-6 14 0s9 6 14 0M30 1l6 5-6 5" /></svg>
              </button>
            </div>
            <p className="book__demo">Демонстрационная форма — данные никуда не отправляются.</p>
          </form>
        )}
      </div>
    </section>
  );
}

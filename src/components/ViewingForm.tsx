import { useState } from "react";
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

export default function ViewingForm({ aptId, id = "zapis" }: { aptId?: string; id?: string }) {
  const apt = aptId ? byId.get(aptId) : undefined;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState("Будни, днём");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Напишите, как к вам обращаться";
    if (phone.replace(/\D/g, "").length !== 11) next.phone = "Нужен номер из 10 цифр после +7";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(next.name ? `${id}-name` : `${id}-phone`)?.focus();
      return;
    }
    setState("sending");
    setTimeout(() => setState("done"), 700);
  };

  return (
    <section id={id} className="sec viewing" aria-labelledby={`${id}-title`}>
      <div className="viewing__text">
        <h2 id={`${id}-title`} className="h2">Записаться на просмотр</h2>
        <p>Покажем шоурум с отделкой, макет дома и вид с площадки на уровне вашего этажа. Встреча занимает около часа.</p>
        <p className="viewing__contact">
          <a className="num" href={SITE.phoneHref}>{SITE.phone}</a>
          <span>{SITE.hours}</span>
          <span>{SITE.address}</span>
        </p>
      </div>
      {state === "done" ? (
        <div className="viewing__done" role="status">
          <p className="h3">Записали, {name.trim().split(" ")[0]}</p>
          <p>Менеджер перезвонит в течение 15 минут и подтвердит время просмотра.</p>
          <button type="button" className="btn btn--line" onClick={() => { setState("idle"); setName(""); setPhone(""); }}>Новая заявка</button>
        </div>
      ) : (
        <form className="viewing__form" onSubmit={submit} noValidate>
          {apt ? (
            <p className="viewing__apt">
              Квартира {apt.number}: {roomsLabel(apt.rooms).toLowerCase()}, {m2(apt.area)}, {apt.floor} этаж
            </p>
          ) : null}
          <div className={`field ${errors.name ? "is-error" : ""}`}>
            <label htmlFor={`${id}-name`}>Имя</label>
            <input id={`${id}-name`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-err` : undefined} />
            {errors.name ? <p className="field__err" id={`${id}-name-err`}>{errors.name}</p> : null}
          </div>
          <div className={`field ${errors.phone ? "is-error" : ""}`}>
            <label htmlFor={`${id}-phone`}>Телефон</label>
            <input id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 000-00-00" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${id}-phone-err` : undefined} />
            {errors.phone ? <p className="field__err" id={`${id}-phone-err`}>{errors.phone}</p> : null}
          </div>
          <fieldset className="field">
            <legend>Когда удобно</legend>
            <div className="chips">
              {["Будни, днём", "Будни, вечером", "Выходные"].map((w) => (
                <button key={w} type="button" className="chip" aria-pressed={when === w} onClick={() => setWhen(w)}>{w}</button>
              ))}
            </div>
          </fieldset>
          <button className="btn btn--primary" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Отправляем…" : "Записаться"}
          </button>
          <p className="viewing__demo">Демонстрационная форма — данные никуда не отправляются.</p>
        </form>
      )}
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { FLOORS } from "../../data/apartments";
import { ScrollTrigger, reducedMotion } from "../../lib/motion";

const BASE = import.meta.env.BASE_URL;

const LOG = [
  { d: "Март 2026", t: "Шпунт и котлован", f: 0.2 },
  { d: "Май 2026", t: "Фундаментная плита за трое суток", f: 0.6 },
  { d: "Июль 2026", t: "Стилобат, паркинг и лобби", f: 1 },
  { d: "Сентябрь 2026", t: "Монолит до десятого этажа", f: 10 },
  { d: "Октябрь 2026", t: "Пятнадцатый этаж, начат фасад к заливу", f: 15 },
];
const DONE = 15;
const START = new Date(2026, 2, 1).getTime();
const END = new Date(2028, 11, 1).getTime();
const TIME_PCT = Math.round(((Date.now() - START) / (END - START)) * 100);

/* Геометрия снята с фотографии дома: низ первого этажа и шаг этажа в координатах слоя 603×1500. */
const TW = 603, TH = 1500, BASE_Y = 1479, STEP = 51.5;
const MAST_X = 700, SEG = 34;

/** Решётка: две стойки и раскосы, как у настоящей секции крана. */
function lattice(x0: number, y0: number, w: number, n: number, seg: number, vertical: boolean) {
  let d = "";
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const y = y0 + i * seg;
      d += `M${x0} ${y}L${x0 + w} ${y + seg}M${x0 + w} ${y}L${x0} ${y + seg}M${x0} ${y}H${x0 + w}`;
    } else {
      const x = x0 + i * seg;
      d += `M${x} ${y0}L${x + seg / 2} ${y0 + w}L${x + seg} ${y0}`;
    }
  }
  return d;
}

const MAST = lattice(-11, 0, 22, 60, SEG, true);
const JIB = lattice(-500, -22, 22, 15, 34, false);

export default function Build() {
  const root = useRef<HTMLElement>(null);
  const [lvl, setLvl] = useState(0);
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    if (!root.current) return;
    if (reducedMotion()) { setLvl(DONE); return; }
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (s) => {
        setLvl(Math.min(1, s.progress / 0.85) * DONE);
        setTurn(s.progress);
      },
    });
    return () => st.kill();
  }, []);

  const shown = Math.floor(lvl);
  const top = BASE_Y - lvl * STEP;
  const facade = BASE_Y - Math.max(0, lvl - 8) * 0.75 * STEP;
  const jibY = Math.min(top, BASE_Y - STEP * 2) - 230;
  // Поворот стрелы в профиль виден как сжатие: стрела ходит над домом, не заходя за мачту.
  const slew = 0.72 + 0.28 * Math.cos(turn * Math.PI * 5);
  const hook = 90 + Math.max(0, top - jibY - 150) * (0.5 + 0.5 * Math.sin(turn * Math.PI * 9));
  const cur = LOG.reduce((a, l, i) => (lvl >= l.f ? i : a), 0);
  const trolley = -130 - 170 * (0.5 + 0.5 * Math.sin(turn * Math.PI * 4));

  return (
    <section id="stroyka" className="build" ref={root} aria-labelledby="build-title">
      <div className="build__stage">
        <img className="build__sky" src={`${BASE}img/build-dusk.webp`} alt="" loading="lazy" />
        <span className="build__scrim" aria-hidden="true" />

        <svg className="build__tower" viewBox="-40 -240 1040 1740" preserveAspectRatio="xMaxYMax meet" role="img" aria-label={`Возведено ${DONE} этажей из ${FLOORS}`}>
          <defs>
            <clipPath id="bt-plan"><rect x="-10" y="0" width={TW + 20} height={Math.max(0, top + 2)} /></clipPath>
            <clipPath id="bt-con"><rect x="-10" y={top} width={TW + 20} height={TH - top} /></clipPath>
            <clipPath id="bt-fac"><rect x="-10" y={facade} width={TW + 20} height={TH - facade} /></clipPath>
            <pattern id="bt-net" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H9M0 0V9" /></pattern>
          </defs>

          <image href={`${BASE}img/tower-plan.webp`} width={TW} height={TH} clipPath="url(#bt-plan)" className="bt__plan" />
          <image href={`${BASE}img/tower-concrete.webp`} width={TW} height={TH} clipPath="url(#bt-con)" />
          <image href={`${BASE}img/tower-facade.webp`} width={TW} height={TH} clipPath="url(#bt-fac)" />

          {/* Фронт работ: леса с сеткой, опалубка, выпуски арматуры и прожекторы. */}
          {lvl > 0.6 && (
            <g className="bt__front">
              <rect x="14" y={top - 8} width={TW - 28} height={STEP * 1.5} className="bt__scaffold" />
              <rect x="14" y={top - 8} width={TW - 28} height={STEP * 1.5} fill="url(#bt-net)" className="bt__netfill" />
              {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${20 + i * 47} ${top + STEP * 1.5}V${top - 26}`} className="bt__pole" />)}
              <path d={`M14 ${top - 8}H${TW - 14}M14 ${top + STEP * 0.7}H${TW - 14}`} className="bt__pole" />
              {Array.from({ length: 34 }, (_, i) => <path key={i} d={`M${30 + i * 16.5} ${top - 8}v${-14 - (i % 3) * 4}`} className="bt__rebar" />)}
              {[90, 300, 500].map((x) => <circle key={x} cx={x} cy={top - 18} r="5" className="bt__lamp" />)}
            </g>
          )}

          {/* Кран: мачта наращивается вместе с домом, стрела и грузовая тележка ходят по прокрутке. */}
          <g transform={`translate(${MAST_X} ${jibY})`} className="bt__crane">
            <path d={MAST} className="bt__lat" />
            <path d="M-11 0V2040M11 0V2040" className="bt__chord" />
            <g transform={`scale(${slew.toFixed(3)} 1)`}>
              <path d={JIB} className="bt__lat" />
              <path d="M-500 -22H0M-483 0H150" className="bt__chord" />
              <path d="M0 -92L-330 -22M0 -92L150 -18M0 -92V0M-11 0L0 -92L11 0" className="bt__tie" />
              <rect x="88" y="-8" width="62" height="34" className="bt__weight" />
              <rect x="-30" y="0" width="22" height="24" className="bt__cab" />
              <g transform={`translate(${trolley.toFixed(1)} 0)`}>
                <rect x="-11" y="-2" width="22" height="7" className="bt__weight" />
                <path d={`M-3 4V${hook.toFixed(0)}M3 4V${hook.toFixed(0)}`} className="bt__tie" />
                <path d={`M-30 ${hook.toFixed(0)}L0 ${(hook - 24).toFixed(0)}L30 ${hook.toFixed(0)}`} className="bt__tie" />
                <rect x="-34" y={hook} width="68" height="13" className="bt__weight" />
              </g>
            </g>
            <circle cy="-92" r="3.5" className="bt__beacon" />
          </g>
        </svg>


        {/* Берег под домом — кроны с того же снимка, что и сам дом, приглушённые до вечера. */}
        <img className="build__shore" src={`${BASE}img/build-shore.webp`} srcSet={`${BASE}img/build-shore-1600.webp 1600w, ${BASE}img/build-shore.webp 3200w`} sizes="max(100vw, 130svh)" alt="" loading="lazy" />

        <div className="build__text">
          <h2 id="build-title" className="h2">Дом растёт</h2>
          <p className="build__big"><span className="num">{shown}</span><small>/{FLOORS}</small></p>
          <p className="build__sub">этажей монолита на октябрь 2026</p>
          <ol className="build__log">
            {LOG.map((l, i) => (
              <li key={l.d} className={`${lvl >= l.f ? "is-on" : ""} ${i === cur ? "is-cur" : ""}`}>
                <span className="num">{l.d}</span>
                <b>{l.t}</b>
              </li>
            ))}
          </ol>
          <div className="build__bar" role="img" aria-label={`Пройдено ${TIME_PCT} % срока до сдачи`}>
            <span style={{ width: `${TIME_PCT}%` }} />
            <em>{TIME_PCT} % пути до сдачи · IV квартал 2028</em>
          </div>
        </div>
      </div>
    </section>
  );
}

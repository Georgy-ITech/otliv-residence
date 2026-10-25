import { APARTMENTS, CORE, CORRIDOR, PLATE, roomsShort, statusLabel, roomsLabel } from "../data/apartments";
import { m2, mln } from "../lib/format";

const PAD = 46;

/** План этажа: квартиры со статусами, окна по наружным стенам, залив — снизу. */
export default function FloorPlan({ floor, highlight }: { floor: number; highlight?: string }) {
  const list = APARTMENTS.filter((a) => a.floor === floor);
  const vb = `${-PAD} ${-PAD} ${PLATE.w + PAD * 2} ${PLATE.h + PAD * 2 + 30}`;
  return (
    <svg className="plan" viewBox={vb} role="group" aria-label={`План ${floor} этажа`}>
      <defs>
        <pattern id="hatch-sold" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" strokeWidth="1.2" opacity="0.28" />
        </pattern>
        <pattern id="hatch-core" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      <rect className="plan__corridor" x={CORRIDOR.x} y={CORRIDOR.y} width={CORRIDOR.w} height={CORRIDOR.h} />
      {floor < 26 ? <rect className="plan__core" x={CORE.x} y={CORE.y} width={CORE.w} height={CORE.h} fill="url(#hatch-core)" /> : null}
      {floor < 26 ? <text className="plan__note" x={CORE.x + CORE.w / 2} y={CORE.h / 2} textAnchor="middle">лифты</text> : null}

      {list.map((a) => {
        const { x, y, w, h } = a.plan;
        const cls = `plan__apt plan__apt--${a.status} ${highlight === a.id ? "is-current" : ""}`;
        const body = (
          <>
            <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx="1" />
            {a.status === "sold" ? <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="url(#hatch-sold)" className="plan__sold" /> : null}
            <text className="plan__rooms" x={x + w / 2} y={y + h / 2 - 14} textAnchor="middle">{roomsShort(a.rooms)}</text>
            <text className="plan__area" x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle">{w < 150 ? a.area.toLocaleString("ru-RU") : m2(a.area)}</text>
            {a.status === "free" && w >= 150 ? (
              <text className="plan__price" x={x + w / 2} y={y + h / 2 + 54} textAnchor="middle">{mln(a.price, 1)}</text>
            ) : null}
            {a.status !== "free" ? (
              <text className="plan__stat" x={x + w / 2} y={y + h / 2 + 54} textAnchor="middle">{statusLabel[a.status].toLowerCase()}</text>
            ) : null}
            <Windows a={a} />
            {a.status === "free" ? (
              // Свободная квартира — «огонь» навигационного знака: магентовая точка с ореолом.
              <g className="plan__light" transform={`translate(${x + w - 24} ${y + 24})`}>
                <circle r="13" />
                <circle r="6" />
              </g>
            ) : null}
          </>
        );
        const label = `Квартира ${a.number}: ${roomsLabel(a.rooms)}, ${m2(a.area)}, ${statusLabel[a.status].toLowerCase()}${a.status === "free" ? `, ${mln(a.price)}` : ""}`;
        return a.status === "sold" ? (
          <g key={a.id} className={cls} aria-label={label} role="img">{body}</g>
        ) : (
          <a key={a.id} className={cls} href={`#/kvartira/${a.id}`} aria-label={label}>{body}</a>
        );
      })}

      <g className="plan__sea" transform={`translate(${PLATE.w / 2} ${PLATE.h + 34})`}>
        <path d="M-60 0 Q-30 -8 0 0 T60 0" />
        <text y="22" textAnchor="middle">к заливу</text>
      </g>
    </svg>
  );
}

function Windows({ a }: { a: (typeof APARTMENTS)[number] }) {
  const { x, y, w, h } = a.plan;
  const lines: [number, number, number, number][] = [];
  const outerY = a.side === "north" ? y : y + h;
  if (a.side !== "full") lines.push([x + 18, outerY, x + w - 18, outerY]);
  else { lines.push([x + 18, y + h, x + w - 18, y + h]); lines.push([x + 18, y, x + w - 18, y]); }
  if (x === 0) lines.push([0, y + 18, 0, y + h - 18]);
  if (x + w === PLATE.w) lines.push([PLATE.w, y + 18, PLATE.w, y + h - 18]);
  return (
    <>
      {lines.map((l, i) => (
        <line key={i} className="plan__win" x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />
      ))}
    </>
  );
}

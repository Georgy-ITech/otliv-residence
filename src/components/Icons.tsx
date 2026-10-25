// Свои иконки одной толщиной пера — 1.5 при 24px, скругления как у изобат.
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const Arrow = ({ dir = "right" }: { dir?: "right" | "left" | "up" | "down" }) => {
  const r = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg {...base} style={{ transform: `rotate(${r}deg)` }}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
};
export const Close = () => (
  <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const Mark = ({ on }: { on?: boolean }) => (
  // Избранное — буй-веха: флажок на шесте, не сердечко.
  <svg {...base}>
    <path d="M7 21V4" />
    <path d="M7 4h10l-3 4 3 4H7" fill={on ? "currentColor" : "none"} />
  </svg>
);
export const Scales = () => (
  <svg {...base}>
    <path d="M12 4v16M5 20h14M6 8h12M6 8l-3 6h6zM18 8l-3 6h6z" />
  </svg>
);
export const Phone = () => (
  <svg {...base}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>
);
export const Grid = () => (
  <svg {...base}><path d="M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16" /></svg>
);
export const Rows = () => (
  <svg {...base}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);

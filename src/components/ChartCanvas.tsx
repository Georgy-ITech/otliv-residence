import { useEffect, useRef } from "react";
import { H, W } from "../chart/bay";
import { paintChart, type PaintOpts } from "../chart/paint";

export interface View { x: number; y: number; w: number; h: number }

/** Фрагмент карты в HTML-слое: тот же рисунок, что под 3D-домом, обрезанный окном view. */
export default function ChartCanvas({ view = { x: 0, y: 0, w: W, h: H }, opts, overlay, className, label }: {
  view?: View;
  opts?: PaintOpts;
  overlay?: (ctx: CanvasRenderingContext2D) => void;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let dead = false;
    const draw = async () => {
      await Promise.all([document.fonts.load("italic 500 20px Alegreya"), document.fonts.load("500 15px 'Golos Text'")]).catch(() => {});
      if (dead) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      const ctx = c.getContext("2d")!;
      const s = Math.max(c.width / view.w, c.height / view.h);
      const ox = (c.width - view.w * s) / 2, oy = (c.height - view.h * s) / 2;
      ctx.setTransform(s, 0, 0, s, ox - view.x * s, oy - view.y * s);
      paintChart(ctx, opts);
      overlay?.(ctx);
    };
    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(c);
    return () => { dead = true; ro.disconnect(); };
  }, [view, opts, overlay]);

  return <canvas ref={ref} className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

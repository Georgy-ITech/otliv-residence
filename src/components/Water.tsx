import { useEffect, useRef } from "react";

/*
  Вода первого экрана на сыром WebGL. Сцена над горизонтом (фото башни, заголовок,
  фон) рисуется в 2D-холст по реальным координатам DOM и становится текстурой;
  шейдер отражает её относительно линии воды, искажает рябью и добавляет блики.
  Над водой тот же шейдер рисует мокрый след на тексте, который только что вышел из воды.
*/
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uMask;
uniform sampler2D uAge;
uniform vec2 uRes;
uniform float uH;
uniform float uT;
uniform float uDpr;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

float mask(vec2 p, vec2 res){ return texture2D(uMask, clamp(p / res, 0.0, 1.0)).r; }
// Сколько секунд назад строка экрана вышла из воды (0..4).
float age(float y, vec2 res){ return texture2D(uAge, vec2(0.5, clamp(y / res.y, 0.0, 1.0))).r * 4.0; }

// Мокрый текст над водой: плёнка стекает по буквам, с нижних краёв срываются капли.
vec4 wet(vec2 px, vec2 res){
  float m = mask(px, res);
  vec4 o = vec4(0.0);
  if (m > 0.5) {
    // Граница мокрой зоны неровная и размытая, как высыхающая кромка.
    float jag = noise(vec2(px.x * 0.045, 3.0)) * 18.0;
    float w = 0.0;
    for (int i = 0; i < 4; i++) {
      w += 1.0 - smoothstep(0.15, 1.5, age(px.y - jag - float(i) * 7.0, res));
    }
    w *= 0.25;
    float t = age(px.y, res);
    if (w <= 0.0) return o;
    float gy = mask(px + vec2(0.0, 3.0), res) - mask(px - vec2(0.0, 3.0), res);
    float gx = mask(px + vec2(3.0, 0.0), res) - mask(px - vec2(3.0, 0.0), res);
    // Струйки, бегущие вниз по букве, и блик на верхних кромках.
    float run = noise(vec2(px.x * 0.32, px.y * 0.012 - t * 7.0));
    float streak = smoothstep(0.66, 0.8, run) * (1.0 - smoothstep(0.8, 0.95, run));
    float spec = clamp(-gy * 0.9 - gx * 0.3, 0.0, 1.0);
    float bead = smoothstep(0.955, 0.985, noise(px * 0.45));
    vec3 c = mix(vec3(0.5, 0.57, 0.6), vec3(1.0, 0.98, 0.94), clamp(spec + bead + streak, 0.0, 1.0));
    float a = (0.1 + 0.45 * streak) * w;
    a = max(a, (spec * 0.9 + bead * 0.8) * w);
    return vec4(c, a);
  }
  // Капли по физике: набухают на кромке ~0,1 с, срываются с ускорением падения,
  // с той же точки капает снова — всё реже, пока вода не сойдёт (~1,6 с).
  float cw = 22.0;
  float col = floor(px.x / cw);
  float h = hash(vec2(col, 7.0));
  if (h < 0.35) return o;
  float xc = col * cw + cw * 0.5 + (hash(vec2(col, 3.0)) - 0.5) * 10.0;
  float r = 1.4 + 1.8 * hash(vec2(col, 5.0));
  float dx = abs(px.x - xc);
  if (dx > r + 1.5) return o;
  float dist = -1.0;
  for (int i = 1; i <= 45; i++) {
    float up = float(i) * 4.0;
    if (mask(vec2(xc, px.y - up), res) > 0.5) { dist = up; break; }
  }
  if (dist < 0.0) return o;
  // Уточнение до пикселя: грубый шаг 4 px рвёт каплю на полосы.
  for (int j = 1; j <= 3; j++) {
    if (mask(vec2(xc, px.y - dist + 1.0), res) > 0.5) dist -= 1.0;
  }
  float t = age(px.y - dist, res) - hash(vec2(col, 11.0)) * 0.25;
  if (t < 0.0 || t > 1.9) return o;
  // Пауза между каплями растёт: воды на кромке всё меньше.
  float period = 0.28 + 0.3 * h;
  float k = floor(t / period);
  float fall = t - k * period;
  float rk = r * (1.0 - 0.18 * k);
  float swell = smoothstep(0.0, 0.1, fall);
  float drop = max(fall - 0.1, 0.0);
  float y = 1.0 + rk * swell + 2600.0 * drop * drop;
  float fade = (1.0 - smoothstep(110.0, 170.0, y)) * (1.0 - smoothstep(1.3, 1.9, t));
  if (fade <= 0.0 || dist > y + rk + 1.0) return o;
  // Перемычка между кромкой и каплей рвётся в момент отрыва.
  float neck = (1.0 - smoothstep(0.0, 0.04, drop)) * step(dist, y);
  float trail = (1.0 - smoothstep(rk * 0.25, rk * 0.25 + 0.7, dx)) * neck;
  // Висящая капля — слеза с острым верхом; падающая смазывается по скорости.
  float v = 5200.0 * drop;
  float stretch = 1.0 + v * 0.006;
  vec2 q = vec2(dx, (dist - y) / stretch);
  // В падении — смазанный след: узкий, сходит на нет кверху, без острия.
  float falling = smoothstep(0.0, 0.03, drop);
  float rr = mix(rk * clamp(1.0 + q.y / (rk * 2.4), 0.15, 1.0), rk * 0.55 * clamp(1.0 + q.y / rk * 0.5, 0.0, 1.0), falling);
  float len2 = length(q);
  float body = 1.0 - smoothstep(rr - 0.6, rr + 0.5, len2);
  if (body <= 0.0 && trail <= 0.0) return o;
  // Вода прозрачна: видно фон, чуть светлее, с тёмным краем и точкой блика.
  float edge = smoothstep(0.45, 1.0, len2 / max(rr, 0.01)) * body;
  float spec = 1.0 - smoothstep(0.0, 0.9, length(vec2(px.x - xc + rk * 0.3, (dist - y) / stretch + rk * 0.35)));
  float blur = 1.0 / stretch;
  vec3 c = mix(vec3(0.62, 0.72, 0.76), vec3(0.06, 0.09, 0.11), edge);
  c = mix(c, vec3(1.0), spec * body);
  float a = (body * (0.16 + 0.42 * edge) + spec * body * 0.85 * blur + trail * 0.35) * fade * mix(0.55, 1.0, blur);
  return vec4(c, a);
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 res = uRes / uDpr;
  float hy = uH * res.y;
  float d = px.y - hy;
  if (d < 0.0) { gl_FragColor = wet(px, res); return; }

  // Перспектива: у горизонта рябь мелкая и сжатая, к зрителю — крупнее.
  float k = clamp(d / max(res.y - hy, 1.0), 0.0, 1.0);
  float depth = 0.04 + d * 0.012;
  vec2 q = vec2(px.x * 0.004 / (0.35 + k), 1.0 / depth * 0.9);
  float n1 = fbm(q * vec2(1.0, 3.0) + vec2(uT * 0.03, -uT * 0.18));
  float n2 = fbm(q * vec2(2.3, 6.0) + vec2(-uT * 0.04, -uT * 0.3));
  float wave = n1 * 0.65 + n2 * 0.35;

  float amp = 0.6 + 8.0 * k;
  vec2 src = vec2(px.x + (wave - 0.5) * amp * 1.4, hy - d * 0.92 - (n2 - 0.5) * amp);
  vec3 sky = vec3(0.86, 0.88, 0.9);
  // Отражение размыто по вертикали и гаснет с глубиной — без резкого края у верха кадра.
  vec3 refl = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec2 sp = src + vec2(0.0, (float(i) - 2.0) * (1.5 + 9.0 * k));
    refl += sp.y < 0.0 ? sky : texture2D(uTex, clamp(sp / res, 0.0, 1.0)).rgb;
  }
  refl /= 5.0;
  float reach = 1.0 - smoothstep(0.6, 1.4, d / max(hy, 1.0));

  // Глубина: у горизонта вода отражает почти всё, ближе — темнеет до цвета залива.
  vec3 deep = vec3(0.2, 0.3, 0.36);
  vec3 bay = vec3(0.47, 0.56, 0.62);
  vec3 body = mix(bay, deep, smoothstep(0.0, 1.0, k));
  float fres = mix(0.85, 0.35, pow(k, 0.7)) * reach;
  vec3 col = mix(body, refl * vec3(0.92, 0.96, 1.0), fres);

  // Гребни волн: светлые штрихи на склонах, тёплые блики заката у горизонта.
  float ridge = smoothstep(0.58, 0.78, wave) * (0.35 + 0.65 * (1.0 - k));
  col += vec3(0.95, 0.72, 0.52) * ridge * 0.07;
  float glint = pow(smoothstep(0.8, 0.98, n2), 4.0) * (1.0 - k) * step(0.0, 0.25 - k);
  col += vec3(1.0, 0.82, 0.62) * glint * 0.25;
  col *= 0.98 + 0.02 * sin(d * 0.9 / (0.3 + k) + wave * 9.0);

  // Кромка прибоя: тонкая пена на линии воды.
  float foam = exp(-d / 2.2) * (0.55 + 0.45 * noise(vec2(px.x * 0.08, uT * 0.8)));
  col = mix(col, vec3(0.95, 0.94, 0.9), foam * 0.75);

  gl_FragColor = vec4(col, 1.0);
}`;

type Props = { stage: React.RefObject<HTMLDivElement | null>; still: boolean };

/**
  Рисует текст элемента в 2D-холст по буквам, каждую — в её DOM-координатах.
  По буквам, а не строкой: у цифр табличные ширины (tabular-nums), которых холст не знает.
*/
function drawText(ctx: CanvasRenderingContext2D, el: Element, base: DOMRect, color?: string) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const cs = getComputedStyle(n.parentElement!);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.letterSpacing = "0px";
    ctx.fillStyle = color ?? cs.color;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    const text = n.textContent ?? "";
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) continue;
      range.setStart(n, i);
      range.setEnd(n, i + 1);
      const r = range.getClientRects()[0];
      if (!r) continue;
      const mt = ctx.measureText(text[i]);
      const pad = (r.height - mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2;
      // Центр буквы без межбуквенного отступа, который DOM прибавляет справа.
      const ls = parseFloat(cs.letterSpacing) || 0;
      ctx.fillText(text[i], r.left - base.left + (r.width - ls) / 2, r.top - base.top + pad + mt.fontBoundingBoxAscent);
    }
  }
  ctx.textAlign = "start";
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, r: DOMRect, base: DOMRect, posFrom: HTMLImageElement = img) {
  const s = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  const pos = getComputedStyle(posFrom).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
  const x = r.left - base.left + (r.width - w) * (pos[0] ?? 0.5);
  const y = r.top - base.top + (r.height - h) * (pos[1] ?? 0.5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.left - base.left, r.top - base.top, r.width, r.height);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

export default function Water({ stage, still }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current, root = stage.current;
    if (!canvas || !root) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) { root.classList.add("no-webgl"); return; }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { root.classList.add("no-webgl"); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uH = u("uH"), uT = u("uT"), uDpr = u("uDpr");
    gl.uniform1i(u("uTex"), 0);
    gl.uniform1i(u("uMask"), 1);
    gl.uniform1i(u("uAge"), 2);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const mkTex = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const maskTex = mkTex(1);
    const ageTex = mkTex(2);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const scene = document.createElement("canvas");
    const sctx = scene.getContext("2d")!;
    const maskC = document.createElement("canvas");
    // Кромки балконов дома: с них, как с букв, срываются капли, когда вода сходит.
    const wetImg = new Image();
    wetImg.src = `${import.meta.env.BASE_URL}img/hero-wet.webp`;
    const mctx = maskC.getContext("2d")!;

    // Когда каждая строка экрана вышла из воды: пару секунд после этого она «мокрая».
    const ROWS = 512;
    const exposedAt = new Float64Array(ROWS).fill(-1e9);
    const under = new Uint8Array(ROWS);
    const ages = new Uint8Array(ROWS);
    let primed = false;
    const updateAge = (h: number, now: number) => {
      for (let r = 0; r < ROWS; r++) {
        const isUnder = (r + 0.5) / ROWS > h;
        if (!isUnder && under[r] && primed) exposedAt[r] = now;
        under[r] = isUnder ? 1 : 0;
        ages[r] = Math.round((Math.min(4, Math.max(0, (now - exposedAt[r]) / 1000)) / 4) * 255);
      }
      primed = true;
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, ageTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, ROWS, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, ages);
      gl.activeTexture(gl.TEXTURE0);
    };

    // Текстура сцены — то, что над водой: фон, фото, крупный заголовок.
    const paint = () => {
      const base = root.getBoundingClientRect();
      const s = base.width < 900 ? 1 : 0.5;
      scene.width = Math.max(2, Math.round(base.width * s));
      scene.height = Math.max(2, Math.round(base.height * s));
      sctx.setTransform(s, 0, 0, s, 0, 0);
      sctx.fillStyle = "#EEEAE2";
      sctx.fillRect(0, 0, base.width, base.height);
      const img = root.querySelector<HTMLImageElement>(".hero__air .hero__photo img");
      if (img?.complete && img.naturalWidth) drawCover(sctx, img, img.getBoundingClientRect(), base);
      const t = root.querySelector(".hero__air .hero__title");
      if (t) drawText(sctx, t, base);

      // Маска текста для мокрого следа — в полном разрешении, иначе капли мылятся.
      maskC.width = Math.max(2, Math.round(base.width));
      maskC.height = Math.max(2, Math.round(base.height));
      mctx.fillStyle = "#000";
      mctx.fillRect(0, 0, maskC.width, maskC.height);
      root.querySelectorAll(".hero__air .hero__title, .hero__air .hnum b").forEach((el) => drawText(mctx, el, base, "#fff"));
      if (img?.complete && img.naturalWidth && wetImg.complete && wetImg.naturalWidth && window.innerWidth > 760) drawCover(mctx, wetImg, img.getBoundingClientRect(), base, img);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, maskC);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, scene);
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const size = () => {
      const r = root.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      paint();
    };

    let raf = 0, visible = true;
    const t0 = performance.now();
    const frame = () => {
      const h = parseFloat(getComputedStyle(root).getPropertyValue("--h")) || 0.5;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uH, h);
      updateAge(still ? 0 : h, performance.now());
      gl.uniform1f(uT, still ? 4 : (performance.now() - t0) / 1000);
      gl.uniform1f(uDpr, dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still && visible) raf = requestAnimationFrame(frame);
    };

    size();
    frame();
    const img = root.querySelector<HTMLImageElement>(".hero__air .hero__photo img");
    const repaint = () => { paint(); if (still) frame(); };
    img?.addEventListener("load", repaint);
    wetImg.addEventListener("load", repaint);
    document.fonts?.ready.then(repaint);
    const ro = new ResizeObserver(() => { size(); if (still) frame(); });
    ro.observe(root);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !still) raf = requestAnimationFrame(frame);
    });
    io.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      img?.removeEventListener("load", repaint);
      wetImg.removeEventListener("load", repaint);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [stage, still]);

  return <canvas ref={ref} className="hero__waterfx" aria-hidden="true" />;
}

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { W, H, SITE } from "../chart/bay";
import { paintChart } from "../chart/paint";
import { FLOORS, FIRST_LIVING_FLOOR } from "../data/apartments";

/*
  Дом стоит на карте как макет на штурманском столе. Карта — текстура земли,
  солнце ходит с прокруткой, и тень дома ползёт по промерам, как стрелка часов.
  Этаж — отдельный меш, поэтому наведение и клик работают по этажам.
*/

const GROUND = { w: 32, h: 20 };
const toWorld = (x: number, y: number) => new THREE.Vector3((x / W - 0.5) * GROUND.w, 0, (y / H - 0.5) * GROUND.h);
const PLATE = { w: 4.2, d: 2.35 };
const FLOOR_H = 0.34;
const SLAB = 0.07;
const TOWER_ROT = -0.52;
const wave = (floor: number) => 0.18 + 0.42 * (0.5 + 0.5 * Math.sin((floor / FLOORS) * Math.PI * 2.2 - 0.6));

export interface SceneProps {
  time: number; // 0 — утро, 1 — ночь
  hover: number | null;
  active: number | null;
  onHover: (floor: number | null, e?: { x: number; y: number }) => void;
  onPick: (floor: number) => void;
  compact: boolean;
}

function chartTexture() {
  const c = document.createElement("canvas");
  c.width = 2400;
  c.height = 1500;
  const ctx = c.getContext("2d")!;
  ctx.scale(c.width / W, c.height / H);
  paintChart(ctx, { grid: true });
  const t = new THREE.CanvasTexture(c);
  // Подписи карты — курсивом Alegreya; если шрифт ещё грузится, перерисовываем, когда он придёт.
  Promise.all([document.fonts.load("italic 500 20px Alegreya"), document.fonts.load("500 15px 'Golos Text'")])
    .then(() => { ctx.clearRect(0, 0, W, H); paintChart(ctx, { grid: true }); t.needsUpdate = true; })
    .catch(() => {});
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    scene.environment = env;
    return () => { env.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

const MAGENTA = new THREE.Color("#a1267f");
const WARM = new THREE.Color("#ffc37a");

function Tower({ time, hover, active, onHover, onPick }: Omit<SceneProps, "compact">) {
  const site = useMemo(() => toWorld(SITE.x, SITE.y), []);
  // Окна, которые зажигаются вечером: свой порог у каждого этажа — дом светится неравномерно, как живой.
  const lightAt = useMemo(() => Array.from({ length: FLOORS + 1 }, (_, i) => 0.6 + ((Math.sin(i * 12.9898) * 43758.5) % 1 + 1) % 1 * 0.3), []);
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f3f1ea", roughness: 0.85 }), []);
  const floors = useMemo(() => Array.from({ length: FLOORS }, (_, i) => i + 1), []);

  const glassFor = (floor: number) => {
    const isHot = floor === hover || floor === active;
    const lit = time > lightAt[floor] ? Math.min(1, (time - lightAt[floor]) * 12) : 0;
    return { isHot, lit };
  };

  const handle = (floor: number) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (floor >= FIRST_LIVING_FLOOR) onHover(floor, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (floor >= FIRST_LIVING_FLOOR) onHover(floor, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
    },
    onPointerOut: () => onHover(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (floor >= FIRST_LIVING_FLOOR) onPick(floor);
    },
  });

  return (
    <group position={[site.x, 0, site.z]} rotation={[0, TOWER_ROT, 0]}>
      {/* Стилобат: первый этаж — лобби и терраса к морю. */}
      <mesh position={[0, FLOOR_H / 2, 0.25]} castShadow receiveShadow material={slabMat}>
        <boxGeometry args={[PLATE.w + 1.4, FLOOR_H, PLATE.d + 1.6]} />
      </mesh>
      {floors.slice(1).map((floor) => {
        const y = (floor - 1) * FLOOR_H;
        const { isHot, lit } = glassFor(floor);
        const pent = floor === FLOORS;
        const w = pent ? PLATE.w * 0.82 : PLATE.w;
        return (
          <group key={floor} position={[0, y, 0]} {...handle(floor)}>
            <mesh position={[0, SLAB / 2, 0]} castShadow receiveShadow material={slabMat}>
              <boxGeometry args={[w + 0.1, SLAB, PLATE.d + 0.1]} />
            </mesh>
            <mesh position={[0, SLAB + (FLOOR_H - SLAB) / 2, 0]} castShadow>
              <boxGeometry args={[w - 0.08, FLOOR_H - SLAB, PLATE.d - 0.08]} />
              <meshStandardMaterial
                color={isHot ? "#e9c8de" : "#cfdee6"}
                metalness={0.15}
                roughness={0.38}
                emissive={isHot ? MAGENTA : WARM}
                emissiveIntensity={isHot ? 0.55 : lit * 0.55}
                envMapIntensity={1.2}
              />
            </mesh>
            {/* Балконы к заливу: вынос меняется от этажа к этажу — по фасаду идёт медленная волна отлива. */}
            {!pent ? (
              <mesh position={[0, SLAB / 2, PLATE.d / 2 + wave(floor) / 2]} castShadow receiveShadow material={slabMat}>
                <boxGeometry args={[w - 0.3, SLAB, wave(floor)]} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      <mesh position={[0, FLOORS * FLOOR_H - FLOOR_H + SLAB + 0.02, 0]} castShadow material={slabMat}>
        <boxGeometry args={[PLATE.w * 0.86, SLAB, PLATE.d + 0.2]} />
      </mesh>
    </group>
  );
}

function Rig({ time, compact }: { time: number; compact: boolean }) {
  const { camera, invalidate } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const site = useMemo(() => toWorld(SITE.x, SITE.y), []);

  useEffect(() => {
    // Камера чуть обходит дом вместе с солнцем — сцена не стоит на месте, но и не крутится.
    const az = 0.95 - time * 0.35;
    const dist = compact ? 75 : 31;
    const hgt = compact ? 30 : 17.5;
    // Дом стоит правее центра, чтобы картуш слева не закрывал его; на телефоне — по центру, выше картуша.
    const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const target = site.clone().add(new THREE.Vector3(0, compact ? -5.6 : 3.4, 0)).addScaledVector(right, compact ? 0 : -4.2);
    camera.position.set(target.x + Math.sin(az) * dist, hgt, target.z + Math.cos(az) * dist);
    camera.lookAt(target);

    // Солнце: восток утром → запад вечером, ниже к ночи; цвет теплеет на закате, синеет ночью.
    const sa = -1.2 + time * 2.5;
    const elev = Math.max(0.06, Math.sin(Math.PI * Math.min(1, time * 1.1)) * 0.5 + 0.08);
    if (sun.current) {
      sun.current.position.set(site.x + Math.cos(sa) * 18, 4 + elev * 22, site.z - Math.sin(sa) * 10 - 6);
      sun.current.target.position.copy(site);
      sun.current.target.updateMatrixWorld();
      const warm = THREE.MathUtils.smoothstep(time, 0.45, 0.75);
      const night = THREE.MathUtils.smoothstep(time, 0.78, 1);
      sun.current.color.setRGB(1, 1 - warm * 0.22, 1 - warm * 0.45).lerp(new THREE.Color("#8fa8d8"), night);
      sun.current.intensity = 2.1 * (1 - night * 0.82);
    }
    if (hemi.current) {
      const night = THREE.MathUtils.smoothstep(time, 0.78, 1);
      hemi.current.intensity = 0.75 - night * 0.45;
    }
    invalidate();
  }, [time, compact, camera, invalidate, site]);

  return (
    <>
      <hemisphereLight ref={hemi} args={["#f4f8fb", "#d9cfb2", 0.75]} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={80}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  );
}

/** Края карты растворяются в бумаге страницы — лист без видимого обреза. */
function edgeFade() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 256, 160);
  const g = ctx.createRadialGradient(150, 80, 40, 150, 80, 150);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.62, "#fff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 160);
  return new THREE.CanvasTexture(c);
}

function Ground({ time }: { time: number }) {
  const tex = useMemo(chartTexture, []);
  const fade = useMemo(edgeFade, []);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    document.fonts.ready.then(() => setTimeout(invalidate, 60));
    return () => { tex.dispose(); fade.dispose(); };
  }, [tex, fade, invalidate]);
  useEffect(() => {
    // Карта вне света: цвета бумаги точные, а время суток — тоном, к ночи синеет и гаснет.
    const dusk = THREE.MathUtils.smoothstep(time, 0.55, 0.8);
    const night = THREE.MathUtils.smoothstep(time, 0.78, 1);
    mat.current?.color.set("#ffffff").lerp(new THREE.Color("#f7e6d2"), dusk * 0.7).lerp(new THREE.Color("#8d97a8"), night * 0.6);
    invalidate();
  }, [time, invalidate]);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GROUND.w, GROUND.h]} />
        <meshBasicMaterial ref={mat} map={tex} alphaMap={fade} transparent toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[GROUND.w, GROUND.h]} />
        <shadowMaterial opacity={0.22} color="#1b2a3a" />
      </mesh>
    </>
  );
}

export default function Scene(p: SceneProps) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ fov: 30, near: 0.5, far: 200 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.92 }}
      onPointerMissed={() => p.onHover(null)}
      onCreated={({ scene }) => { scene.background = null; }}
    >
      <Env />
      <Rig time={p.time} compact={p.compact} />
      <Ground time={p.time} />
      <Tower {...p} />
    </Canvas>
  );
}


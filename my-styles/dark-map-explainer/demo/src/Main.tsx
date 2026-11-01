import React, { useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, staticFile, Img, delayRender, continueRender } from "remotion";
import { PT, FPS, DURATION, ease, easeOut, ramp, win, clamp } from "./timeline";
import { MAP, RINGS, HH, DIKE, cum, along, PL, camAt, proj, Cam, pts } from "./geo";
import { TextLayer } from "./Text";
import { SaltScene, StudyScene, Crane, Deer, Turbine } from "./Art";

const p = PT;
const COL = { ink: "#EFEADB", red: "#CE5E54", blue: "#8CCBD2", cyan: "#58C3C5", gold: "#CCBA92", card: "#253238", num: "#86DDFD" };
const SANS = "'Noto Sans CJK SC', 'Noto Sans SC', sans-serif";

// ---------- 局部描线：按长度截取折线 ----------
const partial = (P: [number, number][], C: number[], u0: number, u1: number) => {
  const L = C[C.length - 1]; const a = L * clamp(u0), b = L * clamp(u1);
  if (b <= a) return "";
  const out: [number, number][] = [along(P, C, u0)];
  for (let i = 0; i < P.length; i++) if (C[i] > a && C[i] < b) out.push(P[i]);
  out.push(along(P, C, u1));
  return "M" + out.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join("L");
};
const toD = (P: [number, number][]) => "M" + P.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join("L");
const DIKE_C = cum(DIKE), HH_C = cum(HH);
const COASTS = (MAP.coast as string).split("M").filter(Boolean).map((s: string) => pts("M" + s));
const COAST = COASTS.reduce((a: any, b: any) => (b.length > a.length ? b : a));
// 让海岸线从北往南描
const COAST_NS = COAST[0][1] < COAST[COAST.length - 1][1] ? COAST : [...COAST].reverse();
const COAST_C = cum(COAST_NS);
const RING_C = RINGS.map(cum);
// 环上纬度≈33.05° 的点，用来放年份小字
const ringAt = (i: number, wy: number) => RINGS[i].reduce((a, q) => (Math.abs(q[1] - wy) < Math.abs(a[1] - wy) ? q : a));

// ---------- 时间函数 ----------
// 古海（示意）：k=0 约1128年海岸（东冈/范公堤），k=1 今海岸
const seaState = (t: number) => {
  if (t < p[1].t0) return { k: 0, vis: ramp(t, p[0].t0 + 0.8, p[0].t0 + 1.8) * 0 };
  if (t < p[3].s) return { k: ease(ramp(t, p[1].t0 + 0.2, p[1].t0 + 1.4)) * 0 + (t < p[2].s ? 0 : ease(ramp(t, p[2].t0, p[2].t0 + 3.0))), vis: ramp(t, p[1].t0, p[1].t0 + 1.4) };
  if (t < p[8].s + 3.0) return { k: 0, vis: ramp(t, p[3].s, p[3].s + 1.2) };
  return { k: clamp((t - (p[8].s + 3.0)) / 8.0), vis: 1 };
};
// 时间轴游标年份
const YK: [number, number][] = [
  [0, 2026], [p[1].t0, 2026], [p[1].t0 + 1.6, 1026], [p[2].t0, 1026], [p[2].t0 + 3.0, 2026],
  [p[3].s, 2026], [p[3].s + 1.6, -119], [p[4].t0 + 1.0, -119], [p[4].t0 + 2.2, 411],
  [p[5].s + 0.4, 411], [p[5].s + 2.0, 1028], [p[6].s + 0.6, 1028], [p[6].t0, 1128],
  [p[7].t0, 1128], [p[7].e - 0.4, 1855], [p[8].s + 2.8, 1128],
];
const RING_YEAR = (k: number) => { const K = [0, 15 / 52, 25 / 52, 50 / 52, 1], Y = [1128, 1500, 1600, 1855, 2026]; let i = 1; while (i < 4 && K[i] < k) i++; return Y[i - 1] + (Y[i] - Y[i - 1]) * clamp((k - K[i - 1]) / (K[i] - K[i - 1])); };
const yearAt = (t: number) => {
  if (t >= p[8].s + 2.8 && t < p[9].s) return RING_YEAR(seaState(t).k);
  const K2: [number, number][] = [...YK, [p[9].s, 2026], [p[12].s, 2026], [p[12].t0 + 0.6, 1941], [p[13].e, 1941], [p[14].s + 0.5, 2026], [p[15].t0, 2026], [p[15].t0 + 1.2, 2019], [p[15].e, 2019], [p[16].s + 0.6, 2026]];
  const K = t >= p[9].s ? K2.filter((k) => k[0] >= p[9].s) : YK;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * ease((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
  return K[K.length - 1][1];
};
const timelineVis = (t: number) => Math.min(ramp(t, 0.8, 1.6), 1 - ramp(t, p[18].s + 0.5, p[18].s + 1.5)) * (1 - win(t, p[10].s, p[12].s, 0.6, 0.6));

// ---------- 小组件 ----------
const Label: React.FC<{ x: number; y: number; text: string; o: number; size?: number; color?: string; dx?: number; dy?: number; anchor?: "start" | "middle" | "end"; weight?: number }> = ({ x, y, text, o, size = 22, color = COL.ink, dx = 0, dy = 0, anchor = "start", weight = 500 }) =>
  o <= 0.001 ? null : (
    <text x={x + dx} y={y + dy} fill={color} opacity={o} fontSize={size} fontFamily={SANS} fontWeight={weight} textAnchor={anchor}
      style={{ paintOrder: "stroke", stroke: "rgba(10,8,6,0.75)", strokeWidth: 4 }}>{text}</text>
  );
const Glow: React.FC<{ x: number; y: number; o: number; c?: string; r?: number }> = ({ x, y, o, c = COL.gold, r = 1 }) =>
  o <= 0.001 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={34 * r} fill={c} opacity={0.12} />
      <circle cx={x} cy={y} r={16 * r} fill={c} opacity={0.25} />
      <circle cx={x} cy={y} r={6 * r} fill="#FFF6DE" />
    </g>
  );
const Card: React.FC<{ t: number; a: number; b: number; x: number; y: number; w: number; h: number; from?: [number, number]; children: React.ReactNode; note?: string }> = ({ t, a, b, x, y, w, h, from, children, note }) => {
  const o = win(t, a, b, 0.45, 0.4);
  if (o <= 0) return null;
  const k = easeOut(ramp(t, a, a + 0.5));
  // 引线：从地图点到卡片最近的角
  let lead = null;
  if (from) {
    const cx = clamp(from[0], x, x + w), cy = clamp(from[1], y, y + h);
    const lk = easeOut(ramp(t, a + 0.1, a + 0.6));
    lead = (
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
        <line x1={from[0]} y1={from[1]} x2={from[0] + (cx - from[0]) * lk} y2={from[1] + (cy - from[1]) * lk} stroke="#D8D2C0" strokeWidth={1.6} opacity={0.75} />
        <circle cx={from[0]} cy={from[1]} r={5} fill="#D8D2C0" />
      </svg>
    );
  }
  return (
    <>
      {lead}
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: o, transform: `scale(${0.96 + 0.04 * k})`, transformOrigin: "50% 50%",
        background: "linear-gradient(180deg, rgba(40,55,61,0.96), rgba(33,45,50,0.96))", border: "1.5px solid rgba(214,220,210,0.42)", borderRadius: 12,
        boxShadow: "0 18px 50px rgba(0,0,0,0.55)", overflow: "hidden", fontFamily: SANS, color: COL.ink }}>
        {children}
        {note ? <div style={{ position: "absolute", right: 16, bottom: 10, fontSize: 20, color: "#B9B4A6", opacity: 0.9 }}>{note}</div> : null}
      </div>
    </>
  );
};
const BigNum: React.FC<{ n: string; unit: string; sub?: string; src?: string }> = ({ n, unit, sub, src }) => (
  <div style={{ padding: "26px 30px" }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontFamily: "SerifHeavy", fontSize: 92, color: COL.num, lineHeight: "100px", textShadow: "0 0 18px rgba(134,221,253,0.35)" }}>{n}</span>
      <span style={{ fontSize: 32, color: COL.ink, fontWeight: 600 }}>{unit}</span>
    </div>
    {sub ? <div style={{ fontSize: 27, lineHeight: "40px", marginTop: 6, color: "#E4DFD0", whiteSpace: "pre-line" }}>{sub}</div> : null}
    {src ? <div style={{ fontSize: 19, marginTop: 10, color: "#9D9A8F" }}>{src}</div> : null}
  </div>
);

// ---------- 潮汐树（示意） ----------
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
type Br = { d: string; depth: number };
const tree = (x: number, y: number, ang: number, len: number, depth: number, seed: number, acc: Br[]) => {
  if (depth > 4 || len < 3) return;
  let cx = x, cy = y; const pp: string[] = [`M${x.toFixed(1)},${y.toFixed(1)}`];
  for (let i = 0; i < 4; i++) { ang += (rnd(seed + i) - 0.5) * 0.6; cx += Math.cos(ang) * len / 4; cy += Math.sin(ang) * len / 4; pp.push(`L${cx.toFixed(1)},${cy.toFixed(1)}`); }
  acc.push({ d: pp.join(""), depth });
  tree(cx, cy, ang - 0.55 - rnd(seed + 9) * 0.3, len * 0.66, depth + 1, seed * 1.7 + 1, acc);
  tree(cx, cy, ang + 0.45 + rnd(seed + 7) * 0.3, len * 0.62, depth + 1, seed * 1.3 + 2, acc);
};
// 世界坐标：从海侧向陆地分叉（朝西）
const TREES: Br[] = [];
[[330, 300], [345, 262], [338, 228], [322, 330], [190, -60], [200, -100], [175, -140], [210, -20]].forEach(([x, y], i) => tree(x + 30, y, Math.PI + (rnd(i) - 0.5) * 0.5, 34, 0, i * 3 + 1, TREES));

// ---------- 粒子：黄河泥沙 ----------
const SED = Array.from({ length: 260 }, (_, i) => ({ ph: rnd(i + 0.3), sp: 0.16 + rnd(i + 5) * 0.1, ang: -1.2 + rnd(i + 9) * 2.6, r: 0.6 + rnd(i + 2) * 1.4 }));

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [h] = useState(() => delayRender("font"));
  useEffect(() => {
    const f = new FontFace("SerifHeavy", `url(${staticFile("fonts/NotoSerifSC-Black.otf")})`, { weight: "900" });
    f.load().then((ff) => { (document as any).fonts.add(ff); return (document as any).fonts.ready; }).then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
  const cam = camAt(t);
  const P = (x: number, y: number) => proj(cam, x, y);
  const pl = (n: string) => P(PL[n][0], PL[n][1]);
  const tr = `translate(${cam.sx - cam.fx * cam.z},${cam.sy - cam.fy * cam.z}) scale(${cam.z})`;
  const NS = { vectorEffect: "non-scaling-stroke" as const, fill: "none" };
  const sea = seaState(t);
  const ki = sea.k * (RINGS.length - 1); const k0 = Math.floor(ki), kf = ki - k0;
  const seaFill = (i: number, o: number) => (o > 0.002 && MAP.seas[i] ? <path d={MAP.seas[i]} fill="#163838" opacity={o} /> : null);

  // 各元素可见度
  const dikeDraw = ease(ramp(t, p[5].t0 - 0.4, p[5].t0 + 3.4));
  const dikeO = Math.min(1, 1 - 0.55 * ramp(t, p[10].s, p[10].s + 1.5)) * (1 - 0.6 * ramp(t, p[14].s, p[14].s + 1.5));
  const hhDraw = ease(ramp(t, p[6].t0 - 0.6, p[6].t0 + 3.0));
  const hhO = 1 - 0.75 * ramp(t, p[8].s + 0.5, p[8].s + 2.5) - 0.25 * ramp(t, p[10].s, p[10].s + 1);
  const netO = 0.32 + 0.55 * win(t, p[10].t0 - 0.6, p[11].e, 1.4, 1.0);
  const ringsO = (t < p[8].s ? 0 : 1) * (1 - 0.7 * ramp(t, p[10].s, p[10].s + 1.5)) * (1 - ramp(t, p[14].s, p[14].s + 1)) + 0.45 * ramp(t, p[18].s + 1, p[18].s + 3);
  const coastTrace = ease(ramp(t, p[14].t0 + 0.2, p[14].t0 + 3.4));
  const coastHi = win(t, p[14].t0, p[14].e + 0.2, 0.5, 0.8);
  const ycHi = win(t, 0, p[0].e + 0.3, 0.6, 0.8);

  return (
    <AbsoluteFill style={{ background: "#0E1C20" }}>
      {/* ================= 地图（世界坐标，一个 transform 管全部运镜） ================= */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="deep" gradientUnits="userSpaceOnUse" x1={250} y1={0} x2={1500} y2={600}>
            <stop offset="0" stopColor="#173A3A" /><stop offset="1" stopColor="#0D1A1D" />
          </linearGradient>
          <pattern id="waves" patternUnits="userSpaceOnUse" width={46} height={22}>
            <path d="M2,11 q6,-4 12,0 t12,0" stroke="#58C3C5" strokeWidth={1} fill="none" opacity={0.22} />
          </pattern>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={6} /></filter>
        </defs>
        <g transform={tr}>
          <rect x={-6000} y={-4000} width={12000} height={9000} fill="url(#deep)" />
          <path d={MAP.land} fill="#37312A" />
          <path d={MAP.js} fill="#3B352C" />
          <path d={MAP.prov} {...NS} stroke="#7A715F" strokeWidth={1} strokeDasharray="5 4" opacity={0.55} />
          <path d={MAP.yc} fill="#433B2F" />
          <path d={MAP.yc} fill="#CCBA92" opacity={0.10 * ycHi} />
          <path d={MAP.lakes} fill="#1F4648" opacity={0.85} />
          <path d={MAP.net} {...NS} stroke={netO > 0.5 ? "#58C3C5" : "#4A7C7A"} strokeWidth={0.7} opacity={netO} />
          {netO > 0.5 ? <path d={MAP.net} {...NS} stroke="#58C3C5" strokeWidth={3} opacity={(netO - 0.5) * 0.35} /> : null}
          <path d={MAP.maj} {...NS} stroke="#5E9A98" strokeWidth={1.3} opacity={0.75} />
          <path d={MAP.cty} {...NS} stroke="#857B66" strokeWidth={0.9} opacity={0.6} />
          {/* 古海（示意）叠在今天的陆地上 */}
          {sea.vis > 0 ? (
            <g opacity={sea.vis}>
              {seaFill(k0, (1 - kf) * 0.94)}{seaFill(Math.min(RINGS.length - 1, k0 + 1), kf * 0.94)}
              {MAP.seas[Math.round(ki)] ? <path d={MAP.seas[Math.round(ki)]} fill="url(#waves)" /> : null}
            </g>
          ) : null}
          {/* 今天的海岸线：一直在 */}
          <path d={MAP.coast} {...NS} stroke="#CFC6AE" strokeWidth={2.2} opacity={0.9} />
          <path d={MAP.yc} {...NS} stroke="#BDB298" strokeWidth={1.6} opacity={0.85} />
          {coastHi > 0 ? (
            <g opacity={coastHi}>
              <path d={partial(COAST_NS, COAST_C, 0, coastTrace)} {...NS} stroke={COL.cyan} strokeWidth={12} opacity={0.25} strokeLinecap="round" />
              <path d={partial(COAST_NS, COAST_C, 0, coastTrace)} {...NS} stroke="#BFF3F2" strokeWidth={3.2} strokeLinecap="round" />
            </g>
          ) : null}
          {/* 年轮 */}
          {ringsO > 0 ? RINGS.map((r, i) => {
            const on = i <= ki + 0.001 || t > p[18].s;
            if (!on) return null;
            const lead = Math.abs(i - Math.round(ki)) < 1 && t < p[9].s;
            const key = i === 0 || i === 14 || i === 23 || i === 45;
            return <path key={i} d={MAP.rings[i]} {...NS} stroke={lead ? "#BFF3F2" : COL.blue} strokeWidth={lead ? 2.4 : key ? 1.4 : 0.8} opacity={ringsO * (lead ? 1 : key ? 0.75 : 0.42)} />;
          }) : null}
          {/* 古海岸前缘（P2–P3 预览） */}
          {t >= p[1].t0 && t < p[3].s + 1.2 && sea.vis > 0 ? (
            <path d={MAP.rings[Math.round(ki)]} {...NS} stroke="#BFF3F2" strokeWidth={2.4} opacity={sea.vis * (t < p[3].s ? 1 : 1 - ramp(t, p[3].s, p[3].s + 1.2)) * (1 - ramp(sea.k, 0.97, 1))} />
          ) : null}
          {/* 范公堤 */}
          {dikeDraw > 0 ? (
            <g opacity={dikeO}>
              <path d={partial(DIKE, DIKE_C, 0, dikeDraw)} {...NS} stroke={COL.gold} strokeWidth={14} opacity={0.22} strokeLinecap="round" />
              <path d={partial(DIKE, DIKE_C, 0, dikeDraw)} {...NS} stroke="#F1E2B8" strokeWidth={3.4} strokeLinecap="round" />
            </g>
          ) : null}
          {/* 黄河 1128–1855 */}
          {hhDraw > 0 ? (
            <g opacity={hhO}>
              <path d={partial(HH, HH_C, 0, hhDraw)} {...NS} stroke={COL.cyan} strokeWidth={16} opacity={0.22} strokeLinecap="round" />
              <path d={partial(HH, HH_C, 0, hhDraw)} {...NS} stroke={COL.cyan} strokeWidth={6} opacity={0.55} strokeLinecap="round" />
              <path d={partial(HH, HH_C, 0, hhDraw)} {...NS} stroke="#C9F5F3" strokeWidth={2} strokeLinecap="round" />
            </g>
          ) : null}
          {/* 潮汐树 */}
          {t > p[15].s ? (() => {
            const g = ramp(t, p[15].t0, p[15].t0 + 3.2) * (1 - 0.5 * ramp(t, p[18].s, p[18].s + 2));
            return <g opacity={0.9}>{TREES.map((b, i) => (g * 5 > b.depth ? <path key={i} d={b.d} {...NS} stroke={COL.cyan} strokeWidth={Math.max(0.8, 2.6 - b.depth * 0.45)} opacity={clamp(g * 5 - b.depth) * 0.85} /> : null))}</g>;
          })() : null}
        </g>
      </svg>

      {/* ================= 屏幕空间：点、标注、图标 ================= */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="blurS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={18} /></filter></defs>
        {(() => {
          const L: React.ReactNode[] = [];
          const reg = 1 - win(t, p[6].s + 1.5, p[8].s + 1.8, 1, 1);
          // 县区名（区域视图）
          const ctyO = 0.55 * reg * (1 - win(t, p[3].s, p[5].s + 2, 1, 1)) * (1 - win(t, p[10].s, p[14].s + 2, 1, 1)) * (1 - ramp(t, p[15].s, p[15].s + 1.2) + ramp(t, p[18].s + 1, p[18].s + 3));
          Object.entries(MAP.ctylab as Record<string, [number, number]>).forEach(([n, q]) => { const [x, y] = P(q[0], q[1]); L.push(<Label key={"c" + n} x={x} y={y} text={n.replace(/[县区市]$/, "")} o={ctyO} size={21} color="#CFC7B2" anchor="middle" />); });
          // 黄海
          const [hx, hy] = P(470, -40);
          L.push(<Label key="hh" x={hx} y={hy} text="黄  海" o={0.5 * reg * (1 - win(t, p[10].s, p[14].s + 1, 1, 1))} size={34} color="#9FC9C9" anchor="middle" weight={400} />);
          // 盐城点
          const [yx, yy] = pl("盐城");
          const ycO = 1;
          const redO = win(t, p[12].t0 + 0.4, p[13].e + 0.3, 0.5, 0.6);
          L.push(<Glow key="yg" x={yx} y={yy} o={ycO * (1 - redO)} />);
          L.push(<Glow key="yr" x={yx} y={yy} o={redO} c={COL.red} r={1.2} />);
          if (redO > 0 && t > p[13].s) for (let i = 0; i < 3; i++) { const ph = ((t - p[13].s) * 0.45 + i / 3) % 1; L.push(<circle key={"rr" + i} cx={yx} cy={yy} r={20 + ph * 260} fill="none" stroke={COL.red} strokeWidth={2} opacity={redO * (1 - ph) * 0.7} />); }
          const nameDu = win(t, p[4].t0 + 0.1, p[4].t0 + 1.9, 0.3, 0.3);
          L.push(<Label key="yl" x={yx} y={yy} dx={18} dy={-14} text="盐城" o={1 - nameDu} size={26} weight={700} />);
          L.push(<Label key="yd" x={yx} y={yy} dx={18} dy={-14} text="盐渎（西汉）" o={nameDu} size={26} weight={700} color={COL.blue} />);
          // 煮盐灶（城市视图）
          const saltO = win(t, p[3].t0, p[4].e, 0.6, 0.6);
          if (saltO > 0) [0.27, 0.33, 0.39, 0.45, 0.51].map((u) => along(DIKE, DIKE_C, u)).map(([x, y], i) => [x - 12 - (i % 2) * 14, y] as [number, number]).forEach(([wx, wy], i) => {
            const [x, y] = P(wx, wy);
            L.push(<g key={"st" + i} opacity={saltO} transform={`translate(${x},${y}) scale(1.8) translate(${-x},${-y})`}>
              <path d={`M${x - 9},${y} L${x - 6},${y - 10} L${x + 6},${y - 10} L${x + 9},${y} Z`} fill="#CCBA92" />
              {[0, 1, 2].map((j) => { const ph = (t * 0.5 + j / 3 + i * 0.13) % 1; return <circle key={j} cx={x + Math.sin(ph * 5 + i) * 4} cy={y - 14 - ph * 34} r={3 + ph * 7} fill="#EFEADB" opacity={0.35 * (1 - ph)} />; })}
            </g>);
          });
          // 古海岸 / 范公堤 / 今海岸 标注
          const [ax, ay] = P(...(ringAt(0, 120) as [number, number]));
          L.push(<Label key="old" x={ax} y={ay} dx={14} text="约一千年前的海岸线" o={win(t, p[1].t0 + 1.2, p[2].t0 + 0.2, 0.5, 0.4)} size={22} color="#BFF3F2" />);
          const [dx2, dy2] = P(DIKE[Math.floor(DIKE.length * 0.62)][0], DIKE[Math.floor(DIKE.length * 0.62)][1]);
          L.push(<Label key="dk" x={dx2} y={dy2} dx={-16} text="范公堤" o={win(t, p[5].t0 + 2.2, p[6].s + 0.6, 0.5, 0.5) + win(t, p[9].t0, p[9].e, 0.5, 0.5)} size={26} weight={700} color="#F1E2B8" anchor="end" />);
          // 年轮年份
          if (t > p[8].s + 3 && t < p[10].s + 1.5) [[0, "约1128", 130], [14, "约1500", 190], [23, "约1600", 250], [45, "1855", 310]].forEach(([i, s, wy0]) => {
            if (ki + 0.01 < (i as number)) return;
            const [x, y] = P(...(ringAt(i as number, wy0 as number) as [number, number]));
            L.push(<Label key={"ry" + i} x={x} y={y} dx={4} text={s as string} o={0.85 * (1 - ramp(t, p[9].e, p[10].s + 1.5)) * ramp(ki, (i as number), (i as number) + 1.5)} size={19} color={COL.blue} />);
          });
          // 宽视图标注
          const wO = win(t, p[6].s + 2.0, p[8].s + 1.2, 0.8, 0.8);
          (["徐州", "淮安", "连云港", "开封"] as const).forEach((n) => { const [x, y] = pl(n); L.push(<g key={"w" + n} opacity={wO}><circle cx={x} cy={y} r={4} fill="#D8D2C0" /><Label x={x} y={y} dx={10} dy={-8} text={n === "开封" ? "开封方向" : n} o={1} size={22} /></g>); });
          { const [x, y] = P(...(along(HH, HH_C, 0.36) as [number, number])); L.push(<Label key="hhl" x={x} y={y} dy={-18} text="黄河夺淮故道" o={wO * ramp(hhDraw, 0.5, 0.8)} size={26} weight={700} color="#BFF3F2" anchor="middle" />); }
          // 泥沙
          if (t > p[7].s - 0.3 && t < p[8].s + 2.5) {
            const sO = win(t, p[7].s - 0.3, p[8].s + 2.5, 0.8, 1.2);
            { const [ex, ey] = HH[HH.length - 1]; const g = ease(ramp(t, p[7].t0, p[7].e)); const [px, py] = P(ex + 40, ey + 60);
              L.push(<ellipse key="plume" cx={px} cy={py} rx={(40 + 160 * g) * cam.z} ry={(30 + 120 * g) * cam.z} fill="#C9A35A" opacity={sO * 0.28} filter="url(#blurS)" />); }
            SED.forEach((s, i) => {
              const life = ((t - p[7].s) * s.sp + s.ph) % 1.4;
              let wx: number, wy: number;
              if (life < 1) { [wx, wy] = along(HH, HH_C, 0.25 + 0.75 * life); }
              else { const [ex, ey] = HH[HH.length - 1]; const d = (life - 1) * 380; wx = ex + Math.cos(s.ang) * d; wy = ey + Math.sin(s.ang) * d * 1.2 + (life - 1) * 300; }
              const [x, y] = P(wx, wy);
              L.push(<circle key={"s" + i} cx={x} cy={y} r={s.r * 2.6 + 1.5} fill="#D9B970" opacity={sO * (life < 1 ? 0.85 : 0.85 * (1 - (life - 1) / 0.4))} />);
            });
          }
          // 量尺：范公堤 -> 今海岸
          const ru = ease(ramp(t, p[9].t0 + 0.8, p[9].t0 + 2.4));
          const ruO = win(t, p[9].t0 + 0.8, p[9].e + 0.2, 0.3, 0.6);
          if (ruO > 0) {
            const [r0, r1] = MAP.ruler as [number, number][];
            const [x0, y0] = P(r0[0], r0[1]); const [x1e, y1e] = P(r1[0], r1[1]);
            const x1 = x0 + (x1e - x0) * ru;
            L.push(<g key="ru" opacity={ruO}>
              <line x1={x0} y1={y0} x2={x1} y2={y1e} stroke={COL.red} strokeWidth={3} strokeDasharray="10 7" />
              <line x1={x0} y1={y0 - 14} x2={x0} y2={y0 + 14} stroke={COL.red} strokeWidth={3} />
              {ru > 0.98 ? <line x1={x1} y1={y1e - 14} x2={x1} y2={y1e + 14} stroke={COL.red} strokeWidth={3} /> : null}
              <Label x={(x0 + x1e) / 2 + 30} y={y0} dy={50} text="约 50 公里" o={ramp(ru, 0.7, 1)} size={40} weight={800} color="#F08A80" anchor="middle" />
              <Label x={x1e} y={y1e} dx={12} dy={8} text="今天的海岸" o={ramp(ru, 0.9, 1)} size={21} color="#CFC6AE" />
            </g>);
          }
          // 芦苇
          const reedO = win(t, p[10].t0 + 0.8, p[11].s + 0.6, 0.8, 0.8);
          if (reedO > 0) for (let i = 0; i < 46; i++) {
            const wx = -20 + rnd(i + 40) * 260, wy = -60 + rnd(i + 80) * 330; const [x, y] = P(wx, wy);
            const app = ramp(t, p[10].t0 + 0.8 + rnd(i) * 1.6, p[10].t0 + 1.4 + rnd(i) * 1.6);
            const sw = Math.sin(t * 1.4 + i) * 3;
            L.push(<g key={"rd" + i} opacity={reedO * app * 0.85} stroke="#A9BE8F" strokeWidth={1.6} fill="none">
              <path d={`M${x},${y} q${sw * 0.3},-10 ${sw},-20`} /><path d={`M${x + 3},${y} q${sw * 0.4},-8 ${sw + 6},-15`} /><path d={`M${x - 3},${y} q${sw * 0.2},-8 ${sw - 6},-14`} />
              <ellipse cx={x + sw} cy={y - 22} rx={1.8} ry={4} fill="#D8C99A" stroke="none" />
            </g>);
          }
          // 白驹
          const bjO = win(t, p[11].t0 + 0.6, p[11].e + 0.3, 0.5, 0.5);
          { const [x, y] = pl("白驹"); L.push(<Glow key="bj" x={x} y={y} o={bjO} />); L.push(<Label key="bjl" x={x} y={y} dx={-16} dy={-12} text="白驹" o={bjO} size={24} weight={700} anchor="end" />); }
          // 湿地片区标注
          const wetO = win(t, p[15].t0 + 1.4, p[16].e, 0.8, 0.8);
          { const [x, y] = P(330, 255); L.push(<Label key="wl1" x={x} y={y} dx={40} text="黄海湿地（示意）" o={wetO} size={22} color="#BFF3F2" />); }
          { const [x, y] = P(210, -90); L.push(<Label key="wl2" x={x} y={y} dx={40} text="黄海湿地（示意）" o={wetO} size={22} color="#BFF3F2" />); }
          // 候鸟、丹顶鹤、麋鹿
          const birdO = win(t, p[16].s, p[16].e + 0.4, 0.6, 0.8);
          if (birdO > 0) {
            const tt = t - p[16].s;
            for (let i = 0; i < 70; i++) { // 候鸟群：小 v 字沿海岸南下
              const u = ((tt * 0.05 + rnd(i + 200) * 0.9)) % 1;
              const wx = 120 + rnd(i + 300) * 140 + u * 120, wy = -380 + u * 720 + (rnd(i + 400) - 0.5) * 60;
              const [x, y] = P(wx, wy); const f = Math.sin(t * 8 + i) * 2;
              L.push(<path key={"b" + i} d={`M${x - 5},${y - 2 - f} L${x},${y} L${x + 5},${y - 2 - f}`} stroke="#E6E0CF" strokeWidth={1.4} fill="none" opacity={birdO * 0.7} />);
            }
            const [cx, cy] = pl("丹顶鹤保护区");
            for (let i = 0; i < 4; i++) { const u = clamp((tt - 1.2 - i * 0.3) / 4.5); const x = cx + 260 - u * 230 + i * 30, y = cy - 120 + u * 90 - i * 18; L.push(<g key={"cr" + i} opacity={birdO * ramp(tt, 1.2 + i * 0.3, 1.8 + i * 0.3)}><Crane x={x} y={y} s={0.75} flap={t * 5 + i} dir={-1} /></g>); }
            L.push(<Label key="cl" x={cx} y={cy} dx={-14} dy={30} text="丹顶鹤保护区" o={birdO * ramp(tt, 2, 2.6)} size={22} anchor="end" />);
            const [mx, my] = pl("麋鹿保护区");
            for (let i = 0; i < 3; i++) { const u = (tt * 0.06 + i * 0.13) % 1; L.push(<g key={"dr" + i} opacity={birdO * ramp(tt, 2.6, 3.2)}><Deer x={mx - 40 + u * 90 + i * 22} y={my + 10 + i * 16} s={0.75} ph={t * 9 + i * 1.7} /></g>); }
            L.push(<Label key="ml" x={mx} y={my} dx={-24} dy={-30} text="麋鹿保护区" o={birdO * ramp(tt, 3, 3.6)} size={22} anchor="end" />);
          }
          // 风机（位置示意）
          const wtO = win(t, p[17].t0 - 0.2, p[18].e + 2, 0.8, 1.5) * (1 - 0.5 * ramp(t, p[18].s, p[18].s + 2));
          if (wtO > 0) [[330, -130], [360, -90], [390, -50], [350, -30], [380, 10], [420, 40], [400, 90], [440, 130], [460, 170], [430, -170], [395, -210], [470, 220]].forEach(([wx, wy], i) => {
            const [x, y] = P(wx, wy);
            L.push(<Turbine key={"wt" + i} x={x} y={y} s={0.55 * Math.sqrt(cam.z)} a={t * 70 + i * 37} o={wtO * ramp(t, p[17].t0 + i * 0.12, p[17].t0 + 0.5 + i * 0.12)} />);
          });
          // 结尾：新的一圈（示意）
          const endO = ramp(t, p[18].typeEnd - 0.5, p[18].typeEnd + 1.0);
          if (endO > 0) {
            const ph = ((t - p[18].typeEnd) * 0.35) % 1;
            const R = RINGS[RINGS.length - 1];
            const d = toD(R.map((q) => { const [x, y] = P(q[0] + 10 + ph * 26, q[1]); return [x, y] as [number, number]; }));
            L.push(<path key="nr" d={d} fill="none" stroke="#BFF3F2" strokeWidth={2} strokeDasharray="8 8" opacity={endO * (1 - ph) * 0.9} />);
          }
          return L;
        })()}
      </svg>

      {/* ================= 卡片 / 卷轴 ================= */}
      <Card t={t} a={p[0].t0 + 1.0} b={p[0].e + 0.2} x={110} y={600} w={600} h={330} from={P(-10, 60)}>
        <BigNum n="1.77万" unit="平方公里" sub="江苏面积最大的地级市" />
        <svg width={600} height={120} style={{ position: "absolute", left: 0, bottom: 0 }}>
          <rect x={430} y={60} width={170} height={60} fill="#1E5050" />
          <line x1={20} y1={60} x2={432} y2={60} stroke="#CCBA92" strokeWidth={3} />
          {[60, 120, 210, 300, 360].map((x, i) => <path key={i} d={`M${x},60 l0,-12 l8,-7 l8,7 l0,12`} fill="#CCBA92" opacity={0.8} />)}
          <text x={22} y={96} fontSize={19} fill="#9D9A8F" fontFamily={SANS}>西</text><text x={410} y={96} fontSize={19} fill="#9D9A8F" fontFamily={SANS}>东</text>
          <text x={590} y={114} fontSize={18} fill="#B9B4A6" fontFamily={SANS} textAnchor="end">地势剖面 · 示意</text>
        </svg>
      </Card>
      <Card t={t} a={p[3].t0 + 0.6} b={p[3].e + 0.3} x={1290} y={560} w={570} h={360} from={pl("盐城")} note="示意">
        <SaltScene t={t} w={570} h={360} />
        <div style={{ position: "absolute", left: 24, top: 18, fontSize: 26, color: "#E4DFD0" }}>煮海为盐</div>
      </Card>
      {/* 卷轴：《民国续修盐城县志》 */}
      {(() => {
        const o = win(t, p[5].t0 + 2.6, p[5].e + 0.3, 0.5, 0.4);
        if (o <= 0) return null;
        const u = easeOut(ramp(t, p[5].t0 + 2.6, p[5].t0 + 3.6));
        const cols = ["范公堤则东冈也", "海滨冈脊高于内地", "唐宋筑捍海堰", "皆循冈脊为之"];
        const W = 470, H = 400, X = 150, Y = 545;
        const rot = (t - p[5].t0) * 6;
        return (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <g transform={`translate(${X + W / 2},${Y + H / 2}) rotate(${rot})`} opacity={0.22 * u}>
                {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M0,0 L${Math.cos((i / 16) * 6.283) * 520},${Math.sin((i / 16) * 6.283) * 520} L${Math.cos((i / 16 + 0.025) * 6.283) * 520},${Math.sin((i / 16 + 0.025) * 6.283) * 520} Z`} fill="#E8D9B0" />)}
              </g>
            </svg>
            <div style={{ position: "absolute", left: X + (W / 2) * (1 - u), top: Y, width: W * u, height: H, background: "#C9B98F", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>
              <div style={{ position: "absolute", right: 34, top: 26, display: "flex", flexDirection: "row-reverse", gap: 30 }}>
                {cols.map((c, i) => (
                  <div key={i} style={{ writingMode: "vertical-rl", fontFamily: "SerifHeavy", fontSize: 40, lineHeight: "44px", color: "#2A2118", letterSpacing: 4, opacity: ramp(t, p[5].t0 + 3.2 + i * 0.35, p[5].t0 + 3.7 + i * 0.35) }}>{c}</div>
                ))}
              </div>
            </div>
            <div style={{ position: "absolute", left: X + (W / 2) * (1 - u) - 16, top: Y - 14, width: 16, height: H + 28, background: "#422B1D", borderRadius: 4 }} />
            <div style={{ position: "absolute", left: X + (W / 2) * (1 + u), top: Y - 14, width: 16, height: H + 28, background: "#422B1D", borderRadius: 4 }} />
            <div style={{ position: "absolute", left: X, top: Y + H + 22, width: W + 20, fontFamily: SANS, fontSize: 20, color: "#B4AE9E", opacity: u }}>《民国续修盐城县志》</div>
          </div>
        );
      })()}
      <Card t={t} a={p[7].t0 + 0.8} b={p[7].e + 0.3} x={110} y={600} w={560} h={250}>
        <BigNum n="727" unit="年" sub={"1128 年黄河夺淮入海\n1855 年改道北归"} />
      </Card>
      <Card t={t} a={p[8].typeEnd - 0.2} b={p[8].e + 0.3} x={110} y={600} w={600} h={300} from={P(160, 60)}>
        <BigNum n="约1.2万" unit="平方公里" sub={"1128—1855 年间新成陆\n范公堤以东约 0.5 万 + 废黄河三角洲约 0.7 万"} src="据鲍俊林（江苏省地方志办公室）" />
      </Card>
      <Card t={t} a={p[11].t0 + 1.0} b={p[11].e + 0.3} x={1290} y={110} w={570} h={360} from={pl("白驹")} note="相传 · 示意">
        <StudyScene t={t} w={570} h={360} />
        <div style={{ position: "absolute", left: 24, top: 18, fontSize: 26, color: "#E4DFD0" }}>施耐庵 · 《水浒传》</div>
      </Card>
      <Card t={t} a={p[12].t0 + 1.2} b={p[13].e + 0.3} x={1290} y={110} w={570} h={300} from={pl("盐城")}>
        <BigNum n="1941.1.25" unit="" sub={t < p[13].s ? "新四军在盐城召开\n重建军部大会" : "陈毅任代理军长\n刘少奇任政治委员"} src="来源：盐城市史志网" />
      </Card>
      <Card t={t} a={p[14].t0 + 1.4} b={p[14].e + 0.3} x={110} y={600} w={560} h={290} from={P(...(along(COAST_NS, COAST_C, 0.55) as [number, number]))}>
        <BigNum n="582" unit="公里" sub={"海岸线长度，江苏第一\n占全省 56%"} src="来源：盐城市人民政府 · 市情" />
      </Card>
      <Card t={t} a={p[15].t0 + 1.6} b={p[15].e + 0.3} x={1290} y={110} w={570} h={290}>
        <BigNum n="2019" unit="年" sub={"中国黄（渤）海候鸟栖息地（第一期）\n列入《世界遗产名录》"} src="来源：UNESCO 43 COM 8B.3" />
      </Card>
      <Card t={t} a={p[17].t0 + 0.8} b={p[17].e + 0.3} x={1290} y={110} w={570} h={280}>
        <BigNum n="1121万" unit="千瓦" sub={"2025 年底全市风电总装机"} src="来源：盐城市统计局" />
      </Card>

      {/* ================= 时间轴 ================= */}
      {(() => {
        const o = timelineVis(t);
        if (o <= 0) return null;
        const X0 = 400, X1 = 1560, Y = 984;
        const yx = (y: number) => X0 + ((y + 300) / 2400) * (X1 - X0);
        const yr = yearAt(t);
        const ROW = [0, 0, 0, 1, 0, 1, 2];
        const marks: [number, string, boolean, number][] = [
          [-119, "前119 盐渎", false, p[3].s + 1.4], [411, "411 盐城", false, p[4].t0 + 2.0], [1028, "1028 范公堤", false, p[5].s + 1.8],
          [1128, "1128 夺淮", true, p[6].t0], [1855, "1855 北归", false, p[7].e - 0.6], [1941, "1941", true, p[12].t0 + 0.5], [2019, "2019", false, p[15].t0 + 1.0],
        ];
        const ticks = [[-200, "前200"], [0, "0"], [500, "500"], [1000, "1000"], [1500, "1500"], [2000, "2000"]] as [number, string][];
        return (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o }}>
            <line x1={X0 - 20} y1={Y} x2={X1 + 20} y2={Y} stroke="#8B8476" strokeWidth={1.5} />
            {Array.from({ length: 25 }).map((_, i) => { const yv = -300 + i * 100; return <line key={i} x1={yx(yv)} y1={Y - (yv % 500 === 0 ? 7 : 4)} x2={yx(yv)} y2={Y} stroke="#8B8476" strokeWidth={1.2} />; })}
            {ticks.map(([v, s]) => <text key={v} x={yx(v)} y={Y + 30} fontSize={19} fill="#9C968A" fontFamily={SANS} textAnchor="middle">{s}</text>)}
            {marks.map(([v, s, red, ta], i) => {
              const mo = ramp(t, ta, ta + 0.5);
              if (mo <= 0) return null;
              const up = i % 2 === 0;
              return (
                <g key={i} opacity={mo}>
                  <circle cx={yx(v)} cy={Y} r={6} fill={red ? COL.red : "#D8D2C0"} />
                  <text x={yx(v)} y={Y - 16 - ROW[i] * 24} fontSize={18} fill={red ? "#E07A70" : "#CFC9B8"} fontFamily={SANS} fontWeight={700} textAnchor="middle" transform={!up ? `translate(0,0)` : undefined}>{s}</text>
                </g>
              );
            })}
            <circle cx={yx(yr)} cy={Y} r={22} fill="#FFF6DE" opacity={0.16} />
            <circle cx={yx(yr)} cy={Y} r={11} fill="#FFF6DE" opacity={0.3} />
            <circle cx={yx(yr)} cy={Y} r={5.5} fill="#FFFFFF" />
          </svg>
        );
      })()}

      {/* 纸纹颗粒 + 暗角 */}
      <Img src={staticFile("grain.png")} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, mixBlendMode: "overlay", opacity: 0.42 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 55% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />

      {/* 文字 */}
      <TextLayer t={t} />

      {/* 角注 */}
      <div style={{ position: "absolute", right: 34, bottom: 22, fontFamily: SANS, fontSize: 19, color: "#A8A294", opacity: 0.85 }}>海岸线、人物等为示意</div>
      {/* 开头 0.3s 淡入、结尾淡出 */}
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(1 - ramp(t, 0, 0.25), ramp(t, DURATION - 1.2, DURATION - 0.1)) }} />
    </AbsoluteFill>
  );
};

import M from "../public/map.json";
import { PT, ease, clamp } from "./timeline";
export const MAP: any = M;
// path "M x,y L x,y ..." -> points
export const pts = (d: string): [number, number][] =>
  d.replace(/^M/, "").replace(/Z$/, "").split("L").map((s) => s.split(",").map(Number) as [number, number]);
export const RINGS = (MAP.rings as string[]).map(pts);
export const HH = pts(MAP.hh);
export const DIKE = pts(MAP.dike);
export const cum = (p: [number, number][]) => { const c = [0]; for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return c; };
export const along = (p: [number, number][], c: number[], u: number): [number, number] => {
  const L = c[c.length - 1] * clamp(u); let i = 1; while (i < c.length - 1 && c[i] < L) i++;
  const f = (L - c[i - 1]) / Math.max(1e-6, c[i] - c[i - 1]);
  return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f];
};
export const PL: Record<string, [number, number]> = MAP.places;
// ---------- camera ----------
// 状态：世界焦点 f、屏幕锚点 s、缩放 z。屏幕 = (世界 - f) * z + s
export type Cam = { fx: number; fy: number; sx: number; sy: number; z: number };
export const V: Record<string, Cam> = {
  OPEN: { fx: 40, fy: -40, sx: 1250, sy: 560, z: 1.13 },
  REG: { fx: 40, fy: -40, sx: 1250, sy: 560, z: 1.0 },
  CITY: { fx: -17, fy: 24, sx: 1190, sy: 610, z: 2.2 },
  WIDE: { fx: -17, fy: 24, sx: 1330, sy: 700, z: 0.40 },
  MID: { fx: 60, fy: 70, sx: 1180, sy: 600, z: 1.7 },
  WETS: { fx: 210, fy: 90, sx: 1180, sy: 610, z: 1.42 },
};
const p = PT;
// 盐城片当时的写法（每段一次慢动作、动作间静止）。这是反面参照，不是规定：新片运镜自由发挥，别让人头晕即可
export const MOVES: { at: number; dur: number; to: string }[] = [
  { at: 0.3, dur: 5.2, to: "REG" },
  { at: p[3].s - 0.6, dur: 4.0, to: "CITY" },
  { at: p[5].s - 0.2, dur: 4.0, to: "REG" },
  { at: p[6].s - 0.4, dur: 4.6, to: "WIDE" },
  { at: p[8].s - 0.3, dur: 4.6, to: "REG" },
  { at: p[10].s - 0.2, dur: 3.8, to: "MID" },
  { at: p[14].s - 0.2, dur: 3.8, to: "REG" },
  { at: p[15].s - 0.3, dur: 3.6, to: "WETS" },
  { at: p[18].s - 0.2, dur: 4.2, to: "OPEN" },
];
// 镜头缓动：正弦 in-out（峰值速度只有三次缓动的一半左右）
const easeCam = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
// 两个状态之间做「绕不动点缩放」：找到两端屏幕位置相同的那个世界点，整个过程只围绕它缩放，没有额外平移
const interp = (A: Cam, B: Cam, k: number): Cam => {
  const z = Math.exp(Math.log(A.z) + (Math.log(B.z) - Math.log(A.z)) * k);
  if (Math.abs(A.z - B.z) < 1e-4) return { fx: A.fx + (B.fx - A.fx) * k, fy: A.fy + (B.fy - A.fy) * k, sx: A.sx + (B.sx - A.sx) * k, sy: A.sy + (B.sy - A.sy) * k, z };
  const wx = (A.fx * A.z - B.fx * B.z + B.sx - A.sx) / (A.z - B.z);
  const wy = (A.fy * A.z - B.fy * B.z + B.sy - A.sy) / (A.z - B.z);
  const sx = (wx - A.fx) * A.z + A.sx, sy = (wy - A.fy) * A.z + A.sy;
  return { fx: wx, fy: wy, sx, sy, z };
};
export const camAt = (t: number): Cam => {
  let cur = V.OPEN;
  for (const m of MOVES) {
    if (t <= m.at) break;
    const to = V[m.to];
    const k = easeCam((t - m.at) / m.dur);
    if (t >= m.at + m.dur) { cur = to; continue; }
    cur = interp(cur, to, k);
    break;
  }
  return cur;
};
export const proj = (c: Cam, x: number, y: number): [number, number] => [(x - c.fx) * c.z + c.sx, (y - c.fy) * c.z + c.sy];

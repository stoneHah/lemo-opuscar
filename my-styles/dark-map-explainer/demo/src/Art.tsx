import React from "react";
// 扁平矢量小插画：无脸剪影小人、煮盐灶、施耐庵书案、丹顶鹤、麋鹿、风机。全部代码绘制。
const C = { ink: "#EFEADB", gold: "#CCBA92", dark: "#1A1714" };
export const Person: React.FC<{ x: number; y: number; s?: number; c?: string; lean?: number }> = ({ x, y, s = 1, c = C.ink, lean = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${lean})`}>
    <circle cx={0} cy={-62} r={9} fill={c} />
    <path d="M-10,-50 L10,-50 L14,-6 L-14,-6 Z" fill={c} />
    <rect x={-9} y={-6} width={6} height={6} fill={c} /><rect x={3} y={-6} width={6} height={6} fill={c} />
  </g>
);
export const SaltScene: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => {
  const gy = h * 0.68;
  const steam = [0, 1, 2, 3, 4, 5].map((i) => {
    const ph = ((t * 0.35 + i / 6) % 1);
    return <circle key={i} cx={w * 0.45 + Math.sin(ph * 6 + i) * 14 + (i % 2) * 30 - 15} cy={gy - 70 - ph * 120} r={10 + ph * 22} fill={C.ink} opacity={0.22 * (1 - ph)} />;
  });
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={0} y={gy} width={w} height={h - gy} fill="#4A4234" />
      <rect x={w * 0.72} y={gy} width={w * 0.28} height={h - gy} fill="#1E5050" />
      {[0, 1, 2].map((i) => <path key={i} d={`M${w * 0.74},${gy + 20 + i * 22} q12,-6 24,0 t24,0 t24,0 t24,0 t24,0 t24,0`} stroke="#58C3C5" strokeWidth={2} fill="none" opacity={0.6} transform={`translate(${Math.sin(t * 1.2 + i) * 6},0)`} />)}
      {steam}
      {/* 灶 + 盘 */}
      <path d={`M${w * 0.33},${gy} L${w * 0.36},${gy - 46} L${w * 0.54},${gy - 46} L${w * 0.57},${gy} Z`} fill="#6B5A44" />
      <rect x={w * 0.31} y={gy - 56} width={w * 0.28} height={10} rx={3} fill="#2B2A28" stroke="#8a8478" strokeWidth={1} />
      <ellipse cx={w * 0.45} cy={gy - 8} rx={22} ry={12} fill="#E9893C" opacity={0.75 + 0.2 * Math.sin(t * 9)} />
      <ellipse cx={w * 0.45} cy={gy - 8} rx={42} ry={20} fill="#E9893C" opacity={0.18} />
      {/* 人：一人搅盘、一人挑卤 */}
      <Person x={w * 0.25} y={gy} s={1.05} lean={8} />
      <line x1={w * 0.25 + 8} y1={gy - 50} x2={w * 0.36} y2={gy - 58} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <Person x={w * 0.66} y={gy} s={1.0} />
      <line x1={w * 0.66 - 34} y1={gy - 52} x2={w * 0.66 + 34} y2={gy - 52} stroke={C.ink} strokeWidth={4} />
      <path d={`M${w * 0.66 - 40},${gy - 52} l0,22 l-10,0 l2,12 l16,0 l2,-12 l-10,0`} stroke={C.ink} strokeWidth={2.5} fill="none" />
      <path d={`M${w * 0.66 + 40},${gy - 52} l0,22 l-10,0 l2,12 l16,0 l2,-12 l-10,0`} stroke={C.ink} strokeWidth={2.5} fill="none" />
    </svg>
  );
};
export const StudyScene: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => {
  const gy = h * 0.74;
  const fl = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <radialGradient id="lamp"><stop offset="0" stopColor="#F2C46B" stopOpacity={0.55 * fl} /><stop offset="1" stopColor="#F2C46B" stopOpacity={0} /></radialGradient>
      <rect x={0} y={gy} width={w} height={h - gy} fill="#3E372C" />
      {/* 窗外芦苇 */}
      <rect x={w * 0.62} y={h * 0.16} width={w * 0.26} height={h * 0.34} fill="#20393A" stroke="#6F675A" strokeWidth={3} />
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${w * 0.63 + i * 16},${h * 0.5} q${3 + Math.sin(t + i) * 4},-40 ${6 + Math.sin(t * 0.8 + i) * 6},-${50 + (i % 3) * 14}`} stroke="#8CA88A" strokeWidth={2} fill="none" opacity={0.7} />)}
      <circle cx={w * 0.33} cy={gy - 74} r={120} fill="url(#lamp)" />
      {/* 书案 */}
      <rect x={w * 0.2} y={gy - 44} width={w * 0.42} height={8} fill="#7A6247" />
      <rect x={w * 0.22} y={gy - 36} width={6} height={36} fill="#7A6247" /><rect x={w * 0.58} y={gy - 36} width={6} height={36} fill="#7A6247" />
      <rect x={w * 0.3} y={gy - 50} width={w * 0.16} height={6} fill="#E8DFC8" />
      <rect x={w * 0.31} y={gy - 70} width={6} height={20} fill="#E8DFC8" />
      <ellipse cx={w * 0.31 + 3} cy={gy - 74} rx={4} ry={7} fill="#F6D27A" opacity={fl} />
      {/* 坐着的人：头 + 身 + 执笔手臂 */}
      <circle cx={w * 0.5} cy={gy - 108} r={13} fill={C.ink} />
      <path d={`M${w * 0.5 - 18},${gy - 92} L${w * 0.5 + 18},${gy - 92} L${w * 0.5 + 30},${gy - 6} L${w * 0.5 - 26},${gy - 6} Z`} fill={C.ink} />
      <line x1={w * 0.5 - 12} y1={gy - 80} x2={w * 0.42 + Math.sin(t * 2.2) * 6} y2={gy - 52} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      {/* 书稿堆 */}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={w * 0.21} y={gy - 52 - i * 7} width={46} height={6} fill={i % 2 ? "#D9CBA5" : "#C9B98F"} />)}
    </svg>
  );
};
export const Crane: React.FC<{ x: number; y: number; s: number; flap: number; dir?: number }> = ({ x, y, s, flap, dir = 1 }) => {
  const w = Math.sin(flap) * 14;
  return (
    <g transform={`translate(${x},${y}) scale(${s * dir},${s})`}>
      <path d={`M-30,0 Q0,-4 26,-2 L38,-6 L40,-3 L28,1 Q0,6 -30,2 Z`} fill={C.ink} />
      <path d={`M-4,-1 Q-14,${-20 - w} -38,${-26 - w * 1.4} L-30,${-18 - w} Q-14,-6 6,0 Z`} fill={C.ink} />
      <path d={`M-38,${-26 - w * 1.4} L-30,${-18 - w} L-46,${-22 - w * 1.5} Z`} fill="#111" />
      <path d={`M-4,2 Q-14,${18 + w} -36,${22 + w * 1.3} L-28,${14 + w} Q-14,6 6,1 Z`} fill="#E3DDCD" />
      <circle cx={36} cy={-5} r={2.2} fill="#CE5E54" />
      <line x1={-30} y1={1} x2={-48} y2={3} stroke="#111" strokeWidth={2} />
    </g>
  );
};
export const Deer: React.FC<{ x: number; y: number; s: number; ph: number }> = ({ x, y, s, ph }) => {
  const b = Math.abs(Math.sin(ph)) * 4;
  const l = Math.sin(ph) * 9;
  return (
    <g transform={`translate(${x},${y - b * s}) scale(${s})`}>
      <ellipse cx={0} cy={-26} rx={22} ry={10} fill={C.gold} />
      <path d="M18,-30 L30,-46 L36,-44 L26,-26 Z" fill={C.gold} />
      <circle cx={34} cy={-47} r={5} fill={C.gold} />
      <path d="M33,-52 l-4,-12 m4,12 l6,-10 m-8,0 l-4,-3 m10,-1 l4,-4" stroke={C.gold} strokeWidth={2} fill="none" />
      <line x1={-14} y1={-20} x2={-14 - l} y2={0} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <line x1={-8} y1={-20} x2={-8 + l} y2={0} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <line x1={12} y1={-20} x2={12 + l} y2={0} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <line x1={17} y1={-20} x2={17 - l} y2={0} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <path d="M-22,-28 l-8,8" stroke={C.gold} strokeWidth={3} />
    </g>
  );
};
export const Turbine: React.FC<{ x: number; y: number; s: number; a: number; o?: number }> = ({ x, y, s, a, o = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
    <path d="M-2.2,0 L-1.2,-60 L1.2,-60 L2.2,0 Z" fill={C.ink} />
    <g transform={`translate(0,-60) rotate(${a})`}>
      {[0, 120, 240].map((r) => <path key={r} transform={`rotate(${r})`} d="M0,-1.6 L-1.4,-34 Q0,-37 1.6,-32 L1.6,0 Z" fill={C.ink} />)}
      <circle r={2.6} fill={C.ink} />
    </g>
  </g>
);

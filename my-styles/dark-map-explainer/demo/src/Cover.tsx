import React, { useEffect, useState } from "react";
import { AbsoluteFill, staticFile, Img, delayRender, continueRender } from "remotion";
import { MAP, PL } from "./geo";
const SANS = "'Noto Sans CJK SC', sans-serif";
type L = { w: number; h: number; z: number; sx: number; sy: number; fs: number; tx: number; ty: number; sub: number };
export const Cover: React.FC<{ v: "34" | "43" }> = ({ v }) => {
  const [hd] = useState(() => delayRender("font"));
  useEffect(() => {
    const f = new FontFace("SerifHeavy", `url(${staticFile("fonts/NotoSerifSC-Black.otf")})`, { weight: "900" });
    f.load().then((ff) => { (document as any).fonts.add(ff); return (document as any).fonts.ready; }).then(() => continueRender(hd)).catch(() => continueRender(hd));
  }, [hd]);
  const Lt: L = v === "34" ? { w: 1080, h: 1440, z: 1.32, sx: 690, sy: 900, fs: 128, tx: 80, ty: 120, sub: 40 } : { w: 1440, h: 1080, z: 1.08, sx: 1020, sy: 560, fs: 120, tx: 80, ty: 150, sub: 38 };
  const fx = 40, fy = -40;
  const tr = `translate(${Lt.sx - fx * Lt.z},${Lt.sy - fy * Lt.z}) scale(${Lt.z})`;
  const NS = { vectorEffect: "non-scaling-stroke" as const, fill: "none" };
  const yc = PL["盐城"]; const ycx = (yc[0] - fx) * Lt.z + Lt.sx, ycy = (yc[1] - fy) * Lt.z + Lt.sy;
  const [r0, r1] = MAP.ruler as [number, number][];
  const P = (q: [number, number]) => [(q[0] - fx) * Lt.z + Lt.sx, (q[1] - fy) * Lt.z + Lt.sy];
  const [ax, ay] = P(r0), [bx, by] = P(r1);
  const ln = (s: string, k: number, hl?: [number, number]) => (
    <div style={{ height: Lt.fs * 1.28, whiteSpace: "nowrap" }}>
      {[...s].map((c, i) => {
        const on = hl && i >= hl[0] && i < hl[1];
        return <span key={i} style={{ color: on ? "#CE5E54" : "#EFEADB", position: "relative", display: "inline-block",
          borderBottom: on ? `${Math.round(Lt.fs * 0.07)}px solid #CE5E54` : undefined, paddingBottom: on ? 2 : 0 }}>{c}</span>;
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#0E1C20", overflow: "hidden" }}>
      <svg width={Lt.w} height={Lt.h} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="deep" gradientUnits="userSpaceOnUse" x1={250} y1={0} x2={1500} y2={600}><stop offset="0" stopColor="#173A3A" /><stop offset="1" stopColor="#0D1A1D" /></linearGradient></defs>
        <g transform={tr}>
          <rect x={-6000} y={-4000} width={12000} height={9000} fill="url(#deep)" />
          <path d={MAP.land} fill="#37312A" />
          <path d={MAP.js} fill="#3B352C" />
          <path d={MAP.yc} fill="#433B2F" />
          <path d={MAP.net} {...NS} stroke="#4A7C7A" strokeWidth={0.7} opacity={0.35} />
          <path d={MAP.maj} {...NS} stroke="#5E9A98" strokeWidth={1.3} opacity={0.7} />
          {(MAP.rings as string[]).map((d, i) => <path key={i} d={d} {...NS} stroke="#8CCBD2" strokeWidth={i % 6 === 0 ? 1.6 : 0.8} opacity={0.25 + 0.5 * (i / 47)} />)}
          <path d={MAP.coast} {...NS} stroke="#58C3C5" strokeWidth={12} opacity={0.22} />
          <path d={MAP.coast} {...NS} stroke="#BFF3F2" strokeWidth={3} />
          <path d={MAP.dike} {...NS} stroke="#CCBA92" strokeWidth={14} opacity={0.25} />
          <path d={MAP.dike} {...NS} stroke="#F1E2B8" strokeWidth={3.4} />
          <path d={MAP.yc} {...NS} stroke="#BDB298" strokeWidth={1.6} opacity={0.8} />
        </g>
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#CE5E54" strokeWidth={4} strokeDasharray="12 8" />
        <line x1={ax} y1={ay - 16} x2={ax} y2={ay + 16} stroke="#CE5E54" strokeWidth={4} />
        <line x1={bx} y1={by - 16} x2={bx} y2={by + 16} stroke="#CE5E54" strokeWidth={4} />
        <circle cx={ycx} cy={ycy} r={36} fill="#CCBA92" opacity={0.15} /><circle cx={ycx} cy={ycy} r={8} fill="#FFF6DE" />
        <text x={(ax + bx) / 2 + 20} y={ay + 62} fill="#F08A80" fontSize={46} fontWeight={800} fontFamily={SANS} textAnchor="middle" style={{ paintOrder: "stroke", stroke: "rgba(10,8,6,0.8)", strokeWidth: 6 }}>约 50 公里</text>
        <text x={ycx - 20} y={ycy - 22} fill="#EFEADB" fontSize={34} fontWeight={700} fontFamily={SANS} textAnchor="end" style={{ paintOrder: "stroke", stroke: "rgba(10,8,6,0.8)", strokeWidth: 6 }}>范公堤 · 盐城</text>
      </svg>
      <Img src={staticFile("grain.png")} style={{ position: "absolute", inset: 0, width: Lt.w, height: Lt.h, objectFit: "cover", mixBlendMode: "overlay", opacity: 0.42 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 60% 55%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)" }} />
      <div style={{ position: "absolute", left: -200, top: -200, width: Lt.w * 0.95, height: Lt.h * (v === "34" ? 0.62 : 0.95),
        background: "radial-gradient(ellipse 55% 50% at 45% 45%, rgba(14,11,8,0.85), rgba(14,11,8,0.5) 55%, rgba(14,11,8,0) 100%)" }} />
      <div style={{ position: "absolute", left: Lt.tx, top: Lt.ty, fontFamily: "SerifHeavy", fontWeight: 900, fontSize: Lt.fs, lineHeight: `${Lt.fs * 1.28}px`, letterSpacing: 4, textShadow: "0 6px 20px rgba(0,0,0,0.85)" }}>
        {ln("盐城，", 0)}{ln("是从海里", 1)}{ln("长出来的", 2, [0, 3])}
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: Lt.sub, lineHeight: `${Lt.sub * 1.5}px`, color: "#8CCBD2", letterSpacing: 2, marginTop: 18 }}>近千年，海岸线向东推了约 50 公里</div>
      </div>
      <div style={{ position: "absolute", left: Lt.tx, bottom: v === "34" ? 90 : 70, display: "flex", alignItems: "center", gap: 16, padding: "14px 26px", borderRadius: 14,
        background: "rgba(37,50,56,0.94)", border: "2px solid rgba(134,221,253,0.6)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", fontFamily: "'Noto Sans Mono CJK SC', monospace" }}>
        <span style={{ color: "#86DDFD", fontSize: 40, fontWeight: 700 }}>{"</>"}</span>
        <span style={{ color: "#EFEADB", fontSize: 38, fontWeight: 700, fontFamily: SANS }}>代码生成</span>
        <span style={{ color: "#9D9A8F", fontSize: 26 }}>TypeScript · Remotion · SVG</span>
      </div>
    </AbsoluteFill>
  );
};

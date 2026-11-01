import React from "react";
import { PT, CPS, easeOut, ramp, clamp, isPunct } from "./timeline";
const COL = { n: "#EFEADB", b: "#8CCBD2", r: "#CE5E54" } as const;
const mix = (a: string, b: string, k: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};
// 手绘下划线（略带起伏），pathLength=1 用 dashoffset 描出
const Under: React.FC<{ w: number; color: string; k: number; seed: number }> = ({ w, color, k, seed }) => {
  const j = (i: number) => Math.sin(seed * 12.9 + i * 3.1) * 2.2;
  const d = `M2,${8 + j(1)} C${w * 0.3},${5 + j(2)} ${w * 0.6},${11 + j(3)} ${w - 2},${7 + j(4)}`;
  return (
    <svg width={w} height={16} style={{ position: "absolute", left: 0, bottom: -10, overflow: "visible" }}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - k} opacity={0.95} />
    </svg>
  );
};
export const TextLayer: React.FC<{ t: number }> = ({ t }) => {
  const idx = PT.findIndex((p) => t >= p.s && t < p.e + 0.35);
  if (idx < 0) return null;
  const P = PT[idx];
  const out = 1 - ramp(t, P.e, P.e + 0.35);
  const back = Math.min(ramp(t, P.t0 - 0.2, P.t0 + 0.3), out);
  let ci = 0;
  return (
    <>
      <div style={{ position: "absolute", left: -260, top: -240, width: 1500, height: 1050, opacity: back * 0.9,
        background: "radial-gradient(ellipse 50% 46% at 45% 47%, rgba(14,11,8,0.78), rgba(14,11,8,0.45) 55%, rgba(14,11,8,0) 100%)" }} />
      <div style={{ position: "absolute", left: 110, top: 72, opacity: out, fontFamily: "SerifHeavy", fontWeight: 900, fontSize: 70, lineHeight: "110px", letterSpacing: 2 }}>
        {P.lines.map((ln, li) => (
          <div key={li} style={{ whiteSpace: "nowrap", height: 110 }}>
            {ln.map((sg, si) => {
              const chars = [...sg.t];
              const startI = ci;
              ci += chars.length;
              const tEndSeg = P.t0 + (startI + chars.length) * CPS;
              const uk = sg.c === "n" ? 0 : easeOut(ramp(t, tEndSeg + 0.05, tEndSeg + 0.55));
              const nonP = chars.filter((c) => !isPunct(c)).length;
              return (
                <span key={si} style={{ position: "relative", display: "inline-block" }}>
                  {chars.map((ch, k) => {
                    const ti = P.t0 + (startI + k) * CPS;
                    const a = easeOut(ramp(t, ti, ti + 0.3));
                    const vis = t >= ti;
                    const target = COL[sg.c];
                    return (
                      <span key={k} style={{ display: "inline-block", opacity: vis ? 0.25 + 0.75 * a : 0, transform: `scale(${1.6 - 0.6 * a})`, transformOrigin: "50% 60%",
                        filter: a < 1 ? `blur(${(1 - a) * 5}px)` : undefined, color: mix("#9A968C", target, a),
                        textShadow: "0 3px 10px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.6)" }}>{ch}</span>
                    );
                  })}
                  {sg.c !== "n" && uk > 0 ? <Under w={chars.length * 72 - 6} color={COL[sg.c]} k={uk} seed={li * 7 + si} /> : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

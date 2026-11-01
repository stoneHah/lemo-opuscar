import { PT, CPS, DURATION, isPunct } from "../src/timeline";
import { MOVES } from "../src/geo";
const p = PT;
const chars: number[] = []; const under: number[] = [];
for (const P of PT) { let ci = 0; for (const ln of P.lines) for (const sg of ln) { const cs = [...sg.t]; cs.forEach((c, k) => { if (!isPunct(c)) chars.push(P.t0 + (ci + k) * CPS); }); ci += cs.length; if (sg.c !== "n") under.push(P.t0 + ci * CPS + 0.05); } }
const cards = [p[0].t0 + 1.0, p[3].t0 + 0.6, p[7].t0 + 0.8, p[8].typeEnd - 0.2, p[11].t0 + 1.0, p[12].t0 + 1.2, p[14].t0 + 1.4, p[15].t0 + 1.6, p[17].t0 + 0.8];
const ev = { dur: DURATION, chars, under, cards, scroll: p[5].t0 + 2.6, moves: MOVES.map((m) => [m.at, m.dur]),
  river: [p[6].t0 - 0.6, 3.6], sed: [p[7].s, p[7].e - p[7].s], rings: [p[8].s + 3.0, 8.0], ruler: p[9].t0 + 0.8, net: p[10].t0 - 0.6, red: p[12].t0 + 0.4, coast: p[14].t0 + 0.2,
  birds: p[16].s, wind: p[17].t0, end: p[18].typeEnd };
console.log(JSON.stringify(ev));

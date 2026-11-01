import { camAt, proj, MOVES } from "../src/geo";
import { DURATION } from "../src/timeline";
const dt = 1 / 30; let mz = 0, mp = 0, mzT = 0, mpT = 0;
const rows: string[] = [];
for (const m of MOVES) {
  let z = 0, pp = 0;
  for (let t = m.at; t < m.at + m.dur; t += dt) {
    const a = camAt(t), b = camAt(t + dt);
    const zr = Math.abs(Math.log(b.z / a.z)) / dt;
    // 屏幕中心那一点的世界坐标，在下一帧落到哪
    const wx = (960 - a.sx) / a.z + a.fx, wy = (540 - a.sy) / a.z + a.fy;
    const [x2, y2] = proj(b, wx, wy);
    const pr = Math.hypot(x2 - 960, y2 - 540) / dt;
    // 平移分量：去掉缩放引起的位移 → 用焦点屏幕位置变化 + 一阶近似，这里直接报中心点合成速度
    z = Math.max(z, zr); pp = Math.max(pp, pr);
  }
  rows.push(`${m.to}\t${m.at.toFixed(1)}s\t${m.dur}s\t峰值缩放 ${(Math.exp(z) - 1) * 100 | 0}%/s\t中心点峰值位移 ${pp | 0}px/s(1080p)`);
  if (z > mz) { mz = z; mzT = m.at; } if (pp > mp) { mp = pp; mpT = m.at; }
}
console.log(rows.join("\n"));
console.log(`MAX zoom ${((Math.exp(mz) - 1) * 100).toFixed(0)}%/s @${mzT.toFixed(1)}s ; MAX pan ${mp.toFixed(0)}px/s @${mpT.toFixed(1)}s ; moves ${MOVES.length}, total ${MOVES.reduce((a, m) => a + m.dur, 0).toFixed(1)}s of ${DURATION.toFixed(1)}s`);

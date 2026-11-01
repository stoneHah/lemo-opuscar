// 全片时间轴：屏幕文字 = 讲述。每页 = 一个节拍；所有画面事件都挂在页的起止时间上。
export const FPS = 30;
export const CPS = 0.13; // 每字秒数（阅读速度打字）
// 标记：[b:蓝色强调] [r:红色强调]，| 换行
export const PAGES: { text: string; extra?: number; pre?: number }[] = [
  { text: "盐城[r:一万七千平方公里]，|连[r:一座山]都没有。", pre: 0.5, extra: 1.0 },        // 0
  { text: "因为[b:一千年前]，|它的大半|还泡在[b:黄海]里。", extra: 1.2 },                  // 1
  { text: "这片地，|是[r:从海里长出来]的。", extra: 1.8 },                                // 2
  { text: "[b:两千多年前]，|人们就在这里|[b:煮海为盐]。", extra: 1.6, pre: 0.6 },          // 3
  { text: "西汉叫[b:盐渎]，|东晋改名[b:盐城]。", extra: 0.8 },                             // 4
  { text: "北宋，[b:范仲淹]|沿着海边|修起一道长堤，|后人叫它[b:范公堤]。", extra: 2.2, pre: 1.6 }, // 5
  { text: "[b:一一二八年]，|黄河南下，|[r:夺淮入海]。", extra: 1.0, pre: 2.4 },             // 6
  { text: "[r:七百多年]里，|黄土高原的泥沙|一路冲进黄海。", extra: 1.6 },                   // 7
  { text: "海岸线|被一圈圈推向东方，|长出了|[r:上万平方公里]的新陆地。", extra: 4.0, pre: 1.6 }, // 8
  { text: "当年修在海边的|[b:范公堤]，|今天已经在|[b:内陆深处]。", extra: 1.6 },            // 9
  { text: "新长出的土地上，|[b:芦苇荡]连着[b:水网]。", extra: 1.6, pre: 1.4 },              // 10
  { text: "相传，|[b:施耐庵]就隐居在|[b:大丰白驹]，|写下了[b:《水浒传》]。", extra: 1.4 },  // 11
  { text: "[r:一九四一年]|[r:皖南事变]后，|[b:新四军]在盐城|重建军部。", extra: 1.2 },      // 12
  { text: "[b:陈毅]、[b:刘少奇]|坐镇这里，|盐城成了|华中敌后抗战的|指挥中心。", extra: 1.2 }, // 13
  { text: "今天的盐城，|海岸线|[r:五百八十二公里]，|江苏最长。", extra: 1.6, pre: 1.4 },   // 14
  { text: "这里的[b:黄海湿地]，|是中国首个|滨海湿地|[b:世界自然遗产]。", extra: 1.6 },     // 15
  { text: "每年[r:几百万只]候鸟|经过这里，|[b:丹顶鹤]在这里过冬，|[b:麋鹿]在滩涂上奔跑。", extra: 1.8 }, // 16
  { text: "全市风电装机，|超过[r:一千万千瓦]。", extra: 1.6 },                             // 17
  { text: "一座从海里|长出来的城市，|到今天，|还在一点点[b:往海里长]。", extra: 3.2, pre: 1.4 }, // 18
];
export type Seg = { t: string; c: "n" | "b" | "r" };
export type Line = Seg[];
export const parse = (s: string): Line[] =>
  s.split("|").map((ln) => {
    const out: Seg[] = [];
    const re = /\[(b|r):([^\]]+)\]|([^\[]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(ln))) out.push(m[1] ? { t: m[2], c: m[1] as any } : { t: m[3], c: "n" });
    return out;
  });
const PUNCT = /[，。、《》：；]/;
export type PageT = { s: number; t0: number; typeEnd: number; e: number; lines: Line[]; n: number };
let t = 0;
export const PT: PageT[] = PAGES.map((p) => {
  const lines = parse(p.text);
  const n = lines.reduce((a, l) => a + l.reduce((b, sg) => b + [...sg.t].length, 0), 0);
  const s = t;
  const t0 = s + (p.pre ?? 0.3);
  const typeEnd = t0 + n * CPS;
  const hold = Math.min(3.0, Math.max(1.6, n * 0.09)) + (p.extra ?? 0);
  const e = typeEnd + hold;
  t = e + 0.35;
  return { s, t0, typeEnd, e, lines, n };
});
export const DURATION = t + 2.6;
export const isPunct = (ch: string) => PUNCT.test(ch);
// 缓动
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const win = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));

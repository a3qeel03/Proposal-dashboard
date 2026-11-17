import React, { useEffect, useRef, useState } from "react";
import LOGO from "./assets/logo.png";

/* AI-Powered Maintenance Predictor | MCSA & Multimodal Fault Detection
   Engineering Technology — Bahrain Polytechnic
   React + Tailwind CSS. Telemetry is simulated; swap tick() for your ESP32 WebSocket/HTTP feed. */


const C = { cy: "#38BDF8", teal: "#2DD4BF", ok: "#34D399", warn: "#FBBF24", bad: "#F87171", mut: "#94A3B8" };
const FAULTS = {
  healthy: { name: "Healthy Operation", desc: "All signatures within baseline. No action required.", I: 4.2, V: 230.5, T: 42.8, A: 0.35, PF: 0.93, K: 3.0, sb: 0.04, h: 94, col: C.ok, sev: "Normal" },
  cap: { name: "Run Capacitor Wear", desc: "Capacitance drift: raised current, low power factor, strong 2sf sidebands.", I: 4.9, V: 229.4, T: 49.5, A: 0.44, PF: 0.78, K: 3.6, sb: 0.55, h: 66, col: C.warn, sev: "Warning" },
  unb: { name: "Dynamic Rotor Unbalance", desc: "Rotating-frequency vibration rise with sidebands around the 50 Hz line.", I: 4.5, V: 230.1, T: 46.2, A: 1.02, PF: 0.9, K: 4.9, sb: 0.8, h: 48, col: C.bad, sev: "Critical" },
  flow: { name: "Flow Restriction (Throttled Valve)", desc: "Reduced hydraulic load: lower current and rising casing temperature.", I: 3.3, V: 230.3, T: 52.4, A: 0.58, PF: 0.84, K: 3.3, sb: 0.3, h: 62, col: C.warn, sev: "Warning" },
};
const KEYS = Object.keys(FAULTS);
const SEV = { Info: C.cy, Normal: C.ok, Warning: C.warn, Critical: C.bad };
const rnd = (a = 1) => (Math.random() - 0.5) * 2 * a;
const stamp = () => new Date().toLocaleTimeString("en-GB");
const lvl = (v, w, b) => (v >= b ? C.bad : v >= w ? C.warn : C.ok);
const pad = (n) => String(n).padStart(2, "0");

const CSS = `
.mcsa{font-family:Inter,Roboto,system-ui,sans-serif;color:#E2E8F0;min-height:100vh;
background:radial-gradient(900px 480px at 12% -8%,rgba(56,189,248,.10),transparent 60%),radial-gradient(800px 420px at 100% 0,rgba(45,212,191,.07),transparent 60%),#0F172A}
.mcsa .num{font-variant-numeric:tabular-nums}
.mcsa .card{background:linear-gradient(180deg,#223049,#1E293B);border:1px solid #334155;border-radius:16px;padding:20px;transition:border-color .3s;box-shadow:0 8px 24px -12px rgba(0,0,0,.45)}
.mcsa .card:hover{border-color:#475569}
.mcsa .tcard{position:relative;overflow:hidden}
.mcsa .tcard::before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:linear-gradient(90deg,#38BDF8,#2DD4BF);opacity:.7}
.mcsa .lbl{color:#94A3B8;font-size:13px}
.mcsa .bar{height:8px;border-radius:99px;background:#0F172A;overflow:hidden}
.mcsa .bar>i{display:block;height:100%;border-radius:99px;transition:width .6s ease,background .4s}
.mcsa .chip{display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:99px;background:#0F172A99;border:1px solid #334155}
.mcsa .av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:600;background:linear-gradient(135deg,#0ea5e9,#2dd4bf);color:#082f49}
.mcsa .stat{padding:8px 14px;border-radius:12px;background:#0F172A80;border:1px solid #33415588}
.mcsa .stat b{display:block;font-size:14px;font-weight:600}
.mcsa .sw{width:42px;height:24px;border-radius:99px;background:#334155;position:relative;transition:background .25s;flex:none;border:0;cursor:pointer}
.mcsa .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#E2E8F0;transition:transform .25s}
.mcsa .sw[aria-checked=true]{background:#2DD4BF}.mcsa .sw[aria-checked=true]::after{transform:translateX(18px)}
.mcsa .pulse{animation:mcsap 2s infinite}
@keyframes mcsap{0%{box-shadow:0 0 0 0 rgba(52,211,153,.5)}70%{box-shadow:0 0 0 8px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}
.mcsa button:focus-visible{outline:2px solid #38BDF8;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.mcsa *{animation:none!important;transition:none!important}}
`;

/* ---------- small components ---------- */
const Badge = ({ text, color }) => (
  <span className="text-xs px-2 py-0.5 rounded-full h-fit" style={{ color, background: color + "22" }}>{text}</span>
);

function Spark({ data, color, id, min, max }) {
  const w = 240, h = 44, n = data.length;
  if (n < 2) return <div className="h-11" />;
  const d = data
    .map((v, i) => {
      const y = Math.max(1, Math.min(h - 1, h - 2 - ((v - min) / (max - min)) * (h - 6)));
      return `${i ? "L" : "M"}${((i / (n - 1)) * w).toFixed(1)} ${y.toFixed(1)}`;
    })
    .join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${w} ${h}L0 ${h}Z`} fill={`url(#g${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function TeleCard({ title, sub, value, unit, badge, children }) {
  return (
    <div className="card tcard">
      <div className="flex justify-between">
        <div><div className="font-medium">{title}</div><div className="lbl text-xs">{sub}</div></div>
        <Badge text={badge[0]} color={badge[1]} />
      </div>
      <div className="my-3 text-4xl font-semibold num">{value}<span className="text-lg lbl ml-1">{unit}</span></div>
      {children}
    </div>
  );
}

function Spectrum({ spec }) {
  const W = 700, H = 260, pl = 36, pb = 26, pw = W - pl - 8, ph = H - pb - 10, fmax = 200;
  const X = (f) => pl + (f / fmax) * pw;
  const Y = (a) => 10 + ph - a * ph;
  const d = spec.map(([f, a], i) => `${i ? "L" : "M"}${X(f).toFixed(1)} ${Y(a).toFixed(1)}`).join("");
  const sbA = spec.length ? spec[Math.round(53.3 * 2)][1] : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="FFT spectrum">
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.cy} stopOpacity=".35" />
          <stop offset="1" stopColor={C.cy} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 50, 100, 150, 200].map((f) => (
        <g key={f}>
          <line x1={X(f)} x2={X(f)} y1="10" y2={10 + ph} stroke="#334155" strokeDasharray="3 4" />
          <text x={X(f)} y={H - 8} fill={C.mut} fontSize="11" textAnchor="middle">{f} Hz</text>
        </g>
      ))}
      {[0, 0.5, 1].map((a) => (
        <g key={a}>
          <line x1={pl} x2={W - 8} y1={Y(a)} y2={Y(a)} stroke="#334155" strokeOpacity=".5" />
          <text x={pl - 6} y={Y(a) + 4} fill={C.mut} fontSize="10" textAnchor="end">{a}</text>
        </g>
      ))}
      <rect x={X(41)} y="10" width={X(59) - X(41)} height={ph} fill={C.warn} opacity=".08" rx="6" />
      {d && <path d={`${d}L${X(fmax)} ${10 + ph}L${pl} ${10 + ph}Z`} fill="url(#fg)" />}
      <path d={d} fill="none" stroke={C.cy} strokeWidth="1.8" strokeLinejoin="round" />
      <text x={X(50) + 8} y="22" fill="#E2E8F0" fontSize="11">50 Hz fundamental</text>
      <text x={X(53.3) + 30} y={Y(sbA) - 8} fill={C.warn} fontSize="10">sidebands 50 ± 3.3 Hz</text>
    </svg>
  );
}

function makeSpectrum(sb, run) {
  const pk = [[50, 0.92], [100, 0.12], [150, 0.2 + sb * 0.1], [46.7, 0.1 + sb * 0.5], [53.3, 0.1 + sb * 0.5], [43.4, 0.04 + sb * 0.2], [56.6, 0.04 + sb * 0.2], [25, 0.03 + sb * 0.08]];
  const out = [];
  for (let f = 0; f <= 200; f += 0.5) {
    let a = 0.015 + Math.random() * 0.012;
    for (const [c, h] of pk) a += h * Math.exp(-((f - c) ** 2) / (2 * 0.55 ** 2));
    out.push([f, run ? Math.min(a, 1) : 0.01 * Math.random()]);
  }
  return out;
}

/* ---------- main component ---------- */
export default function MCSADashboard() {
  const [fault, setFaultState] = useState("healthy");
  const [trip, setTripState] = useState(false);
  const [log, setLog] = useState(() => [
    { id: 1, time: stamp(), sev: "Normal", ev: "Baseline model loaded · all classes healthy", act: "Monitoring" },
    { id: 0, time: stamp(), sev: "Info", ev: "ESP32 data acquisition unit connected", act: "Streaming 4 channels" },
  ]);
  const [m, setM] = useState(null);

  const faultR = useRef("healthy");
  const tripR = useRef(false);
  const sim = useRef({ c: { I: 4.2, V: 230.5, A: 0.35, PF: 0.93, K: 3, h: 94, sb: 0.04 }, T: 42.8, aI: [], aV: [], aA: [], probs: [1, 0, 0, 0], t: 0, tw: false });

  const addLog = (sev, ev, act) =>
    setLog((l) => [{ id: Math.random(), time: stamp(), sev, ev, act }, ...l].slice(0, 12));

  const doTrip = (auto) => {
    const next = !tripR.current;
    tripR.current = next;
    setTripState(next);
    if (next) addLog("Critical", auto ? "Vibration above 0.9 g trip limit" : "Operator emergency shutdown", auto ? "Relay tripped automatically" : "Relay tripped manually");
    else addLog("Info", "Operator reset requested", "Relay closed · motor restarted");
  };

  const setFault = (k) => {
    if (k === faultR.current) return;
    faultR.current = k;
    setFaultState(k);
    const f = FAULTS[k];
    if (k === "healthy") addLog("Normal", "Signatures returned to baseline", "Fault simulation cleared");
    else addLog(f.sev, `${f.name} signature detected`, tripR.current ? "Motor already tripped" : "Alert raised · monitoring");
    if (k === "unb" && !tripR.current) setTimeout(() => { if (faultR.current === "unb" && !tripR.current) doTrip(true); }, 6000);
  };

  useEffect(() => {
    const tick = () => {
      const s = sim.current, c = s.c, f = FAULTS[faultR.current], run = !tripR.current;
      s.t++;
      const ripple = faultR.current === "cap" ? rnd(0.35) : rnd(0.08);
      const tgt = { I: run ? f.I : 0, V: f.V, A: run ? f.A : 0.02, PF: run ? f.PF : 0, K: run ? f.K : 0, h: f.h, sb: f.sb };
      for (const x in tgt) c[x] += (tgt[x] - c[x]) * 0.35;
      const I = Math.max(0, c.I + (run ? ripple : 0));
      const V = c.V + rnd(0.5);
      const A = Math.max(0, c.A + (run ? rnd(faultR.current === "unb" ? 0.12 : 0.03) : 0));
      s.T += ((run ? f.T : 30) - s.T) * 0.05;
      [[s.aI, I], [s.aV, V], [s.aA, A]].forEach(([a, v]) => { a.push(v); if (a.length > 40) a.shift(); });
      if (run && s.T >= 48 && !s.tw) { s.tw = true; addLog("Warning", `Surface temperature ${s.T.toFixed(1)} °C above 48 °C`, "Alert raised"); }
      if (s.T < 46) s.tw = false;
      const idx = KEYS.indexOf(faultR.current), conf = 0.86 + Math.random() * 0.1;
      const raw = KEYS.map((_, i) => (i === idx ? conf : ((1 - conf) / 3) * (0.5 + Math.random())));
      const sum = raw.reduce((a, b) => a + b);
      s.probs = s.probs.map((p, i) => p + (raw[i] / sum - p) * 0.4);
      return {
        I, V, A, T: s.T, PF: c.PF, K: c.K, h: Math.round(c.h + (run ? rnd(0.6) : 0)),
        aI: [...s.aI], aV: [...s.aV], aA: [...s.aA], probs: [...s.probs], t: s.t,
        spec: makeSpectrum(c.sb, run),
      };
    };
    let last;
    for (let i = 0; i < 40; i++) last = tick();
    setM(last);
    const id = setInterval(() => setM(tick()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!m) return null;
  const f = FAULTS[fault], run = !trip, idx = KEYS.indexOf(fault);
  const hc = m.h >= 80 ? C.ok : m.h >= 55 ? C.warn : C.bad;
  const dev = m.V - 230;
  const tc = lvl(m.T, 48, 55);
  const up = `${pad(Math.floor(m.t / 3600))}:${pad(Math.floor(m.t / 60) % 60)}:${pad(m.t % 60)}`;
  const team = [["AZ", "Abdulla Zuhiar", "202301078"], ["JH", "Jasim Hayyan", "202303646"], ["AM", "Abdulla Marhoon", "202303667"]];

  return (
    <div className="mcsa">
      <style>{CSS}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Identity bar */}
        <div className="card !p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-stretch">
            <div className="bg-white px-6 py-3 flex items-center justify-center md:justify-start">
              <img alt="Bahrain Polytechnic" src={LOGO} className="h-12 w-auto" />
            </div>
            <div className="flex-1 px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="lbl mr-1">Project team</span>
              {team.map(([ini, n, id]) => (
                <div className="chip" key={id}>
                  <span className="av">{ini}</span>
                  <div className="leading-tight"><div className="text-sm font-medium">{n}</div><div className="text-[11px] lbl num">{id}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="card !p-6 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight">
              AI-Powered Maintenance Predictor <span className="text-slate-600 font-normal">|</span><br className="hidden sm:block" />{" "}
              <span style={{ color: C.cy }}>MCSA &amp; Multimodal Fault Detection</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full border border-slate-600 text-slate-300">Engineering Technology — Bahrain Polytechnic</span>
              <span className="text-xs px-3 py-1 rounded-full flex items-center gap-2" style={{ background: "rgba(52,211,153,.12)", color: C.ok }}>
                <i className="w-2 h-2 rounded-full pulse" style={{ background: C.ok }} />ESP32 Wi-Fi Connected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="stat"><span className="lbl text-xs">Test rig</span><b>Single-phase AC motor / pump</b></div>
              <div className="stat"><span className="lbl text-xs">Sampling</span><b className="num">10 kS/s · 4 channels</b></div>
              <div className="stat"><span className="lbl text-xs">Session uptime</span><b className="num">{up}</b></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-600 px-5 py-4" style={{ background: "#0F172A66" }}>
              <div className="relative w-24 h-24 flex-none">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={hc} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${m.h * 2.64} 264`} style={{ transition: "stroke-dasharray .6s, stroke .4s" }} />
                </svg>
                <div className="absolute inset-0 grid place-items-center"><div className="text-2xl font-semibold num leading-none">{m.h}<span className="text-sm lbl">%</span></div></div>
              </div>
              <div>
                <div className="lbl">System health</div>
                <div className="text-lg font-semibold" style={{ color: hc }}>{m.h >= 80 ? "Normal" : m.h >= 55 ? "Warning" : "Critical"}</div>
                <div className="lbl text-xs mt-1">Fused from 4 sensors<br />and the AI classifier</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => doTrip(false)}
                className="rounded-xl px-5 py-4 text-sm font-semibold transition hover:brightness-125"
                style={{ background: trip ? "rgba(52,211,153,.14)" : "rgba(248,113,113,.14)", color: trip ? C.ok : C.bad, border: `1px solid ${trip ? "rgba(52,211,153,.55)" : "rgba(248,113,113,.55)"}` }}
              >
                {trip ? "RESET RELAY / RESTART MOTOR" : "EMERGENCY SHUTDOWN / TRIP RELAY"}
              </button>
              <div className="text-xs lbl flex items-center gap-2">Relay: <b style={{ color: trip ? C.bad : C.ok }}>{trip ? "OPEN · motor de-energised" : "CLOSED · motor energised"}</b></div>
            </div>
          </div>
        </header>

        {/* Telemetry */}
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <TeleCard title="Current" sub="ACS712" value={m.I.toFixed(1)} unit="A" badge={m.I > 4.7 ? ["High", C.warn] : run ? ["Normal", C.ok] : ["Off", C.mut]}>
            <Spark data={m.aI} color={C.cy} id="I" min={0} max={6} />
          </TeleCard>
          <TeleCard title="Voltage" sub="ZMPT101B" value={m.V.toFixed(1)} unit="V" badge={Math.abs(dev) < 3 ? ["Stable", C.ok] : ["Drifting", C.warn]}>
            <div className="flex justify-between lbl text-xs mb-1.5"><span>Deviation from 230 V</span><span className="num">{dev >= 0 ? "+" : ""}{dev.toFixed(1)} V</span></div>
            <Spark data={m.aV} color={C.teal} id="V" min={226} max={234} />
          </TeleCard>
          <TeleCard title="Temperature" sub="GY-906 IR" value={m.T.toFixed(1)} unit="°C" badge={m.T >= 55 ? ["Over limit", C.bad] : m.T >= 48 ? ["Warning", C.warn] : ["Normal", C.ok]}>
            <div className="flex justify-between lbl text-xs mb-2"><span>Warn 48 °C · Trip 55 °C</span><span className="num">{Math.round((m.T / 70) * 100)}% of 70 °C scale</span></div>
            <div className="bar"><i style={{ width: `${Math.min(100, (m.T / 70) * 100)}%`, background: tc }} /></div>
            <div className="text-xs mt-2" style={{ color: tc }}>{m.T >= 55 ? "Threshold exceeded" : m.T >= 48 ? "Approaching alarm threshold" : "Below alarm threshold"}</div>
          </TeleCard>
          <TeleCard title="Vibration" sub="MPU6050 · 3-axis RMS" value={m.A.toFixed(2)} unit="g" badge={m.A > 0.9 ? ["Critical", C.bad] : m.A > 0.5 ? ["Elevated", C.warn] : ["Normal", C.ok]}>
            <Spark data={m.aA} color={C.cy} id="A" min={0} max={1.4} />
          </TeleCard>
        </section>

        {/* MCSA */}
        <section className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <div><h2 className="font-semibold">MCSA current spectrum (FFT)</h2><div className="lbl">Stator current, 0–200 Hz · fundamental 50 Hz · sidebands at 50 ± 2sf</div></div>
              <div className="flex gap-3 text-xs lbl items-center">
                <span className="flex items-center gap-1"><i className="w-3 h-1 rounded" style={{ background: C.cy }} />Spectrum</span>
                <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm" style={{ background: "rgba(251,191,36,.35)" }} />Sidebands</span>
              </div>
            </div>
            <Spectrum spec={m.spec} />
          </div>
          <div className="card">
            <h2 className="font-semibold">Time-domain features</h2><div className="lbl mb-4">Computed on a 1 s window</div>
            <div className="grid gap-3">
              {[
                ["RMS current", run ? m.I.toFixed(2) : "0.00", "A", Math.min(100, (m.I / 6) * 100), C.cy],
                ["Kurtosis", m.K.toFixed(2), "—", Math.min(100, (m.K / 6) * 100), m.K > 4.5 ? C.bad : m.K > 3.5 ? C.warn : C.cy],
                ["Power factor", m.PF.toFixed(2), "cos φ", m.PF * 100, m.PF < 0.8 ? C.warn : C.cy],
              ].map(([n, v, u, w, col]) => (
                <div key={n} className="rounded-xl p-4 border border-slate-700" style={{ background: "#0F172A55" }}>
                  <div className="lbl">{n}</div>
                  <div className="flex items-baseline gap-2"><span className="text-3xl font-semibold num">{v}</span><span className="lbl text-sm">{u}</span></div>
                  <div className="bar mt-2"><i style={{ width: `${w}%`, background: col }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI */}
        <section className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="card">
            <div className="lbl">Detected operating state</div>
            <div className="text-2xl font-semibold mt-1 mb-1" style={{ color: f.col }}>{f.name}</div>
            <div className="text-sm lbl mb-4">{run ? f.desc : "Motor tripped. Classifier holding the last detected state."}</div>
            <div className="flex items-center gap-2 text-sm">
              <i className="w-2.5 h-2.5 rounded-full" style={{ background: f.col }} />
              <span className="lbl">Model confidence</span>
              <b className="num ml-auto">{(m.probs[idx] * 100).toFixed(1)}%</b>
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold">Classifier probabilities</h2><div className="lbl mb-4">Random Forest · SVM ensemble</div>
            <div className="space-y-4">
              {KEYS.map((k, i) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1.5"><span>{FAULTS[k].name}</span><b className="num">{(m.probs[i] * 100).toFixed(1)}%</b></div>
                  <div className="bar"><i style={{ width: `${m.probs[i] * 100}%`, background: i === idx ? FAULTS[k].col : "#475569" }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold">Fault injection simulator</h2><div className="lbl mb-4">Only one fault can be active at a time</div>
            <div className="space-y-4">
              {KEYS.slice(1).map((k) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <div><div className="text-sm font-medium">{FAULTS[k].name}</div><div className="lbl text-xs">Simulate {FAULTS[k].sev.toLowerCase()} condition</div></div>
                  <button className="sw" role="switch" aria-checked={fault === k} aria-label={FAULTS[k].name} onClick={() => setFault(fault === k ? "healthy" : k)} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Log */}
        <section className="card">
          <div className="flex justify-between items-center mb-3">
            <div><h2 className="font-semibold">Active protection &amp; event log</h2><div className="lbl">Anomalies, warnings and relay actions</div></div>
            <button onClick={() => setLog([])} className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700">Clear log</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead><tr className="lbl text-left border-b border-slate-700"><th className="py-2 pr-4 font-medium">Time</th><th className="pr-4 font-medium">Severity</th><th className="pr-4 font-medium">Event</th><th className="font-medium">Action</th></tr></thead>
              <tbody>
                {log.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800">
                    <td className="py-2.5 pr-4 num lbl whitespace-nowrap">{r.time}</td>
                    <td className="pr-4"><Badge text={r.sev} color={SEV[r.sev]} /></td>
                    <td className="pr-4">{r.ev}</td>
                    <td className="lbl">{r.act}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-center text-sm lbl pt-2 pb-6 space-y-2">
          <div>Engineering Technology — Bahrain Polytechnic · Project team</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 num">
            {team.map(([, n, id]) => <span key={id}>{n} (ID: {id})</span>)}
          </div>
          <div className="text-xs opacity-70">Prototype with simulated telemetry. No physical hardware is connected.</div>
        </footer>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Colors — simplified palette (fewer colors, clearer meaning) ───────────
const C = {
  bg: "#0b0e0b",
  surface: "#131813",
  card: "#1a1f1a",
  cardAlt: "#1e241e",
  border: "#2a332a",
  borderLight: "#333d33",
  // Semantic: only TWO accent colors for results (red = problem, green = good)
  bad: "#e84040",
  badDim: "rgba(232,64,64,0.10)",
  badBorder: "rgba(232,64,64,0.22)",
  good: "#2fbd56",
  goodDim: "rgba(47,189,86,0.08)",
  goodBorder: "rgba(47,189,86,0.18)",
  // UI accents
  accent: "#6cb4ff",
  accentDim: "rgba(108,180,255,0.08)",
  gold: "#d4a853",
  goldDim: "rgba(212,168,83,0.10)",
  // Text
  text: "#e4e8e4",
  textSec: "#90a090",
  textMuted: "#5a6a5a",
  white: "#fff",
};

const SHOT_BADGES = {
  shank: { icon: "⚡", color: C.bad },
  slice: { icon: "↪", color: C.bad },
  chunk: { icon: "⛏", color: C.bad },
  thin: { icon: "〰", color: C.bad },
  topped: { icon: "↗", color: C.bad },
  push: { icon: "→", color: C.textSec },
  pull: { icon: "←", color: C.textSec },
  hook: { icon: "↩", color: C.textSec },
};

// ─── Data ──────────────────────────────────────────────────────────────────
const CAUSE_CHAIN = [
  {
    phase: "Top of Backswing",
    phaseExplain: "The highest point of your backswing, just before you start the downswing. This is where your body stores power.",
    fault: "Reverse Pivot",
    icon: "⚡",
    shotBadges: ["shank", "slice", "topped"],
    description: "Weight shifted toward the target on the backswing instead of loading into the trail foot.",
    consequence: "Forces a compensating lunge forward at impact.",
    ideal: "70–80% pressure on trail foot. Head stays behind ball. Shoulders coiled 90° to spine.",
    drill: "Wall Drill",
    drillSteps: "Stand with your trail hip just touching a wall. On the backswing, feel that hip press into the wall — not pull away.",
    source: "TPI – Weight Transfer Fundamentals",
    annotations: [
      { x: 52, y: 28, label: "Head", status: "bad", note: "Drifted 3″ toward target" },
      { x: 33, y: 52, label: "Trail Hip", status: "bad", note: "Weight should load here — not shift forward" },
      { x: 53, y: 22, label: "Shoulders", status: "good", note: "90° coil to spine — good rotation" },
    ],
  },
  {
    phase: "Moment of Impact",
    phaseExplain: "The split second when the club face meets the ball. Every fault upstream shows up here.",
    fault: "Early Extension",
    icon: "💥",
    shotBadges: ["shank", "chunk", "thin"],
    description: "Hips thrusting toward the ball through impact. The club gets pushed off-plane and the hosel leads the face.",
    consequence: "The hosel reaches the ball first — that's the shank.",
    ideal: "Hips open 30–40° but stay back. Hands ahead of ball. Shaft lean at contact.",
    drill: "Glute Wall Drill",
    drillSteps: "Set up with trail glute on a wall. Maintain contact through impact. Rotate — don't slide.",
    source: "TPI – Early Extension (64% of amateurs)",
    annotations: [
      { x: 44, y: 48, label: "Hips", status: "bad", note: "+4″ toward ball — should stay back" },
      { x: 50, y: 66, label: "Hands", status: "bad", note: "Behind ball — need forward shaft lean" },
      { x: 47, y: 20, label: "Head", status: "bad", note: "Rose 2″ before contact" },
    ],
  },
  {
    phase: "Moment of Impact",
    phaseExplain: "The split second when the club face meets the ball.",
    fault: "Head Up",
    icon: "👀",
    shotBadges: ["thin", "slice"],
    description: "Head rose before the club reached the ball. Upper body lifted, shortening the arc and opening the face.",
    consequence: "Swing arc bottoms out early. Club face opens at contact.",
    ideal: "Eyes on ball position until after contact. Head stays level through the strike zone.",
    drill: "Tee Drill",
    drillSteps: "Place a tee where the ball sits. After your swing, keep your eyes on the tee until you hear the club pass. \"See the tee disappear.\"",
    source: "Hank Haney – Staying Down Through Impact",
    annotations: [
      { x: 47, y: 18, label: "Head", status: "bad", note: "Rising — stay level through contact" },
      { x: 50, y: 44, label: "Spine Angle", status: "good", note: "Maintained through swing" },
    ],
  },
];

const ALL_CHECKS = [
  { name: "Shoulder Alignment", phase: "Setup", status: "good", note: "Parallel to target line" },
  { name: "One-Piece Takeaway", phase: "Takeaway", status: "good", note: "Shoulders rotated as one unit" },
  { name: "Weight Transfer", phase: "Top of Backswing", status: "bad", note: "Reverse pivot detected" },
  { name: "Hip Position", phase: "Impact", status: "bad", note: "Early extension — hips lunging forward" },
  { name: "Head Position", phase: "Impact", status: "bad", note: "Rose before contact" },
  { name: "Balance at Finish", phase: "Follow-Through", status: "good", note: "Full rotation, balanced" },
];

// ─── Shared Components ─────────────────────────────────────────────────────
function ShotBadge({ shape }) {
  const cfg = SHOT_BADGES[shape] || { icon: "•", color: C.textSec };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      border: `1.5px solid ${cfg.color}40`, color: cfg.color, background: `${cfg.color}10`,
    }}>
      {cfg.icon} {shape.charAt(0).toUpperCase() + shape.slice(1)}
    </span>
  );
}

function ScoreRing({ score, size = 56 }) {
  const color = score > 70 ? C.good : C.bad;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score/100)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size*0.32} fontWeight={800} fontFamily="'Space Grotesk', sans-serif">{score}</text>
    </svg>
  );
}

// ─── Animated swing replay frame ───────────────────────────────────────────
function SwingReplayFrame({ phase, progress }) {
  // Swing arc points (simplified bezier path)
  const arcPoints = [
    { x: 45, y: 75 }, // address
    { x: 35, y: 55 }, // takeaway
    { x: 25, y: 25 }, // top
    { x: 35, y: 40 }, // early down
    { x: 50, y: 72 }, // impact
    { x: 65, y: 40 }, // follow through
    { x: 72, y: 25 }, // finish
  ];

  const pathD = arcPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  const totalLen = 250; // approximate
  const drawLen = totalLen * Math.min(1, progress);

  // Ball flight (only after impact, progress > 0.6)
  const ballProgress = Math.max(0, (progress - 0.65) / 0.35);
  const ballX = 52 + ballProgress * 38; // flies right (shank)
  const ballY = 72 - ballProgress * 30 + ballProgress * ballProgress * 15;

  return (
    <div style={{
      width: "100%", height: 220, background: `linear-gradient(180deg, ${C.surface} 0%, #0f150f 100%)`,
      borderRadius: 16, position: "relative", overflow: "hidden", border: `1px solid ${C.border}`,
    }}>
      {/* Ground line */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="78" x2="100" y2="78" stroke={C.border} strokeWidth="0.3" />
      </svg>

      {/* Golfer silhouette */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.25 }} viewBox="0 0 100 100">
        <circle cx="48" cy="18" r="5" fill="none" stroke={C.textSec} strokeWidth="1" />
        <line x1="48" y1="23" x2="48" y2="52" stroke={C.textSec} strokeWidth="1" />
        <line x1="38" y1="33" x2="58" y2="33" stroke={C.textSec} strokeWidth="1" />
        <line x1="48" y1="52" x2="40" y2="75" stroke={C.textSec} strokeWidth="1" />
        <line x1="48" y1="52" x2="56" y2="75" stroke={C.textSec} strokeWidth="1" />
      </svg>

      {/* Swing arc trace */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Trail (faded) */}
        <path d={pathD} fill="none" stroke={C.accent} strokeWidth="0.8" opacity={0.15}/>
        {/* Active trace */}
        <path d={pathD} fill="none" stroke={C.accent} strokeWidth="1.2"
          strokeDasharray={totalLen} strokeDashoffset={totalLen - drawLen}
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${C.accent}60)` }} />
        {/* Club head dot */}
        {progress > 0 && progress < 1 && (() => {
          const idx = Math.min(Math.floor(progress * (arcPoints.length - 1)), arcPoints.length - 2);
          const t = (progress * (arcPoints.length - 1)) - idx;
          const cx = arcPoints[idx].x + (arcPoints[idx+1].x - arcPoints[idx].x) * t;
          const cy = arcPoints[idx].y + (arcPoints[idx+1].y - arcPoints[idx].y) * t;
          return <circle cx={cx} cy={cy} r="2" fill={C.accent} style={{ filter: `drop-shadow(0 0 6px ${C.accent})` }} />;
        })()}
      </svg>

      {/* Ball flight */}
      {ballProgress > 0.05 && (
        <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Ball trail */}
          <line x1="52" y1="72" x2={ballX} y2={ballY} stroke={C.bad} strokeWidth="0.5" strokeDasharray="1,1.5" opacity={0.4} />
          {/* Ball */}
          <circle cx={ballX} cy={ballY} r="1.8" fill={C.white}
            style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.6))" }} />
        </svg>
      )}

      {/* Phase label */}
      <div style={{
        position: "absolute", bottom: 12, left: 14, right: 14,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div style={{
          padding: "5px 12px", borderRadius: 8,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{phase}</span>
        </div>
        {ballProgress > 0.5 && (
          <div style={{
            padding: "4px 10px", borderRadius: 8,
            background: C.badDim, border: `1px solid ${C.badBorder}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.bad, fontFamily: "'Space Grotesk', sans-serif" }}>
              ⚡ Ball flight: right
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Annotated video frame ─────────────────────────────────────────────────
function AnnotatedFrame({ cause }) {
  return (
    <div style={{
      width: "100%", height: 190, background: `linear-gradient(135deg, ${C.surface} 0%, #141a14 100%)`,
      borderRadius: 14, position: "relative", overflow: "hidden", border: `1px solid ${C.border}`,
    }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${C.bad}08, transparent 70%)` }} />

      {/* Golfer */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.18 }} viewBox="0 0 200 130">
        <circle cx="100" cy="22" r="9" fill="none" stroke={C.textSec} strokeWidth="1.5" />
        <line x1="100" y1="31" x2="100" y2="68" stroke={C.textSec} strokeWidth="1.5" />
        <line x1="78" y1="42" x2="122" y2="42" stroke={C.textSec} strokeWidth="1.5" />
        <line x1="100" y1="68" x2="82" y2="100" stroke={C.textSec} strokeWidth="1.5" />
        <line x1="100" y1="68" x2="118" y2="100" stroke={C.textSec} strokeWidth="1.5" />
        <line x1="122" y1="42" x2="140" y2="15" stroke={C.textSec} strokeWidth="1" />
      </svg>

      {/* Annotations */}
      {cause.annotations.map((ann, i) => {
        const col = ann.status === "good" ? C.good : C.bad;
        const isRight = ann.x > 55;
        return (
          <div key={i}>
            <div style={{
              position: "absolute", left: `${ann.x}%`, top: `${ann.y}%`,
              transform: "translate(-50%,-50%)", zIndex: 2,
              width: 10, height: 10, borderRadius: 5, background: col,
              boxShadow: `0 0 10px ${col}50`,
            }} />
            <div style={{
              position: "absolute",
              left: isRight ? undefined : `${ann.x + 4}%`,
              right: isRight ? `${100 - ann.x + 4}%` : undefined,
              top: `${ann.y - 3}%`,
              zIndex: 3, padding: "5px 9px", borderRadius: 8,
              background: `${col}12`, border: `1px solid ${col}30`,
              maxWidth: 145, backdropFilter: "blur(8px)",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: col,
                fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.02em",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {ann.status === "good" ? "✓" : "✗"} {ann.label}
              </div>
              <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.4, marginTop: 2 }}>{ann.note}</div>
            </div>
          </div>
        );
      })}

      {/* Phase label */}
      <div style={{
        position: "absolute", bottom: 8, left: 10, padding: "4px 10px",
        borderRadius: 7, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: "'Space Grotesk', sans-serif" }}>
          {cause.phase}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 1: SWING REPLAY
// ═══════════════════════════════════════════════════════════════════════════
function SwingReplayScreen({ onNavigate }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Setup");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 0.008;
        if (next >= 1.15) { setDone(true); return 1.15; }
        if (next > 0.85) setPhase("Follow-Through");
        else if (next > 0.6) setPhase("Impact");
        else if (next > 0.35) setPhase("Downswing");
        else if (next > 0.15) setPhase("Top of Backswing");
        else if (next > 0.05) setPhase("Takeaway");
        else setPhase("Setup");
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [done]);

  const replay = () => { setProgress(0); setPhase("Setup"); setDone(false); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 14px 14px" }}>
      <div style={{ textAlign: "center", padding: "20px 0 14px" }}>
        <div style={{ fontSize: 13, color: C.textMuted, letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6, textTransform: "uppercase" }}>
          Your Swing
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: C.text, lineHeight: 1.3 }}>
          Tracing the path...
        </div>
      </div>

      <SwingReplayFrame phase={phase} progress={Math.min(1, progress)} />

      {/* Phase timeline */}
      <div style={{ display: "flex", gap: 2, margin: "14px 0", padding: "0 2px" }}>
        {[
          { name: "Setup", t: 0 },
          { name: "Takeaway", t: 0.05 },
          { name: "Top", t: 0.15 },
          { name: "Down", t: 0.35 },
          { name: "Impact", t: 0.6 },
          { name: "Finish", t: 0.85 },
        ].map((p, i) => {
          const active = progress >= p.t;
          const isFault = p.name === "Top" || p.name === "Impact";
          const barColor = active ? (isFault ? C.bad : C.good) : C.border;
          return (
            <div key={p.name} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: 4, borderRadius: 2, background: barColor,
                opacity: active ? (isFault ? 1 : 0.5) : 0.3,
                transition: "all 0.3s",
              }} />
              <div style={{
                fontSize: 9, color: active ? C.textSec : C.textMuted,
                marginTop: 4, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              }}>{p.name}</div>
            </div>
          );
        })}
      </div>

      {/* Result summary (appears when done) */}
      {done && (
        <div style={{
          background: C.badDim, border: `1px solid ${C.badBorder}`, borderRadius: 14,
          padding: "16px 18px", textAlign: "center",
          animation: "fadeIn 0.5s ease",
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.bad, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
            Shank
          </div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
            Ball went right off the hosel. Two faults detected in your swing caused this.
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, paddingTop: 14 }}>
        {done ? (
          <>
            <button onClick={() => onNavigate("diagnosis")} style={{
              width: "100%", padding: 15, borderRadius: 13, border: "none",
              background: C.bad, color: C.white, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
            }}>
              See What Happened →
            </button>
            <button onClick={replay} style={{
              width: "100%", padding: 12, borderRadius: 13,
              border: `1px solid ${C.border}`, background: "none",
              color: C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Replay ↻
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: "'Space Grotesk', sans-serif" }}>
            Analyzing your swing...
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 2: DIAGNOSIS
// ═══════════════════════════════════════════════════════════════════════════
function DiagnosisScreen({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 14px 14px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "18px 0 12px" }}>
        <div style={{ fontSize: 14, color: C.textMuted, letterSpacing: "0.05em", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>
          WHAT DOES
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
          <span style={{ color: C.bad }}>Shank</span>
          <span style={{ color: C.text }}> think of your swing?</span>
        </div>
      </div>

      {/* Score + Tempo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.card, borderRadius: 13, border: `1px solid ${C.border}` }}>
          <ScoreRing score={38} size={52} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>Swing Score</div>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>3 of 5 checks assessed</div>
          </div>
        </div>
        <div style={{ width: 100, padding: "12px 14px", background: C.card, borderRadius: 13, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.good, fontFamily: "'Space Grotesk', sans-serif" }}>3:1</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>Tempo · Tour avg</div>
        </div>
      </div>

      {/* What went wrong */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em" }}>
          What Went Wrong
        </div>
        {CAUSE_CHAIN.map((cause, i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16, background: C.badDim,
                border: `1.5px solid ${C.bad}30`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 16, flexShrink: 0,
              }}>{cause.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{cause.fault}</div>
                <div style={{ fontSize: 12, color: C.textSec, fontFamily: "'Space Grotesk', sans-serif", marginTop: 1 }}>{cause.phase}</div>
              </div>
              <span style={{ fontSize: 16, color: C.textMuted }}>›</span>
            </div>
            {i < CAUSE_CHAIN.length - 1 && (
              <div style={{ width: 2, height: 10, background: C.border, marginLeft: 15 }} />
            )}
          </div>
        ))}
      </div>

      {/* All checks mini strip */}
      <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
        {["Setup", "Takeaway", "Top", "Impact", "Finish"].map((p, i) => {
          const bad = i === 2 || i === 3;
          return (
            <div key={p} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 2, background: bad ? C.bad : C.good, opacity: bad ? 1 : 0.35 }} />
              <div style={{ fontSize: 9, marginTop: 3, color: bad ? C.bad : C.textMuted, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{p}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => onNavigate("chain")} style={{
          width: "100%", padding: 15, borderRadius: 13, border: "none",
          background: C.bad, color: C.white, fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Break It Down →
        </button>
        <button onClick={() => onNavigate("fix")} style={{
          width: "100%", padding: 12, borderRadius: 13, border: `1px solid ${C.border}`,
          background: "none", color: C.textSec, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Skip to What to Fix
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 3: CAUSE CHAIN (swipeable)
// ═══════════════════════════════════════════════════════════════════════════
function CauseChainScreen({ onNavigate }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const newIdx = Math.round(el.scrollLeft / el.offsetWidth);
    if (newIdx !== idx) setIdx(newIdx);
  }, [idx]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 6px", gap: 8 }}>
        <button onClick={() => onNavigate("diagnosis")} style={{ background: "none", border: "none", color: C.textSec, fontSize: 13, cursor: "pointer", padding: "4px 6px", fontFamily: "'Space Grotesk', sans-serif" }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>What Went Wrong</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.textSec, fontFamily: "'Space Grotesk', sans-serif" }}>{idx+1} of {CAUSE_CHAIN.length}</span>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "6px 0 10px", alignItems: "center" }}>
        {CAUSE_CHAIN.map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: idx === i ? 28 : 10, height: 10, borderRadius: 5,
              background: idx === i ? C.bad : C.border, transition: "all 0.3s",
            }} />
            {i < CAUSE_CHAIN.length - 1 && (
              <div style={{ width: 16, height: 2, background: i < idx ? C.bad : C.border, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Swipeable cards */}
      <div ref={ref} onScroll={onScroll} style={{
        display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
        flex: 1, scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
      }}>
        {CAUSE_CHAIN.map((cause, i) => (
          <div key={i} style={{
            flex: "0 0 100%", scrollSnapAlign: "start", padding: "0 12px",
            display: "flex", flexDirection: "column", gap: 10, overflowY: "auto",
          }}>
            <AnnotatedFrame cause={cause} />

            {/* Fault card */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{cause.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{cause.fault}</div>
                  <div style={{ fontSize: 12, color: C.textSec, fontFamily: "'Space Grotesk', sans-serif", marginTop: 3, lineHeight: 1.5 }}>
                    {cause.phase}
                  </div>
                  {/* Phase explainer */}
                  <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Space Grotesk', sans-serif", marginTop: 3, lineHeight: 1.5, fontStyle: "italic" }}>
                    {cause.phaseExplain}
                  </div>
                </div>
              </div>

              {/* Shot badges */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                {cause.shotBadges.map(s => <ShotBadge key={s} shape={s} />)}
              </div>

              {/* Description */}
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
                {cause.description}
              </div>

              {/* Consequence */}
              <div style={{
                fontSize: 13, color: C.bad, lineHeight: 1.5, padding: "8px 12px",
                background: C.badDim, borderRadius: 10, marginBottom: 12,
                border: `1px solid ${C.badBorder}`, fontFamily: "'Space Grotesk', sans-serif",
              }}>
                → {cause.consequence}
              </div>

              {/* Correct position */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.good, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: C.good, display: "inline-block" }} />
                  Correct Position
                </div>
                <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {cause.ideal}
                </div>
              </div>

              {/* Drill */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, display: "inline-block" }} />
                  Range Fix — {cause.drill}
                </div>
                <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {cause.drillSteps}
                </div>
                <div style={{
                  fontSize: 12, color: C.accent, marginTop: 8, fontFamily: "'Space Grotesk', sans-serif",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 10px", background: C.accentDim, borderRadius: 8, width: "fit-content",
                }}>
                  🎓 Learn more in Shank Academy →
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "10px 14px 10px", borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <button onClick={() => onNavigate("fix")} style={{
          width: "100%", padding: 14, borderRadius: 13, border: "none",
          background: C.good, color: "#000", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
        }}>
          How to Fix This →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 4: FIX (modernized, scorecard, inspirational)
// ═══════════════════════════════════════════════════════════════════════════
function FixScreen({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 14px 14px", overflowY: "auto" }}>
      <button onClick={() => onNavigate("chain")} style={{ background: "none", border: "none", color: C.textSec, fontSize: 13, cursor: "pointer", textAlign: "left", padding: "10px 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>← Back</button>

      {/* Inspirational quote — the hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.goldDim}, ${C.card})`,
        border: `1px solid ${C.gold}25`,
        borderRadius: 16, padding: "20px 18px", marginBottom: 14, textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: C.gold, letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>
          The Fix
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1.6,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          "Fix the weight shift at the top and the early extension disappears on its own.<br/>
          <span style={{ color: C.gold }}>One root cause. One fix.</span>"
        </div>
      </div>

      {/* Full scorecard — all checks */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em" }}>
          Your Swing Scorecard
        </div>
        {ALL_CHECKS.map((check, i) => {
          const isBad = check.status === "bad";
          const col = isBad ? C.bad : C.good;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
              borderTop: i > 0 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 12,
                background: isBad ? C.badDim : C.goodDim,
                border: `1.5px solid ${col}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: col, fontWeight: 800, flexShrink: 0,
              }}>
                {isBad ? "✗" : "✓"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{check.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Space Grotesk', sans-serif" }}>{check.phase}</div>
              </div>
              <div style={{ fontSize: 11, color: isBad ? C.bad : C.textMuted, maxWidth: 110, textAlign: "right", lineHeight: 1.4, fontFamily: "'Space Grotesk', sans-serif" }}>
                {check.note}
              </div>
            </div>
          );
        })}
      </div>

      {/* The drill */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, display: "inline-block" }} />
          Priority Drill — Wall Drill
        </div>
        {[
          "Set up with your trail glute touching a wall or bag",
          "Backswing — feel weight load into trail foot, hip presses wall",
          "Downswing — hips rotate open, glute stays on the wall",
          "Hit 10 balls this way, then step away and swing free",
        ].map((step, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, padding: "7px 0",
            borderTop: i > 0 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 11, background: C.goodDim,
              border: `1px solid ${C.good}30`, color: C.good, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>{i+1}</span>
            <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontFamily: "'Space Grotesk', sans-serif" }}>{step}</span>
          </div>
        ))}

        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 10,
          background: C.accentDim, cursor: "pointer", display: "flex",
          alignItems: "center", gap: 8, border: `1px solid ${C.accent}20`,
        }}>
          <span style={{ fontSize: 16 }}>🎓</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'Space Grotesk', sans-serif" }}>Shank Academy</div>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Space Grotesk', sans-serif" }}>Watch the full drill breakdown + pro demos</div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
        <button style={{
          width: "100%", padding: 15, borderRadius: 13, border: "none",
          background: C.good, color: "#000", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Film Another Swing 📹
        </button>
        <button onClick={() => onNavigate("replay")} style={{
          width: "100%", padding: 12, borderRadius: 13, border: `1px solid ${C.border}`,
          background: "none", color: C.textSec, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
        }}>
          ← Back to Results
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function ShankV3() {
  const [screen, setScreen] = useState("replay");

  const screens = {
    replay: <SwingReplayScreen onNavigate={setScreen} />,
    diagnosis: <DiagnosisScreen onNavigate={setScreen} />,
    chain: <CauseChainScreen onNavigate={setScreen} />,
    fix: <FixScreen onNavigate={setScreen} />,
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", fontFamily: "'Space Grotesk', sans-serif",
      color: C.text, display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 12px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Phone frame */}
      <div style={{
        width: "100%", maxWidth: 390, height: 740,
        background: C.surface, borderRadius: 28, border: `2px solid ${C.border}`,
        overflow: "hidden", position: "relative",
        boxShadow: "0 4px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{
          height: 34, background: C.bg, display: "flex", alignItems: "center",
          justifyContent: "center", borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ width: 80, height: 5, borderRadius: 3, background: C.border }} />
        </div>
        <div style={{ height: "calc(100% - 34px)", overflow: "auto", scrollbarWidth: "none" }}>
          {screens[screen]}
        </div>
      </div>

      {/* Screen nav */}
      <div style={{
        maxWidth: 390, width: "100%", marginTop: 14, display: "flex", gap: 6,
      }}>
        {[
          { id: "replay", label: "1. Replay" },
          { id: "diagnosis", label: "2. Diagnosis" },
          { id: "chain", label: "3. Breakdown" },
          { id: "fix", label: "4. Fix" },
        ].map(s => (
          <button key={s.id} onClick={() => setScreen(s.id)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 10, border: "none",
            background: screen === s.id ? C.card : "transparent",
            color: screen === s.id ? C.text : C.textMuted,
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif",
            border: `1px solid ${screen === s.id ? C.border : "transparent"}`,
          }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

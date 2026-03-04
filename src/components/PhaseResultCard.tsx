import React from 'react';
import { SwingPathResult } from '../utils/swingPlaneCalculator';
import { ExtractedAngles, gradeShoulderTilt, gradeSpineAngle, gradeHipTilt } from '../utils/angleExtractor';

type AnalysisMode = 'critique' | 'swingPath' | 'angles';
type ShotShape = 'slice' | 'pull' | 'push' | 'hook' | 'thin' | 'chunk' | 'shank' | 'topped';

interface Fault {
  name: string;
  phase: string;
  description: string;
  drill: string;
  severity: 'red' | 'yellow';
  shotShapes: ShotShape[];
}

interface Props {
  stepNumber:     number;
  totalSteps:     number;
  phaseName:      string;
  mode:           AnalysisMode;
  faults:         Fault[];
  skippedChecks:  string[];
  assessedChecks: string[];
  shankRisk:      boolean;
  swingPath?:     SwingPathResult;
  angles?:        ExtractedAngles;
  onNext:         () => void;
  onPrev:         () => void;
  isFirst:        boolean;
  isLast:         boolean;
}

// Which faults belong to which phase
const PHASE_FAULTS: Record<string, string[]> = {
  'Address':        ['Shoulder Tilt at Address'],
  'Takeaway':       [],
  'Top':            ['Reverse Pivot'],
  'Impact':         ['Head Up at Impact', 'Early Extension'],
  'Follow-Through': [],
};

// Which checks are evaluated at each phase
const PHASE_CHECKS: Record<string, string[]> = {
  'Address':        ['Shoulder Tilt'],
  'Takeaway':       [],
  'Top':            ['Weight Shift'],
  'Impact':         ['Head Position', 'Hip Stability'],
  'Follow-Through': [],
};

const PHASE_ICONS: Record<string, string> = {
  'Address':        '🏌️',
  'Takeaway':       '↗️',
  'Top':            '⬆️',
  'Impact':         '💥',
  'Follow-Through': '🔄',
};

// Ideal position coaching cues per phase
const PHASE_IDEAL: Record<string, { title: string; cues: string[] }> = {
  'Address': {
    title: 'Ideal Setup',
    cues: [
      'Feet shoulder-width apart, ball off lead heel for driver',
      'Spine tilted 30–40° from vertical, slight knee flex',
      'Shoulders parallel to target line',
      'Weight evenly distributed, arms hanging naturally',
    ],
  },
  'Takeaway': {
    title: 'Ideal Takeaway',
    cues: [
      'Club head stays low and inside for first 12 inches',
      'Shoulders rotate — arms do NOT lift independently',
      'Lead wrist stays flat (no early cupping)',
      'Trail elbow folds softly, stays connected to body',
    ],
  },
  'Top': {
    title: 'Ideal Top of Backswing',
    cues: [
      'Lead arm relatively straight, wrist hinged ~90°',
      'Shoulders coiled 90° relative to spine',
      '70–80% of pressure on trail foot',
      'Head stays behind ball — NO lateral sway toward target',
    ],
  },
  'Impact': {
    title: 'Ideal Impact Position',
    cues: [
      'Hips open 30–40° toward target, NOT thrusting forward',
      'Head stays behind the ball through contact',
      '70–80% of weight on lead foot',
      'Hands ahead of ball (shaft lean) at moment of contact',
    ],
  },
  'Follow-Through': {
    title: 'Ideal Finish',
    cues: [
      'Full rotation — belt buckle faces target',
      'Trail heel off the ground, balanced on lead foot',
      'Club finishes over lead shoulder, high and relaxed',
      'No falling backward — momentum carries you through',
    ],
  },
};

const SHOT_SHAPE_CONFIG: Record<ShotShape, { label: string; color: string }> = {
  shank:  { label: '⚡ SHANK',  color: '#ff3b30' },
  slice:  { label: '↪ Slice',  color: '#f85149' },
  chunk:  { label: '⛏ Chunk',  color: '#d29922' },
  thin:   { label: '〰 Thin',   color: '#d29922' },
  topped: { label: '↗ Topped', color: '#d29922' },
  pull:   { label: '← Pull',   color: '#58a6ff' },
  push:   { label: '→ Push',   color: '#58a6ff' },
  hook:   { label: '↩ Hook',   color: '#58a6ff' },
};

const VERDICT_CONFIG = {
  'on-plane': { color: '#3fb950', icon: '✓', label: 'On Plane' },
  'over-top': { color: '#f85149', icon: '✗', label: 'Over the Top' },
  'too-flat': { color: '#d29922', icon: '⚠', label: 'Too Flat' },
};

export default function PhaseResultCard({
  stepNumber, totalSteps, phaseName, mode,
  faults, skippedChecks, assessedChecks, shankRisk,
  swingPath, angles,
  onNext, onPrev, isFirst, isLast,
}: Props) {
  const phaseFaultNames = PHASE_FAULTS[phaseName] ?? [];
  const phaseChecks     = PHASE_CHECKS[phaseName] ?? [];
  const phaseFaults     = faults.filter(f => phaseFaultNames.includes(f.name));
  const hasChecks       = phaseChecks.length > 0;

  return (
    <div className="phase-result-card">
      {/* ── Header ── */}
      <div className="prc-header">
        <div className="prc-phase-label">
          <span className="prc-icon">{PHASE_ICONS[phaseName] ?? '●'}</span>
          <span className="prc-phase-name">{phaseName}</span>
        </div>
        <span className="prc-step-badge">{stepNumber} / {totalSteps}</span>
      </div>

      {/* ── SHANK ALERT (Impact only) ── */}
      {phaseName === 'Impact' && shankRisk && (
        <div className="prc-shank-alert">
          <span className="prc-shank-icon">⚡</span>
          <div>
            <strong>Shank Risk Detected</strong>
            <p>Multiple impact faults found together. When your hips thrust forward AND your head comes up, the hosel leads the face at contact — the recipe for a shank. Fix these two faults first, everything else becomes easier.</p>
          </div>
        </div>
      )}

      {/* ── Content per mode ── */}
      <div className="prc-body">
        {mode === 'critique' && (
          <CritiqueContent
            phaseName={phaseName}
            phaseFaults={phaseFaults}
            phaseChecks={phaseChecks}
            assessedChecks={assessedChecks}
            hasChecks={hasChecks}
            skippedChecks={skippedChecks}
          />
        )}

        {mode === 'swingPath' && swingPath && <SwingPathContent path={swingPath} />}
        {mode === 'swingPath' && !swingPath && (
          <p className="prc-no-data">Analyze a swing to see swing path data.</p>
        )}

        {mode === 'angles' && angles && <AnglesContent angles={angles} />}
        {mode === 'angles' && !angles && (
          <p className="prc-no-data">Angle data not available for this phase.</p>
        )}
      </div>

      {/* ── Navigation (sticky at bottom) ── */}
      <div className="prc-nav">
        <button className="prc-nav-btn prc-prev" onClick={onPrev} disabled={isFirst}>
          ← Prev
        </button>
        <button className="prc-nav-btn prc-next" onClick={onNext}>
          {isLast ? 'Done ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ── Critique content ───────────────────────────────────────────────────────
function CritiqueContent({ phaseName, phaseFaults, phaseChecks, assessedChecks, hasChecks, skippedChecks }: {
  phaseName:      string;
  phaseFaults:    any[];
  phaseChecks:    string[];
  assessedChecks: string[];
  hasChecks:      boolean;
  skippedChecks:  string[];
}) {
  const ideal = PHASE_IDEAL[phaseName];

  if (!hasChecks) {
    // Takeaway / Follow-Through — no checks but show ideal + coaching
    return (
      <div>
        {phaseName === 'Follow-Through' ? (
          <div className="prc-summary">
            <p className="prc-summary-text">
              Swing complete. Tap <strong>Swing Path</strong> or <strong>Angles</strong> above to explore your mechanics further.
            </p>
          </div>
        ) : (
          <div className="prc-tracking">
            <span className="prc-tracking-dot" />
            <span>Tracking motion — no automated checks at this phase</span>
          </div>
        )}
        {ideal && <IdealBox ideal={ideal} />}
      </div>
    );
  }

  return (
    <div>
      <div className="prc-critique-rows">
        {phaseChecks.map(checkName => {
          const fault = phaseFaults.find(f =>
            f.name.toLowerCase().includes(checkName.toLowerCase().split(' ')[0])
          );
          const assessed = assessedChecks.includes(checkName);
          const skipped  = !assessed;

          if (skipped) {
            return (
              <div key={checkName} className="prc-row prc-row-skipped">
                <span className="prc-row-icon">—</span>
                <div className="prc-row-content">
                  <span className="prc-row-name">{checkName}</span>
                  <span className="prc-row-desc">Could not assess — joint not confident enough. Try better lighting or move closer to camera.</span>
                </div>
              </div>
            );
          }

          if (fault) {
            return (
              <div key={checkName} className={`prc-row prc-row-fault prc-row-${fault.severity}`}>
                <span className="prc-row-icon">{fault.severity === 'red' ? '✗' : '⚠'}</span>
                <div className="prc-row-content">
                  <span className="prc-row-name">{fault.name}</span>
                  {fault.shotShapes?.length > 0 && (
                    <div className="prc-shot-shapes">
                      {fault.shotShapes.map((s: ShotShape) => {
                        const cfg = SHOT_SHAPE_CONFIG[s];
                        return (
                          <span
                            key={s}
                            className="prc-shot-badge"
                            style={{ borderColor: cfg.color, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <span className="prc-row-desc">{fault.description}</span>
                  <div className="prc-drill">
                    <span className="prc-drill-label">💡 Fix:</span>
                    <span>{fault.drill}</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={checkName} className="prc-row prc-row-pass">
              <span className="prc-row-icon">✓</span>
              <div className="prc-row-content">
                <span className="prc-row-name">{checkName}</span>
                <span className="prc-row-desc">Looks good</span>
              </div>
            </div>
          );
        })}
      </div>

      {ideal && <IdealBox ideal={ideal} />}
    </div>
  );
}

function IdealBox({ ideal }: { ideal: { title: string; cues: string[] } }) {
  return (
    <div className="prc-ideal-box">
      <div className="prc-ideal-title">📐 {ideal.title}</div>
      <ul className="prc-ideal-list">
        {ideal.cues.map((cue, i) => (
          <li key={i}>{cue}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Swing path content ─────────────────────────────────────────────────────
function SwingPathContent({ path }: { path: SwingPathResult }) {
  const v = VERDICT_CONFIG[path.verdict];

  const segRows = [
    { label: 'Backswing',      dev: path.backswingDev },
    { label: 'Downswing',      dev: path.downswingDev },
    { label: 'Follow-Through', dev: path.followDev    },
  ];

  function segLabel(dev: number): { text: string; color: string } {
    if (Math.abs(dev) <= 0.06) return { text: 'On plane ✓',         color: '#3fb950' };
    if (dev > 0.06)             return { text: 'Above plane (steep)', color: '#f85149' };
    return                             { text: 'Below plane (flat)',  color: '#d29922' };
  }

  return (
    <div className="prc-path-content">
      <div className="prc-verdict" style={{ borderColor: v.color }}>
        <span className="prc-verdict-icon" style={{ color: v.color }}>{v.icon}</span>
        <span className="prc-verdict-label" style={{ color: v.color }}>{v.label}</span>
      </div>

      <div className="prc-seg-rows">
        {segRows.map(row => {
          const s = segLabel(row.dev);
          return (
            <div key={row.label} className="prc-seg-row">
              <span className="prc-seg-label">{row.label}</span>
              <span className="prc-seg-val" style={{ color: s.color }}>{s.text}</span>
            </div>
          );
        })}
      </div>

      <div className="prc-fix">
        <span className="prc-drill-label">💡 Fix:</span>
        <span>{path.fix}</span>
      </div>
    </div>
  );
}

// ── Angles content ─────────────────────────────────────────────────────────
function AnglesContent({ angles }: { angles: ExtractedAngles }) {
  const cards = [
    {
      name:   'Shoulders',
      value:  angles.shoulderTilt,
      grade:  angles.shoulderTilt !== null ? gradeShoulderTilt(angles.shoulderTilt) : null,
      target: '< 5° ideal',
    },
    {
      name:   'Spine',
      value:  angles.spineAngle,
      grade:  angles.spineAngle !== null ? gradeSpineAngle(angles.spineAngle) : null,
      target: '25–45° ideal',
    },
    {
      name:   'Hips',
      value:  angles.hipTilt,
      grade:  angles.hipTilt !== null ? gradeHipTilt(angles.hipTilt) : null,
      target: '< 5° ideal',
    },
  ];

  return (
    <div className="prc-angle-cards">
      {cards.map(card => (
        <div
          key={card.name}
          className={`prc-angle-card ${card.grade ? (card.grade.pass ? 'pass' : 'fail') : 'na'}`}
        >
          <div className="prc-angle-name">{card.name}</div>
          <div className="prc-angle-value">
            {card.value !== null ? `${card.value.toFixed(1)}°` : '—'}
          </div>
          <div className="prc-angle-label">{card.grade?.label ?? 'No data'}</div>
          <div className="prc-angle-target">{card.target}</div>
        </div>
      ))}
    </div>
  );
}

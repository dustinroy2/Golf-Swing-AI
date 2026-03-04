import React from 'react';
import { SwingPathResult } from '../utils/swingPlaneCalculator';
import { ExtractedAngles, gradeShoulderTilt, gradeSpineAngle, gradeHipTilt } from '../utils/angleExtractor';

type AnalysisMode = 'critique' | 'swingPath' | 'angles';

interface Fault {
  name: string;
  phase: string;
  description: string;
  drill: string;
  severity: 'red' | 'yellow';
}

interface Props {
  stepNumber:     number;        // 1–5 (walkthrough step)
  totalSteps:     number;        // 5
  phaseName:      string;        // 'Address' | 'Takeaway' | 'Top' | 'Impact' | 'Follow-Through'
  mode:           AnalysisMode;
  faults:         Fault[];       // ALL faults (filtered inside)
  skippedChecks:  string[];
  assessedChecks: string[];      // e.g. ['Shoulder Tilt', 'Head Up']
  swingPath?:     SwingPathResult;
  angles?:        ExtractedAngles;
  onNext:         () => void;
  onPrev:         () => void;
  isFirst:        boolean;
  isLast:         boolean;
}

// Which faults belong to which phase
const PHASE_FAULTS: Record<string, string[]> = {
  'Address':         ['Shoulder Tilt at Address'],
  'Takeaway':        [],
  'Top':             ['Reverse Pivot'],
  'Impact':          ['Head Up at Impact', 'Early Extension'],
  'Follow-Through':  [],
};

// Which checks are evaluated at each phase
const PHASE_CHECKS: Record<string, string[]> = {
  'Address':         ['Shoulder Tilt'],
  'Takeaway':        [],
  'Top':             ['Reverse Pivot'],
  'Impact':          ['Head Position', 'Hip Stability'],
  'Follow-Through':  [],
};

const PHASE_ICONS: Record<string, string> = {
  'Address':        '🏌️',
  'Takeaway':       '↗️',
  'Top':            '⬆️',
  'Impact':         '💥',
  'Follow-Through': '🔄',
};

const VERDICT_CONFIG = {
  'on-plane':  { color: '#3fb950', icon: '✓', label: 'On Plane' },
  'over-top':  { color: '#f85149', icon: '✗', label: 'Over the Top' },
  'too-flat':  { color: '#d29922', icon: '⚠', label: 'Too Flat' },
};

export default function PhaseResultCard({
  stepNumber, totalSteps, phaseName, mode,
  faults, skippedChecks, assessedChecks,
  swingPath, angles,
  onNext, onPrev, isFirst, isLast,
}: Props) {
  const phaseFaultNames = PHASE_FAULTS[phaseName] ?? [];
  const phaseChecks     = PHASE_CHECKS[phaseName] ?? [];
  const phaseFaults     = faults.filter(f => phaseFaultNames.includes(f.name));
  const faultNames      = new Set(phaseFaults.map(f => f.name));
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

      {/* ── Content per mode ── */}
      <div className="prc-body">
        {mode === 'critique' && <CritiqueContent
          phaseName={phaseName}
          phaseFaults={phaseFaults}
          phaseChecks={phaseChecks}
          assessedChecks={assessedChecks}
          faultNames={faultNames}
          hasChecks={hasChecks}
          skippedChecks={skippedChecks}
        />}

        {mode === 'swingPath' && swingPath && <SwingPathContent path={swingPath} />}
        {mode === 'swingPath' && !swingPath && (
          <p className="prc-no-data">Analyze a swing to see swing path data.</p>
        )}

        {mode === 'angles' && angles && <AnglesContent angles={angles} />}
        {mode === 'angles' && !angles && (
          <p className="prc-no-data">Angle data not available for this phase.</p>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="prc-nav">
        <button
          className="prc-nav-btn prc-prev"
          onClick={onPrev}
          disabled={isFirst}
        >
          ← Prev
        </button>
        <button
          className="prc-nav-btn prc-next"
          onClick={onNext}
        >
          {isLast ? 'Done ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ── Critique content ───────────────────────────────────────────────────────
function CritiqueContent({ phaseName, phaseFaults, phaseChecks, assessedChecks, faultNames, hasChecks, skippedChecks }: {
  phaseName: string;
  phaseFaults: any[];
  phaseChecks: string[];
  assessedChecks: string[];
  faultNames: Set<string>;
  hasChecks: boolean;
  skippedChecks: string[];
}) {
  if (!hasChecks) {
    // Takeaway / Follow-Through
    if (phaseName === 'Follow-Through') {
      return (
        <div className="prc-summary">
          <p className="prc-summary-text">Swing complete. Review the results above and use the mode chips to explore your swing path and angles.</p>
        </div>
      );
    }
    return (
      <div className="prc-tracking">
        <span className="prc-tracking-dot" />
        <span>Tracking motion — no specific checks at this phase</span>
      </div>
    );
  }

  return (
    <div className="prc-critique-rows">
      {phaseChecks.map(checkName => {
        // Find fault for this check
        const fault = phaseFaults.find(f => f.name.includes(checkName.split(' ')[0]));
        const skipped = skippedChecks.some(s => s.toLowerCase().includes(checkName.toLowerCase()));
        const assessed = assessedChecks.includes(checkName);

        if (skipped || !assessed) {
          return (
            <div key={checkName} className="prc-row prc-row-skipped">
              <span className="prc-row-icon">—</span>
              <div className="prc-row-content">
                <span className="prc-row-name">{checkName}</span>
                <span className="prc-row-desc">Could not assess — low confidence at this joint</span>
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
  );
}

// ── Swing path content ─────────────────────────────────────────────────────
function SwingPathContent({ path }: { path: SwingPathResult }) {
  const v = VERDICT_CONFIG[path.verdict];

  const segRows = [
    { label: 'Backswing',    dev: path.backswingDev },
    { label: 'Downswing',    dev: path.downswingDev },
    { label: 'Follow-Through', dev: path.followDev  },
  ];

  function segLabel(dev: number): { text: string; color: string } {
    if (Math.abs(dev) <= 0.06) return { text: 'On plane ✓', color: '#3fb950' };
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
      name: 'Shoulders',
      value: angles.shoulderTilt,
      grade: angles.shoulderTilt !== null ? gradeShoulderTilt(angles.shoulderTilt) : null,
      target: '< 5° ideal',
    },
    {
      name: 'Spine',
      value: angles.spineAngle,
      grade: angles.spineAngle !== null ? gradeSpineAngle(angles.spineAngle) : null,
      target: '25–45° ideal',
    },
    {
      name: 'Hips',
      value: angles.hipTilt,
      grade: angles.hipTilt !== null ? gradeHipTilt(angles.hipTilt) : null,
      target: '< 5° ideal',
    },
  ];

  return (
    <div className="prc-angle-cards">
      {cards.map(card => (
        <div key={card.name} className={`prc-angle-card ${card.grade ? (card.grade.pass ? 'pass' : 'fail') : 'na'}`}>
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

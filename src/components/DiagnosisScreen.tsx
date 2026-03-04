import React from 'react';
import { ScorecardRow } from './VideoAnalyzer';

export type V3Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';

interface Fault {
  name:       string;
  phase:      string;
  shotShapes: string[];
}

interface AnalysisResult {
  score:         number;
  faults:        Fault[];
  assessedCount: number;
  totalChecks:   number;
  scorecardRows: ScorecardRow[];
}

interface TempoResult {
  ratioMid: number;
}

interface Props {
  result:      AnalysisResult;
  tempoResult: TempoResult | null;
  onNavigate:  (s: V3Screen) => void;
  speaking:    boolean;
  onSpeakToggle: () => void;
}

const C = {
  bg:        '#0b0e0b',
  surface:   '#131813',
  card:      '#1a1f1a',
  border:    '#2a332a',
  bad:       '#e84040',
  badDim:    'rgba(232,64,64,0.10)',
  badBorder: 'rgba(232,64,64,0.22)',
  good:      '#2fbd56',
  goodDim:   'rgba(47,189,86,0.08)',
  accent:    '#6cb4ff',
  text:      '#e4e8e4',
  textSec:   '#90a090',
  textMuted: '#5a6a5a',
  white:     '#fff',
};

// Map fault phase → health strip slot
const PHASE_SLOTS = ['Setup', 'Takeaway', 'Top of Backswing', 'Moment of Impact', 'Follow-Through'];
const SLOT_LABELS = ['Setup', 'Takeaway', 'Top', 'Impact', 'Finish'];

function ScoreRing({ score, size = 52 }: { score: number | null; size?: number }) {
  const color = score === null ? C.bad : score > 70 ? C.good : C.bad;
  const r     = (size - 6) / 2;
  const circ  = 2 * Math.PI * r;
  const label = score === null ? '?' : String(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      {score !== null && (
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      )}
      <text
        x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.3} fontWeight={800}
        fontFamily="'Space Grotesk', sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

const FAULT_ICONS: Record<string, string> = {
  'Shoulder Tilt at Address': '↔',
  'Reverse Pivot':            '⚡',
  'Head Up at Impact':        '👀',
  'Early Extension':          '💥',
};

export default function DiagnosisScreen({
  result, tempoResult, onNavigate, speaking, onSpeakToggle,
}: Props) {
  const scoreVal   = result.assessedCount === 0 ? null : result.score;
  const scoreColor = scoreVal === null ? C.bad : scoreVal > 70 ? C.good : C.bad;

  const faultPhases = new Set(result.faults.map(f => f.phase));

  const tempoColor = tempoResult
    ? (tempoResult.ratioMid >= 2.5 && tempoResult.ratioMid <= 3.5 ? C.good : C.bad)
    : C.textMuted;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '0 14px 14px', background: C.bg, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '16px 0 10px', position: 'relative' }}>
        {/* Speak toggle */}
        <button
          onClick={onSpeakToggle}
          style={{
            position: 'absolute', right: 0, top: 16,
            background: speaking ? C.badDim : 'transparent',
            border: `1px solid ${speaking ? C.badBorder : C.border}`,
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
            color: speaking ? C.bad : C.textMuted,
            fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
          }}
          title={speaking ? 'Stop speaking' : 'Read results aloud'}
        >
          {speaking ? '🔊 Stop' : '🔊'}
        </button>

        <div style={{
          fontSize: 13, color: C.textMuted, letterSpacing: '0.05em',
          fontFamily: "'Space Grotesk', sans-serif", marginBottom: 5,
        }}>
          WHAT DOES
        </div>
        <div style={{ fontSize: 23, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
          <span style={{ color: scoreColor }}>Shank</span>
          <span style={{ color: C.text }}> think of your swing?</span>
        </div>
      </div>

      {/* Score + Tempo row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {/* Score card */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: C.card, borderRadius: 13,
          border: `1px solid ${C.border}`,
        }}>
          <ScoreRing score={scoreVal} size={52} />
          <div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: C.text,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>Swing Score</div>
            <div style={{
              fontSize: 11, color: C.textMuted,
              fontFamily: "'Space Grotesk', sans-serif", marginTop: 2,
            }}>
              {result.assessedCount === 0
                ? 'No checks assessed'
                : `${result.assessedCount} of ${result.totalChecks} checks`}
            </div>
          </div>
        </div>

        {/* Tempo card */}
        <div style={{
          width: 100, padding: '12px 14px', background: C.card, borderRadius: 13,
          border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {tempoResult ? (
            <>
              <div style={{
                fontSize: 20, fontWeight: 700, color: tempoColor,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {tempoResult.ratioMid.toFixed(1)}:1
              </div>
              <div style={{
                fontSize: 10, color: C.textMuted,
                fontFamily: "'Space Grotesk', sans-serif", marginTop: 2,
              }}>Tempo · Tour avg</div>
            </>
          ) : (
            <div style={{
              fontSize: 11, color: C.textMuted,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>Tempo N/A</div>
          )}
        </div>
      </div>

      {/* What Went Wrong */}
      {result.faults.length > 0 && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 12,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 12,
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em',
          }}>
            What Went Wrong
          </div>
          {result.faults.map((fault, i) => (
            <div key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: C.badDim, border: `1.5px solid ${C.bad}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                }}>
                  {FAULT_ICONS[fault.name] ?? '⚠'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: C.text,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{fault.name}</div>
                  <div style={{
                    fontSize: 12, color: C.textSec,
                    fontFamily: "'Space Grotesk', sans-serif", marginTop: 2,
                  }}>{fault.phase}</div>
                </div>
                <span style={{ fontSize: 16, color: C.textMuted }}>›</span>
              </div>
              {i < result.faults.length - 1 && (
                <div style={{ width: 2, height: 8, background: C.border, marginLeft: 15 }} />
              )}
            </div>
          ))}
        </div>
      )}

      {result.faults.length === 0 && result.assessedCount > 0 && (
        <div style={{
          background: C.goodDim, border: `1px solid rgba(47,189,86,0.18)`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 12, textAlign: 'center',
        }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: C.good,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>✓ No major faults detected</div>
          <div style={{
            fontSize: 13, color: C.textSec, marginTop: 4,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>Clean mechanics across all assessed checks.</div>
        </div>
      )}

      {/* Phase health strip */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {PHASE_SLOTS.map((slot, i) => {
          const bad = faultPhases.has(slot);
          return (
            <div key={slot} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: bad ? C.bad : C.good,
                opacity: bad ? 1 : 0.35,
              }} />
              <div style={{
                fontSize: 9, marginTop: 3,
                color: bad ? C.bad : C.textMuted,
                fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
              }}>{SLOT_LABELS[i]}</div>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {result.faults.length > 0 ? (
          <>
            <button
              onClick={() => onNavigate('chain')}
              style={{
                width: '100%', padding: 15, borderRadius: 13, border: 'none',
                background: C.bad, color: C.white, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                minHeight: 44,
              }}
            >
              Break It Down →
            </button>
            <button
              onClick={() => onNavigate('fix')}
              style={{
                width: '100%', padding: 12, borderRadius: 13,
                border: `1px solid ${C.border}`, background: 'none',
                color: C.textSec, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                minHeight: 44,
              }}
            >
              Skip to What to Fix
            </button>
          </>
        ) : (
          <button
            onClick={() => onNavigate('fix')}
            style={{
              width: '100%', padding: 15, borderRadius: 13, border: 'none',
              background: C.good, color: '#000', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
              minHeight: 44,
            }}
          >
            View Scorecard →
          </button>
        )}
      </div>
    </div>
  );
}

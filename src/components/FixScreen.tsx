import React from 'react';
import { FAULT_COACHING } from '../data/faultCoaching';
import { ScorecardRow } from './VideoAnalyzer';

export type V3Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';

interface Fault {
  name:  string;
  phase: string;
}

interface AnalysisResult {
  faults:        Fault[];
  scorecardRows: ScorecardRow[];
  assessedCount: number;
}

interface Props {
  result:    AnalysisResult;
  onNavigate: (s: V3Screen) => void;
  onReset:    () => void;
}

const C = {
  bg:        '#0b0e0b',
  card:      '#1a1f1a',
  border:    '#2a332a',
  bad:       '#e84040',
  badDim:    'rgba(232,64,64,0.10)',
  badBorder: 'rgba(232,64,64,0.22)',
  good:      '#2fbd56',
  goodDim:   'rgba(47,189,86,0.08)',
  goodBorder:'rgba(47,189,86,0.18)',
  accent:    '#6cb4ff',
  accentDim: 'rgba(108,180,255,0.08)',
  gold:      '#d4a853',
  goldDim:   'rgba(212,168,83,0.10)',
  text:      '#e4e8e4',
  textSec:   '#90a090',
  textMuted: '#5a6a5a',
  white:     '#fff',
};

export default function FixScreen({ result, onNavigate, onReset }: Props) {
  // Priority fault = first (most upstream) fault
  const primaryFault   = result.faults[0];
  const primaryCoach   = primaryFault ? FAULT_COACHING[primaryFault.name] : null;

  // Quote: from coaching data or generic fallback
  const fixQuote = primaryCoach?.fixQuote
    ?? '"Focus on the fundamentals. The game is simpler than you think."';

  // Priority drill from primary fault coaching
  const drillName  = primaryCoach?.drillName  ?? null;
  const drillSteps = primaryCoach?.drillSteps ?? [];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', padding: '0 14px 14px',
      background: C.bg, overflowY: 'auto',
    }}>
      {/* Back button */}
      <button
        onClick={() => onNavigate(result.faults.length > 0 ? 'chain' : 'diagnosis')}
        style={{
          background: 'none', border: 'none', color: C.textSec,
          fontSize: 13, cursor: 'pointer',
          textAlign: 'left', padding: '12px 0 4px',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        ← Back
      </button>

      {/* ── Inspirational Quote Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.goldDim}, ${C.card})`,
        border: `1px solid rgba(212,168,83,0.22)`,
        borderRadius: 16, padding: '20px 18px', marginBottom: 14, textAlign: 'center',
      }}>
        <div style={{
          fontSize: 13, color: C.gold, letterSpacing: '0.08em',
          fontFamily: "'Space Grotesk', sans-serif",
          marginBottom: 10, fontWeight: 600, textTransform: 'uppercase',
        }}>
          The Fix
        </div>
        <div style={{
          fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.65,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {/* Split on " One " to color in gold */}
          {renderQuote(fixQuote)}
        </div>
      </div>

      {/* ── Swing Scorecard ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 12,
          fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em',
        }}>
          Your Swing Scorecard
        </div>

        {result.scorecardRows.length === 0 ? (
          <div style={{
            fontSize: 13, color: C.textMuted,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            No checks were assessed. Film with full body visible for a scorecard.
          </div>
        ) : (
          result.scorecardRows.map((row, i) => {
            const isBad = row.status === 'bad';
            const col   = isBad ? C.bad : C.good;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
              }}>
                {/* Status circle */}
                <div style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: isBad ? C.badDim : C.goodDim,
                  border: `1.5px solid ${col}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: col, fontWeight: 800, flexShrink: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {isBad ? '✗' : '✓'}
                </div>
                {/* Name + phase */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: C.text,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{row.name}</div>
                  <div style={{
                    fontSize: 11, color: C.textMuted,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{row.phase}</div>
                </div>
                {/* Note */}
                <div style={{
                  fontSize: 11, color: isBad ? C.bad : C.textMuted,
                  maxWidth: 110, textAlign: 'right', lineHeight: 1.4,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {row.note}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Priority Drill ── */}
      {drillName && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 14,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 10,
            fontFamily: "'Space Grotesk', sans-serif",
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 3,
              background: C.accent, display: 'inline-block',
            }} />
            Priority Drill — {drillName}
          </div>

          {drillSteps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '7px 0',
              borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 11,
                background: C.goodDim,
                border: `1px solid ${C.goodBorder}`,
                color: C.good, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif",
              }}>{i + 1}</span>
              <span style={{
                fontSize: 13, color: C.text, lineHeight: 1.55,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>{step}</span>
            </div>
          ))}

          {/* Shank Academy card */}
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 10,
            background: C.accentDim, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            border: `1px solid rgba(108,180,255,0.18)`,
          }}>
            <span style={{ fontSize: 18 }}>🎓</span>
            <div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: C.accent,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>Shank Academy</div>
              <div style={{
                fontSize: 11, color: C.textMuted,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>Watch the full drill breakdown + pro demos</div>
            </div>
          </div>
        </div>
      )}

      {/* ── CTAs ── */}
      <div style={{
        marginTop: 'auto', display: 'flex', flexDirection: 'column',
        gap: 8, paddingTop: 8,
      }}>
        <button
          onClick={onReset}
          style={{
            width: '100%', padding: 15, borderRadius: 13, border: 'none',
            background: C.good, color: '#000', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
            minHeight: 44,
          }}
        >
          Film Another Swing 📹
        </button>
        <button
          onClick={() => onNavigate('replay')}
          style={{
            width: '100%', padding: 12, borderRadius: 13,
            border: `1px solid ${C.border}`, background: 'none',
            color: C.textSec, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
            minHeight: 44,
          }}
        >
          ← Back to Results
        </button>
      </div>
    </div>
  );
}

// Render the quote, putting the last sentence in gold if it matches pattern
function renderQuote(quote: string): React.ReactNode {
  // Look for a sentence at the end that's short (≤50 chars) to color gold
  const sentenceMatch = quote.match(/^(.*?)(\.\s+"[^"]{1,60}")$/s) ??
                        quote.match(/^(".*?)(\s[A-Z][^.]{5,50}\.")$/s);

  if (!sentenceMatch) {
    // Try splitting at last period inside the quote
    const lastDot = quote.lastIndexOf('. ');
    if (lastDot !== -1 && lastDot > quote.length * 0.5) {
      return (
        <>
          {quote.slice(0, lastDot + 2)}
          <span style={{ color: C.gold }}>{quote.slice(lastDot + 2)}</span>
        </>
      );
    }
    return <span>{quote}</span>;
  }

  return (
    <>
      {sentenceMatch[1]}
      <span style={{ color: C.gold }}>{sentenceMatch[2]}</span>
    </>
  );
}

// Dummy C.gold reference for renderQuote (needs to be accessible inside function)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _goldRef = C.gold;

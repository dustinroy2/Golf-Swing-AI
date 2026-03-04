import React, { useState, useRef, useEffect } from 'react';
import AnnotatedVideoFrame, { Annotation } from './AnnotatedVideoFrame';
import { FAULT_COACHING } from '../data/faultCoaching';
import { DetectedPhases } from './SwingStateMachine';
import { ScorecardRow } from './VideoAnalyzer';

export type V3Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';

interface Fault {
  name:        string;
  phase:       string;
  description: string;
  drill:       string;
  shotShapes:  string[];
}

interface AnalysisResult {
  faults:        Fault[];
  scorecardRows: ScorecardRow[];
}

interface Props {
  result:         AnalysisResult;
  videoUrl:       string;
  detectedPhases: DetectedPhases;
  frameWidth:     number;
  frameHeight:    number;
  onNavigate:     (s: V3Screen) => void;
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
  accent:    '#6cb4ff',
  accentDim: 'rgba(108,180,255,0.08)',
  text:      '#e4e8e4',
  textSec:   '#90a090',
  textMuted: '#5a6a5a',
  white:     '#fff',
};

const SHOT_ICONS: Record<string, string> = {
  shank: '⚡', slice: '↪', chunk: '⛏', thin: '〰',
  topped: '↗', push: '→', pull: '←', hook: '↩',
};

function ShotBadge({ shape }: { shape: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      border: `1.5px solid ${C.bad}40`, color: C.bad, background: `${C.bad}10`,
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {SHOT_ICONS[shape] ?? '•'} {shape.charAt(0).toUpperCase() + shape.slice(1)}
    </span>
  );
}

function getAnnotations(
  faultName:    string,
  phases:       DetectedPhases,
  frameWidth:   number,
  frameHeight:  number,
): Annotation[] {
  const coaching = FAULT_COACHING[faultName];
  if (!coaching) return [];

  // Get pose at the relevant phase
  const phaseFrame = phases[coaching.phaseKey];
  if (!phaseFrame?.pose?.keypoints) return [];
  const kps = phaseFrame.pose.keypoints;

  return coaching.annotationKps
    .map(kpCfg => {
      const kp = kps[kpCfg.idx];
      if (!kp || (kp.score ?? 0) < 0.2) return null;
      return {
        x: (kp.x / (frameWidth  || 640)) * 100,
        y: (kp.y / (frameHeight || 480)) * 100,
        label:  kpCfg.label,
        note:   kpCfg.note,
        status: kpCfg.status,
      } as Annotation;
    })
    .filter((a): a is Annotation => a !== null);
}

export default function CauseChainScreen({
  result, videoUrl, detectedPhases, frameWidth, frameHeight, onNavigate,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver per spec (NOT raw onScroll)
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveIdx(i);
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => { observers.forEach(o => o.disconnect()); };
  }, [result.faults.length]);

  const faults = result.faults;

  if (faults.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: '0 20px',
        background: C.bg, gap: 14,
      }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: C.good,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>No faults to break down</div>
        <button
          onClick={() => onNavigate('fix')}
          style={{
            padding: '13px 32px', borderRadius: 13, border: 'none',
            background: C.good, color: '#000', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          View Scorecard →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', background: C.bg,
    }}>
      {/* Top nav bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 14px 6px', gap: 8,
        flexShrink: 0,
      }}>
        <button
          onClick={() => onNavigate('diagnosis')}
          style={{
            background: 'none', border: 'none', color: C.textSec,
            fontSize: 13, cursor: 'pointer', padding: '4px 6px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >←</button>
        <span style={{
          fontSize: 15, fontWeight: 700, color: C.text,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          What Went Wrong
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 12, color: C.textSec,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {activeIdx + 1} of {faults.length}
        </span>
      </div>

      {/* Progress dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6,
        padding: '4px 0 10px', alignItems: 'center', flexShrink: 0,
      }}>
        {faults.map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: activeIdx === i ? 28 : 10,
              height: 10, borderRadius: 5,
              background: activeIdx === i ? C.bad : C.border,
              transition: 'all 0.3s',
            }} />
            {i < faults.length - 1 && (
              <div style={{
                width: 16, height: 2,
                background: i < activeIdx ? C.bad : C.border,
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Swipeable scroll container */}
      <div style={{
        display: 'flex', overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        flex: 1, scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}>
        {faults.map((fault, i) => {
          const coaching  = FAULT_COACHING[fault.name];
          const phaseKey  = (coaching?.phaseKey ?? 'impact') as 'address' | 'top' | 'impact' | 'followThrough';
          const phaseTime = detectedPhases[phaseKey]?.time ?? 0;
          const anns      = getAnnotations(fault.name, detectedPhases, frameWidth, frameHeight);

          return (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                flex: '0 0 100%', scrollSnapAlign: 'start',
                padding: '0 14px 14px',
                display: 'flex', flexDirection: 'column', gap: 10,
                overflowY: 'auto',
              }}
            >
              <AnnotatedVideoFrame
                videoUrl={videoUrl}
                phaseTime={phaseTime}
                annotations={anns}
                phase={fault.phase}
              />

              {/* Fault detail card */}
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: '14px 16px',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 17, fontWeight: 700, color: C.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {fault.name}
                    </div>
                    <div style={{
                      fontSize: 12, color: C.textSec,
                      fontFamily: "'Space Grotesk', sans-serif", marginTop: 3, lineHeight: 1.5,
                    }}>
                      {fault.phase}
                    </div>
                    {coaching && (
                      <div style={{
                        fontSize: 11, color: C.textMuted,
                        fontFamily: "'Space Grotesk', sans-serif",
                        marginTop: 4, lineHeight: 1.5, fontStyle: 'italic',
                      }}>
                        {coaching.phaseExplainer}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shot badges */}
                <div style={{
                  display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12,
                }}>
                  {fault.shotShapes.map(s => <ShotBadge key={s} shape={s} />)}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {fault.description}
                </div>

                {/* Consequence */}
                {coaching && (
                  <div style={{
                    fontSize: 13, color: C.bad, lineHeight: 1.5,
                    padding: '8px 12px',
                    background: C.badDim, borderRadius: 10, marginBottom: 12,
                    border: `1px solid ${C.badBorder}`,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    → {coaching.consequence}
                  </div>
                )}

                {/* Correct position */}
                {coaching && (
                  <div style={{
                    borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 12,
                  }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: C.good, marginBottom: 6,
                      fontFamily: "'Space Grotesk', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: C.good, display: 'inline-block',
                      }} />
                      Correct Position
                    </div>
                    <div style={{
                      fontSize: 13, color: C.textSec, lineHeight: 1.7,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {coaching.correctPosition}
                    </div>
                  </div>
                )}

                {/* Drill */}
                {coaching && (
                  <div style={{
                    borderTop: `1px solid ${C.border}`, paddingTop: 12,
                  }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6,
                      fontFamily: "'Space Grotesk', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: C.accent, display: 'inline-block',
                      }} />
                      Range Fix — {coaching.drillName}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {coaching.drillSteps.map((step, si) => (
                        <div key={si} style={{
                          display: 'flex', gap: 8, alignItems: 'flex-start',
                        }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: 10,
                            background: 'rgba(108,180,255,0.08)',
                            border: `1px solid rgba(108,180,255,0.25)`,
                            color: C.accent, fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif",
                          }}>{si + 1}</span>
                          <span style={{
                            fontSize: 13, color: C.textSec, lineHeight: 1.6,
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}>{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Shank Academy link */}
                    <div style={{
                      marginTop: 10, padding: '8px 12px', borderRadius: 10,
                      background: C.accentDim, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      border: `1px solid rgba(108,180,255,0.18)`,
                    }}>
                      <span style={{ fontSize: 15 }}>🎓</span>
                      <span style={{
                        fontSize: 12, color: C.accent, fontWeight: 600,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        Learn more in Shank Academy →
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        padding: '10px 14px',
        borderTop: `1px solid ${C.border}`,
        background: '#131813',
        flexShrink: 0,
      }}>
        <button
          onClick={() => onNavigate('fix')}
          style={{
            width: '100%', padding: 14, borderRadius: 13, border: 'none',
            background: C.good, color: '#000', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
            minHeight: 44,
          }}
        >
          How to Fix This →
        </button>
      </div>
    </div>
  );
}

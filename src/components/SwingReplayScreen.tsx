import React, { useState, useEffect, useRef } from 'react';
import { SwingFrame } from './SwingStateMachine';
import { DetectedPhases } from './SwingStateMachine';

type V3Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';

interface Props {
  videoUrl:       string;
  allFrames:      SwingFrame[];
  detectedPhases: DetectedPhases;
  shankRisk:      boolean;
  faultCount:     number;
  onNavigate:     (s: V3Screen) => void;
}

const C = {
  bg:         '#0b0e0b',
  surface:    '#131813',
  card:       '#1a1f1a',
  border:     '#2a332a',
  bad:        '#e84040',
  badDim:     'rgba(232,64,64,0.10)',
  badBorder:  'rgba(232,64,64,0.22)',
  good:       '#2fbd56',
  goodDim:    'rgba(47,189,86,0.08)',
  accent:     '#6cb4ff',
  text:       '#e4e8e4',
  textSec:    '#90a090',
  textMuted:  '#5a6a5a',
  white:      '#fff',
};

const PHASES = [
  { name: 'Setup',      tRatio: 0 },
  { name: 'Takeaway',   tRatio: 0.05 },
  { name: 'Top',        tRatio: 0.20 },
  { name: 'Down',       tRatio: 0.40 },
  { name: 'Impact',     tRatio: 0.65 },
  { name: 'Finish',     tRatio: 0.85 },
];

export default function SwingReplayScreen({
  videoUrl, allFrames, detectedPhases, shankRisk, faultCount, onNavigate,
}: Props) {
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState('Setup');
  const [done, setDone]           = useState(false);
  const videoRef                  = useRef<HTMLVideoElement>(null);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  // Map allFrames to normalized (x%, y%) using first/last frame bounding box
  const arcPoints = React.useMemo(() => {
    if (allFrames.length < 2) return [];
    const xs = allFrames.map(f => f.wristMidpoint.x);
    const ys = allFrames.map(f => f.wristMidpoint.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    // Map to 15–85% x and 15–85% y range (within the frame display area)
    return allFrames.map(f => ({
      x: 15 + ((f.wristMidpoint.x - minX) / rangeX) * 70,
      y: 15 + ((f.wristMidpoint.y - minY) / rangeY) * 70,
    }));
  }, [allFrames]);

  const startReplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    setPhase('Setup');
    setDone(false);

    // Seek video to swing start
    if (videoRef.current && allFrames.length > 0) {
      videoRef.current.currentTime = allFrames[0].time;
    }

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.008;
        if (next >= 1.15) {
          clearInterval(intervalRef.current!);
          setDone(true);
          return 1.15;
        }
        // Update phase label
        const p = Math.min(next, 1);
        if      (p > 0.85) setPhase('Follow-Through');
        else if (p > 0.65) setPhase('Impact');
        else if (p > 0.40) setPhase('Downswing');
        else if (p > 0.20) setPhase('Top of Backswing');
        else if (p > 0.05) setPhase('Takeaway');
        else               setPhase('Setup');

        // Sync video to swing time
        if (videoRef.current && allFrames.length > 0) {
          const startT = allFrames[0].time;
          const endT   = allFrames[allFrames.length - 1].time;
          videoRef.current.currentTime = startT + p * (endT - startT);
        }
        return next;
      });
    }, 30);
  };

  useEffect(() => {
    startReplay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SVG path from arc points
  const clampedProgress = Math.min(1, progress);
  const drawCount = Math.max(1, Math.floor(clampedProgress * arcPoints.length));
  const drawnPoints = arcPoints.slice(0, drawCount);
  const pathD = drawnPoints.length > 1
    ? drawnPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';
  const fullPathD = arcPoints.length > 1
    ? arcPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  // Ball flight after impact (shank → hard right)
  const ballProgress = Math.max(0, (clampedProgress - 0.68) / 0.32);
  const impactPt = arcPoints[Math.floor(arcPoints.length * 0.65)] ?? { x: 50, y: 70 };
  const ballX = impactPt.x + ballProgress * 30;
  const ballY = impactPt.y - ballProgress * 25 + ballProgress * ballProgress * 12;

  // Current club-head position
  const clubIdx = Math.min(Math.floor(clampedProgress * (arcPoints.length - 1)), arcPoints.length - 2);
  const clubT   = (clampedProgress * (arcPoints.length - 1)) - clubIdx;
  const clubPt  = arcPoints.length > 1 ? {
    x: arcPoints[clubIdx].x + (arcPoints[clubIdx + 1].x - arcPoints[clubIdx].x) * clubT,
    y: arcPoints[clubIdx].y + (arcPoints[clubIdx + 1].y - arcPoints[clubIdx].y) * clubT,
  } : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '0 14px 14px', background: C.bg,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '18px 0 12px' }}>
        <div style={{
          fontSize: 13, color: C.textMuted, letterSpacing: '0.08em',
          fontFamily: "'Space Grotesk', sans-serif", marginBottom: 5, textTransform: 'uppercase',
        }}>
          Your Swing
        </div>
        <div style={{
          fontSize: 21, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
          color: C.text, lineHeight: 1.3,
        }}>
          {done ? 'Swing traced' : 'Tracing the path...'}
        </div>
      </div>

      {/* Video + overlay */}
      <div style={{
        width: '100%', borderRadius: 14, position: 'relative', overflow: 'hidden',
        background: '#0a0e0a', border: `1px solid ${C.border}`, aspectRatio: '16/9',
        flexShrink: 0,
      }}>
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Swing arc SVG overlay */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Faint full path */}
          {fullPathD && (
            <path d={fullPathD} fill="none" stroke={C.accent} strokeWidth="0.8" opacity={0.15} />
          )}
          {/* Drawn arc */}
          {pathD && (
            <path
              d={pathD} fill="none" stroke={C.accent} strokeWidth="1.4"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${C.accent}60)` }}
            />
          )}
          {/* Club head dot */}
          {clubPt && !done && clampedProgress > 0.01 && (
            <circle
              cx={clubPt.x} cy={clubPt.y} r="2.2" fill={C.accent}
              style={{ filter: `drop-shadow(0 0 6px ${C.accent})` }}
            />
          )}
          {/* Ball flight */}
          {ballProgress > 0.05 && (
            <>
              <line
                x1={impactPt.x} y1={impactPt.y} x2={ballX} y2={ballY}
                stroke={C.bad} strokeWidth="0.5" strokeDasharray="1.2,1.8" opacity={0.5}
              />
              <circle
                cx={ballX} cy={ballY} r="1.8" fill={C.white}
                style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.7))' }}
              />
            </>
          )}
        </svg>

        {/* Phase label */}
        <div style={{
          position: 'absolute', bottom: 8, left: 10,
          padding: '4px 10px', borderRadius: 7,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: C.text,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>{phase}</span>
        </div>

        {/* Ball flight badge */}
        {ballProgress > 0.5 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            padding: '4px 10px', borderRadius: 7,
            background: C.badDim, border: `1px solid ${C.badBorder}`,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.bad,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>⚡ Ball: right</span>
          </div>
        )}
      </div>

      {/* Phase timeline */}
      <div style={{ display: 'flex', gap: 3, margin: '12px 0 0', padding: '0 2px' }}>
        {PHASES.map((p) => {
          const active   = clampedProgress >= p.tRatio;
          const isFault  = p.name === 'Top' || p.name === 'Impact';
          const barColor = active ? (isFault ? C.bad : C.good) : C.border;
          return (
            <div key={p.name} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2, background: barColor,
                opacity: active ? (isFault ? 1 : 0.5) : 0.3,
                transition: 'all 0.3s',
              }} />
              <div style={{
                fontSize: 9, marginTop: 4,
                color: active && isFault ? C.bad : active ? C.textSec : C.textMuted,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              }}>{p.name}</div>
            </div>
          );
        })}
      </div>

      {/* Result badge */}
      {done && (
        <div style={{
          background: C.badDim, border: `1px solid ${C.badBorder}`, borderRadius: 14,
          padding: '14px 16px', textAlign: 'center', marginTop: 12,
          animation: 'v3FadeIn 0.5s ease',
        }}>
          <div style={{ fontSize: 26, marginBottom: 5 }}>⚡</div>
          <div style={{
            fontSize: 17, fontWeight: 700, color: C.bad,
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4,
          }}>
            {shankRisk ? 'Shank detected' : faultCount > 0 ? `${faultCount} fault${faultCount > 1 ? 's' : ''} detected` : 'Clean swing'}
          </div>
          <div style={{
            fontSize: 13, color: C.textSec, lineHeight: 1.6,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {shankRisk
              ? 'Ball went right off the hosel. Two faults in your swing caused this.'
              : faultCount > 0
                ? `${faultCount} issue${faultCount > 1 ? 's' : ''} found in your swing mechanics.`
                : 'No major faults detected. Solid mechanics.'}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
        {done ? (
          <>
            <button
              onClick={() => onNavigate('diagnosis')}
              style={{
                width: '100%', padding: 15, borderRadius: 13, border: 'none',
                background: C.bad, color: C.white, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                minHeight: 44,
              }}
            >
              See What Happened →
            </button>
            <button
              onClick={startReplay}
              style={{
                width: '100%', padding: 12, borderRadius: 13,
                border: `1px solid ${C.border}`, background: 'none',
                color: C.textSec, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                minHeight: 44,
              }}
            >
              Replay ↻
            </button>
          </>
        ) : (
          <div style={{
            textAlign: 'center', fontSize: 12, color: C.textMuted,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Analyzing your swing...
          </div>
        )}
      </div>
    </div>
  );
}

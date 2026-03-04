import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SwingFrame, DetectedPhases } from './SwingStateMachine';

type V3Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';

interface Props {
  videoUrl:       string;
  allFrames:      SwingFrame[];
  detectedPhases: DetectedPhases;
  frameWidth:     number;   // video native pixel width (e.g. 1920)
  frameHeight:    number;   // video native pixel height (e.g. 1080)
  shankRisk:      boolean;
  faultCount:     number;
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
  accent:    '#6cb4ff',
  text:      '#e4e8e4',
  textSec:   '#90a090',
  textMuted: '#5a6a5a',
  white:     '#fff',
};

const PHASES = [
  { name: 'Setup',    tRatio: 0 },
  { name: 'Takeaway', tRatio: 0.05 },
  { name: 'Top',      tRatio: 0.20 },
  { name: 'Down',     tRatio: 0.40 },
  { name: 'Impact',   tRatio: 0.65 },
  { name: 'Finish',   tRatio: 0.85 },
];

export default function SwingReplayScreen({
  videoUrl, allFrames, detectedPhases,
  frameWidth, frameHeight,
  shankRisk, faultCount, onNavigate,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState('Setup');
  const [done, setDone]         = useState(false);
  const videoRef                = useRef<HTMLVideoElement>(null);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use true video pixel dimensions, falling back to sensible defaults
  const fw = frameWidth  || 640;
  const fh = frameHeight || 480;

  // Arc points in raw video pixel space — NO normalisation distortion
  const arcPoints = useMemo(() => {
    return allFrames
      .filter(f => f.wristMidpoint.confidence > 0.2)
      .map(f => ({ x: f.wristMidpoint.x, y: f.wristMidpoint.y }));
  }, [allFrames]);

  const startAnimation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    setPhase('Setup');
    setDone(false);

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.008;
        if (next >= 1.15) {
          clearInterval(intervalRef.current!);
          setDone(true);
          return 1.15;
        }
        const p = Math.min(next, 1);
        if      (p > 0.85) setPhase('Follow-Through');
        else if (p > 0.65) setPhase('Impact');
        else if (p > 0.40) setPhase('Downswing');
        else if (p > 0.20) setPhase('Top of Backswing');
        else if (p > 0.05) setPhase('Takeaway');
        else               setPhase('Setup');
        return next;
      });
    }, 30);
  }, []);

  // When video metadata loads, seek to swing start then begin animation
  const handleVideoReady = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const startTime = detectedPhases.address.time;
    if (Math.abs(vid.currentTime - startTime) > 0.05) {
      const onSeeked = () => {
        vid.removeEventListener('seeked', onSeeked);
        startAnimation();
      };
      vid.addEventListener('seeked', onSeeked);
      vid.currentTime = startTime;
    } else {
      startAnimation();
    }
  }, [detectedPhases.address.time, startAnimation]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const replay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const startTime = detectedPhases.address.time;
    const onSeeked = () => {
      vid.removeEventListener('seeked', onSeeked);
      startAnimation();
    };
    vid.addEventListener('seeked', onSeeked);
    vid.currentTime = startTime;
  }, [detectedPhases.address.time, startAnimation]);

  // ── Arc SVG rendering ────────────────────────────────────────────────────
  const clampedProgress = Math.min(1, progress);
  const drawCount       = Math.max(1, Math.floor(clampedProgress * arcPoints.length));
  const drawnPoints     = arcPoints.slice(0, drawCount);

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.length > 1
      ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(0)} ${p.y.toFixed(0)}`).join(' ')
      : '';

  const fullPathD  = toPath(arcPoints);
  const drawnPathD = toPath(drawnPoints);

  // Club-head dot position (interpolated along arc)
  const clubPt = (() => {
    if (arcPoints.length < 2 || clampedProgress <= 0.01 || done) return null;
    const idx = Math.min(
      Math.floor(clampedProgress * (arcPoints.length - 1)),
      arcPoints.length - 2,
    );
    const t = clampedProgress * (arcPoints.length - 1) - idx;
    return {
      x: arcPoints[idx].x + (arcPoints[idx + 1].x - arcPoints[idx].x) * t,
      y: arcPoints[idx].y + (arcPoints[idx + 1].y - arcPoints[idx].y) * t,
    };
  })();

  // Ball flight — shank flies hard right from impact point
  const ballProgress = Math.max(0, (clampedProgress - 0.68) / 0.32);
  const impactPt = arcPoints[Math.floor(arcPoints.length * 0.65)] ??
    { x: fw * 0.5, y: fh * 0.72 };
  const ballX = impactPt.x + ballProgress * fw * 0.22;
  const ballY = impactPt.y - ballProgress * fh * 0.22 + ballProgress * ballProgress * fh * 0.10;

  // Dot size proportional to video resolution
  const dotR  = fw * 0.012;  // ~7px on 640-wide, ~23px on 1920-wide
  const ballR = fw * 0.009;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '0 14px 14px', background: C.bg,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '16px 0 10px' }}>
        <div style={{
          fontSize: 13, color: C.textMuted, letterSpacing: '0.08em',
          fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4, textTransform: 'uppercase',
        }}>Your Swing</div>
        <div style={{
          fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
          color: C.text,
        }}>
          {done ? 'Swing traced' : 'Tracing the path...'}
        </div>
      </div>

      {/* Video + SVG arc overlay */}
      <div style={{
        width: '100%', position: 'relative', overflow: 'hidden',
        borderRadius: 12, background: '#050905',
        border: `1px solid ${C.border}`, flexShrink: 0,
        aspectRatio: `${fw} / ${fh}`,
      }}>
        {/* Actual video — paused at address frame */}
        <video
          ref={videoRef}
          src={videoUrl}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={handleVideoReady}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
          }}
        />

        {/* Arc SVG — same coordinate space as video frame */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${fw} ${fh}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Faint full-path ghost */}
          {fullPathD && (
            <path
              d={fullPathD} fill="none"
              stroke={C.accent} strokeWidth={fw * 0.004} opacity={0.18}
              strokeLinecap="round"
            />
          )}

          {/* Animated drawn arc */}
          {drawnPathD && (
            <path
              d={drawnPathD} fill="none"
              stroke={C.accent} strokeWidth={fw * 0.006}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 ${fw * 0.006}px ${C.accent}80)` }}
            />
          )}

          {/* Moving club-head dot */}
          {clubPt && (
            <circle
              cx={clubPt.x} cy={clubPt.y} r={dotR}
              fill={C.accent}
              style={{ filter: `drop-shadow(0 0 ${dotR * 1.5}px ${C.accent})` }}
            />
          )}

          {/* Ball flight after impact */}
          {ballProgress > 0.05 && (
            <>
              <line
                x1={impactPt.x} y1={impactPt.y}
                x2={ballX} y2={ballY}
                stroke={C.bad}
                strokeWidth={fw * 0.003}
                strokeDasharray={`${fw * 0.008},${fw * 0.012}`}
                opacity={0.55}
              />
              <circle
                cx={ballX} cy={ballY} r={ballR}
                fill={C.white}
                style={{ filter: `drop-shadow(0 0 ${ballR * 1.5}px rgba(255,255,255,0.8))` }}
              />
            </>
          )}
        </svg>

        {/* Phase label */}
        <div style={{
          position: 'absolute', bottom: 8, left: 10,
          padding: '4px 10px', borderRadius: 7,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: C.text,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>{phase}</span>
        </div>

        {/* Ball flight badge */}
        {shankRisk && ballProgress > 0.5 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            padding: '4px 10px', borderRadius: 7,
            background: C.badDim, border: `1px solid ${C.badBorder}`,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.bad,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>⚡ Hosel strike</span>
          </div>
        )}
      </div>

      {/* Phase timeline */}
      <div style={{ display: 'flex', gap: 3, margin: '10px 0 0', padding: '0 2px' }}>
        {PHASES.map((p) => {
          const active  = clampedProgress >= p.tRatio;
          const isFault = p.name === 'Top' || p.name === 'Impact';
          return (
            <div key={p.name} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: active ? (isFault ? C.bad : C.good) : C.border,
                opacity: active ? (isFault ? 1 : 0.5) : 0.3,
                transition: 'background 0.25s, opacity 0.25s',
              }} />
              <div style={{
                fontSize: 9, marginTop: 3,
                color: active && isFault ? C.bad : active ? C.textSec : C.textMuted,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              }}>{p.name}</div>
            </div>
          );
        })}
      </div>

      {/* Result badge (fades in on completion) */}
      {done && (
        <div style={{
          background: C.badDim, border: `1px solid ${C.badBorder}`, borderRadius: 14,
          padding: '14px 16px', textAlign: 'center', marginTop: 10,
          animation: 'v3FadeIn 0.5s ease',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: C.bad,
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4,
          }}>
            {shankRisk
              ? 'Shank detected'
              : faultCount > 0
                ? `${faultCount} fault${faultCount > 1 ? 's' : ''} detected`
                : 'Clean swing'}
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
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
        {done ? (
          <>
            <button
              onClick={() => onNavigate('diagnosis')}
              style={{
                width: '100%', padding: 15, borderRadius: 13, border: 'none',
                background: C.bad, color: C.white, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", minHeight: 44,
              }}
            >
              See What Happened →
            </button>
            <button
              onClick={replay}
              style={{
                width: '100%', padding: 12, borderRadius: 13,
                border: `1px solid ${C.border}`, background: 'none',
                color: C.textSec, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", minHeight: 44,
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
            Loading swing...
          </div>
        )}
      </div>
    </div>
  );
}

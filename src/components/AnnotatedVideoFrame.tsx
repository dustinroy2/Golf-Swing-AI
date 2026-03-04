import React, { useRef, useEffect } from 'react';

export interface Annotation {
  x: number;      // % of video frame width (0–100)
  y: number;      // % of video frame height (0–100)
  label: string;
  note: string;
  status: 'bad' | 'good';
}

interface Props {
  videoUrl:   string;    // blob URL of the uploaded video
  phaseTime:  number;    // seconds — seek to this time on mount
  annotations: Annotation[];
  phase:      string;    // phase label shown bottom-left
}

const BAD  = '#e84040';
const GOOD = '#2fbd56';
const TSEC = '#90a090';
const BORD = '#2a332a';

export default function AnnotatedVideoFrame({ videoUrl, phaseTime, annotations, phase }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Seek to phase time once video metadata is ready
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const seek = () => { vid.currentTime = phaseTime; };
    if (vid.readyState >= 1) {
      seek();
    } else {
      vid.addEventListener('loadedmetadata', seek, { once: true });
    }
    return () => { vid.removeEventListener('loadedmetadata', seek); };
  }, [phaseTime]);

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      background: '#060b06',
      borderRadius: 14,
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${BORD}`,
      flexShrink: 0,
    }}>
      {/* Actual video paused at phase time */}
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Semi-transparent overlay so annotations stay readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.32)',
        pointerEvents: 'none',
      }} />

      {/* Annotation dots + labels */}
      {annotations.map((ann, i) => {
        const col     = ann.status === 'good' ? GOOD : BAD;
        const isRight = ann.x > 55;
        return (
          <React.Fragment key={i}>
            {/* Dot */}
            <div style={{
              position: 'absolute',
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              width: 10, height: 10, borderRadius: 5,
              background: col,
              boxShadow: `0 0 8px ${col}80`,
              pointerEvents: 'none',
            }} />
            {/* Label */}
            <div style={{
              position: 'absolute',
              left:  isRight ? undefined : `calc(${ann.x}% + 7px)`,
              right: isRight ? `calc(${100 - ann.x}% + 7px)` : undefined,
              top:   `calc(${ann.y}% - 14px)`,
              zIndex: 4,
              padding: '4px 8px',
              borderRadius: 7,
              background: `${col}18`,
              border: `1px solid ${col}35`,
              backdropFilter: 'blur(8px)',
              maxWidth: 140,
              pointerEvents: 'none',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: col,
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {ann.status === 'good' ? '✓' : '✗'} {ann.label}
              </div>
              <div style={{
                fontSize: 10, color: '#a0b0a0', lineHeight: 1.4, marginTop: 2,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {ann.note}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Phase label bottom-left */}
      <div style={{
        position: 'absolute', bottom: 8, left: 10, zIndex: 5,
        padding: '4px 10px', borderRadius: 7,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: TSEC,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {phase}
        </span>
      </div>
    </div>
  );
}

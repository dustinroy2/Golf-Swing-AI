import React from 'react';

export interface Annotation {
  x: number;      // percent of frame width (0–100)
  y: number;      // percent of frame height (0–100)
  label: string;
  note: string;
  status: 'bad' | 'good';
}

interface Props {
  imgUrl:      string;          // data URL of captured phase frame
  annotations: Annotation[];
  phase:       string;
}

const BAD   = '#e84040';
const GOOD  = '#2fbd56';
const TSEC  = '#90a090';
const SURF  = '#131813';
const BORD  = '#2a332a';

export default function AnnotatedVideoFrame({ imgUrl, annotations, phase }: Props) {
  return (
    <div style={{
      width: '100%', aspectRatio: '16/9',
      background: imgUrl ? 'none' : SURF,
      borderRadius: 14, position: 'relative', overflow: 'hidden',
      border: `1px solid ${BORD}`, flexShrink: 0,
    }}>
      {/* Actual captured video frame */}
      {imgUrl && (
        <img
          src={imgUrl}
          alt={`Swing frame at ${phase}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Fallback silhouette when no frame captured */}
      {!imgUrl && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }} viewBox="0 0 200 112">
          <circle cx="100" cy="20" r="9"  fill="none" stroke={TSEC} strokeWidth="1.5" />
          <line x1="100" y1="29"  x2="100" y2="62"  stroke={TSEC} strokeWidth="1.5" />
          <line x1="80"  y1="40"  x2="120" y2="40"  stroke={TSEC} strokeWidth="1.5" />
          <line x1="100" y1="62"  x2="85"  y2="95"  stroke={TSEC} strokeWidth="1.5" />
          <line x1="100" y1="62"  x2="115" y2="95"  stroke={TSEC} strokeWidth="1.5" />
          <line x1="120" y1="40"  x2="138" y2="14"  stroke={TSEC} strokeWidth="1" />
        </svg>
      )}

      {/* Dim overlay to make annotations readable on real video frames */}
      {imgUrl && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      )}

      {/* Annotation dots + labels */}
      {annotations.map((ann, i) => {
        const col = ann.status === 'good' ? GOOD : BAD;
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
            }} />
            {/* Label */}
            <div style={{
              position: 'absolute',
              left:  isRight ? undefined : `calc(${ann.x}% + 8px)`,
              right: isRight ? `calc(${100 - ann.x}% + 8px)` : undefined,
              top:   `calc(${ann.y}% - 12px)`,
              zIndex: 4,
              padding: '5px 9px',
              borderRadius: 8,
              background: `${col}18`,
              border: `1px solid ${col}35`,
              backdropFilter: 'blur(8px)',
              maxWidth: 140,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: col,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.02em',
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
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
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

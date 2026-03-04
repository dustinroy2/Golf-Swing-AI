import React, { useState, useEffect } from 'react';
import { DetectedPhases } from './SwingStateMachine';

const PHASES = [
  { key: 'address',       label: 'Address'    },
  { key: 'takeaway',      label: 'Takeaway'   },
  { key: 'top',           label: 'Top'        },
  { key: 'impact',        label: 'Impact'     },
  { key: 'followThrough', label: 'Follow'     },
] as const;

type PhaseKey = typeof PHASES[number]['key'];

interface Props {
  phases:              DetectedPhases;
  videoRef:            React.RefObject<HTMLVideoElement | null>;
  secondaryVideoRef?:  React.RefObject<HTMLVideoElement | null>;
}

export default function PhaseSelector({ phases, videoRef, secondaryVideoRef }: Props) {
  const [activePhase, setActivePhase] = useState<PhaseKey>('address');

  // Track active phase from video currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const t = video.currentTime;
      let nearest: PhaseKey = 'address';
      let minDiff = Infinity;

      for (const { key } of PHASES) {
        const phaseTime = phases[key].time;
        const diff = Math.abs(phaseTime - t);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = key;
        }
      }
      setActivePhase(nearest);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [phases, videoRef]);

  const jumpTo = (key: PhaseKey) => {
    const time = phases[key].time;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (secondaryVideoRef?.current) {
      secondaryVideoRef.current.currentTime = time;
    }
    setActivePhase(key);
  };

  return (
    <div className="phase-selector">
      <div className="phase-dots">
        {PHASES.map(({ key, label }) => (
          <button
            key={key}
            className={`phase-dot-btn${activePhase === key ? ' active' : ''}`}
            onClick={() => jumpTo(key)}
          >
            <span className="phase-dot" />
            <span className="phase-dot-label">{label}</span>
          </button>
        ))}
      </div>
      <div className="phase-times">
        {PHASES.map(({ key, label }) => (
          <span key={key} className="phase-time-item">
            {label}: {phases[key].time.toFixed(2)}s
          </span>
        ))}
      </div>
    </div>
  );
}

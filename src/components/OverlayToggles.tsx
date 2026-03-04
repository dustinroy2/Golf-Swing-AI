import React from 'react';

// OverlayToggles is retired — kept for reference only.
interface OverlayState { skeleton: boolean; pro: boolean; angles: boolean; trail: boolean; }

interface Props {
  overlays: OverlayState;
  onChange: (s: OverlayState) => void;
  angle:    'dtl' | 'faceOn';
}

export default function OverlayToggles({ overlays, onChange, angle }: Props) {
  const toggle = (key: keyof OverlayState) => {
    onChange({ ...overlays, [key]: !overlays[key] });
  };

  const setAll = () => {
    onChange({ skeleton: true, pro: true, angles: true, trail: true });
  };

  const allOn = overlays.skeleton && overlays.pro && overlays.angles && overlays.trail;

  return (
    <div className="overlay-toggles">
      <button
        className={`overlay-toggle-btn${overlays.skeleton ? ' active' : ''}`}
        onClick={() => toggle('skeleton')}
      >
        👤 Skeleton
      </button>
      <button
        className={`overlay-toggle-btn${overlays.pro ? ' active' : ''}`}
        onClick={() => toggle('pro')}
      >
        👻 Pro
      </button>
      <button
        className={`overlay-toggle-btn${overlays.angles ? ' active' : ''}`}
        onClick={() => toggle('angles')}
      >
        📐 Angles
      </button>
      <button
        className={`overlay-toggle-btn${overlays.trail ? ' active' : ''}${angle === 'faceOn' ? ' disabled' : ''}`}
        onClick={() => angle === 'dtl' && toggle('trail')}
        title={angle === 'faceOn' ? 'Club trail only available in DTL view' : undefined}
      >
        🏌️ Trail
      </button>
      <button
        className={`overlay-toggle-btn${allOn ? ' active' : ''}`}
        onClick={setAll}
      >
        ⚡ All
      </button>
    </div>
  );
}

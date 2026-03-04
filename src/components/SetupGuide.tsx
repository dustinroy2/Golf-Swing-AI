import React, { useState, Suspense, lazy } from 'react';

const SwingModel = lazy(() => import('./SwingModel'));


const ChecklistItem = ({ done, text }: { done?: boolean; text: string }) => (
  <div className="checklist-item">
    <span className={`check-icon ${done ? 'check-done' : 'check-todo'}`}>
      {done ? '✅' : '○'}
    </span>
    <span>{text}</span>
  </div>
);

export default function SetupGuide({ onLaunchAssistant }: { onLaunchAssistant: () => void }) {
  const [swingType, setSwingType] = useState<'dtl' | 'faceOn'>(
    () => (localStorage.getItem('swingType') as 'dtl' | 'faceOn') ?? 'dtl'
  );
  const [showMoreTips, setShowMoreTips] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(new Array(8).fill(false));

  const handleSwingTypeChange = (type: 'dtl' | 'faceOn') => {
    setSwingType(type);
    localStorage.setItem('swingType', type);
  };

  const toggleCheck = (i: number) => {
    const next = [...checklist];
    next[i] = !next[i];
    setChecklist(next);
  };

  const checklistItems = [
    'Alignment stick on ground pointing at target',
    'Phone mounted at wrist height',
    '8–12 feet behind you (DTL) or beside you (FO)',
    'Slo-Mo 240fps selected in Camera app',
    'Grid turned on (Settings → Camera → Grid)',
    'AE/AF Lock engaged (tap & hold on screen)',
    'Sun is behind the camera',
    'Full body + club visible in test clip',
  ];

  const allChecked = checklist.every(Boolean);

  return (
    <div className="setup-guide">

      {/* Page label */}
      <div className="setup-page-label">Camera Setup</div>

      {/* 3D Camera Setup Viewer */}
      <Suspense fallback={
        <div className="diagram-hero" style={{ justifyContent: 'center', minHeight: 120, color: '#8b949e', fontSize: '0.85rem' }}>
          ⚙️ Loading 3D viewer...
        </div>
      }>
        <SwingModel />
      </Suspense>

      {/* 3 Camera Position Cards */}
      <div className="camera-position-cards">
        <div className="camera-card">
          <div className="camera-card-icon">📱</div>
          <strong>Phone Placement</strong>
          <p>
            {swingType === 'dtl'
              ? '8–12 ft behind you, directly down the line'
              : '8–12 ft beside you, perpendicular to target line'}
          </p>
        </div>
        <div className="camera-card">
          <div className="camera-card-icon">📏</div>
          <strong>Height</strong>
          <p>Mount between hip and shoulder height — mid-torso is ideal</p>
        </div>
        <div className="camera-card">
          <div className="camera-card-icon">📐</div>
          <strong>Angle</strong>
          <p>
            {swingType === 'dtl'
              ? 'Perpendicular to the target line, pointed straight at your back'
              : 'Straight-on, pointed at your chest and face'}
          </p>
        </div>
      </div>

      {/* Launch Assistant CTA */}
      <button className="launch-assistant-btn" onClick={onLaunchAssistant}>
        ▶ Launch Live Setup Assistant
      </button>

      {/* Collapsible More Setup Tips */}
      <div className="more-tips-section">
        <button
          className="more-tips-toggle"
          onClick={() => setShowMoreTips(v => !v)}
        >
          {showMoreTips ? '▼' : '▶'} More Setup Tips
        </button>

        {showMoreTips && (
          <>
            {/* iPhone Settings */}
            <div className="guide-section">
              <div className="section-label">IPHONE SETTINGS</div>
              <div className="settings-grid">
                <div className="setting-card">
                  <div className="setting-icon">🎬</div>
                  <strong>Slow Motion</strong>
                  <p>Camera app → Slo-Mo<br />Set to 240fps if available</p>
                  <div className="setting-path">Settings → Camera → Record Slo-mo → 240 FPS</div>
                </div>
                <div className="setting-card">
                  <div className="setting-icon">⊞</div>
                  <strong>Grid Overlay</strong>
                  <p>Helps level the camera perfectly</p>
                  <div className="setting-path">Settings → Camera → Composition → Grid ON</div>
                </div>
                <div className="setting-card">
                  <div className="setting-icon">🔒</div>
                  <strong>Lock Focus</strong>
                  <p>Prevents camera hunting mid-swing</p>
                  <div className="setting-path">Tap & hold where you'll stand → AE/AF LOCK</div>
                </div>
                <div className="setting-card">
                  <div className="setting-icon">📡</div>
                  <strong>Rear Camera</strong>
                  <p>Always use rear camera — much better quality</p>
                  <div className="setting-path">Flip camera icon if front-facing is active</div>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="guide-section">
              <div className="section-label">RECOMMENDED EQUIPMENT</div>
              <div className="equipment-grid">
                <div className="equipment-card best">
                  <div className="equipment-badge">BEST</div>
                  <div className="equipment-icon">🏌️</div>
                  <strong>Alignment Stick Mount</strong>
                  <p>Clips to your alignment stick. Plants in the ground. Holds your phone at the perfect angle.</p>
                  <div className="equipment-price">~$15–20 on Amazon</div>
                </div>
                <div className="equipment-card good">
                  <div className="equipment-badge">GOOD</div>
                  <div className="equipment-icon">🦒</div>
                  <strong>GorillaPod</strong>
                  <p>Flexible legs wrap around your bag or range dividers. Very portable.</p>
                  <div className="equipment-price">~$30 on Amazon</div>
                </div>
                <div className="equipment-card ok">
                  <div className="equipment-badge">OK</div>
                  <div className="equipment-icon">📱</div>
                  <strong>Mini Tripod</strong>
                  <p>Basic phone tripod. Cheap, stable, consistent.</p>
                  <div className="equipment-price">~$20 on Amazon</div>
                </div>
              </div>
            </div>

            {/* Pre-session Checklist */}
            <div className="guide-section">
              <div className="section-label">PRE-SESSION CHECKLIST</div>
              <p className="section-desc">Tap each item to check it off before you start recording.</p>
              <div className="checklist">
                {checklistItems.map((item, i) => (
                  <div key={i} onClick={() => toggleCheck(i)} style={{ cursor: 'pointer' }}>
                    <ChecklistItem done={checklist[i]} text={item} />
                  </div>
                ))}
              </div>
              {allChecked && (
                <div className="all-checked">
                  ✅ Perfect setup! You're ready to record.
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}

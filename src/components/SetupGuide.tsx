import React, { useState, useEffect, Suspense, lazy } from 'react';

const SwingModel = lazy(() => import('./SwingModel'));

const PHASES = ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'];

const GolferSVG = ({ phase }: { phase: number }) => {
  // SVG golfer positions for each phase
  const configs = [
    // Address
    { bodyRotate: 0, armAngle: 10, clubAngle: 95, hipShift: 0, headX: 50, headY: 18 },
    // Takeaway
    { bodyRotate: -15, armAngle: -20, clubAngle: 45, hipShift: -3, headX: 50, headY: 18 },
    // Top
    { bodyRotate: -35, armAngle: -60, clubAngle: -10, hipShift: -5, headX: 50, headY: 18 },
    // Impact
    { bodyRotate: 15, armAngle: 5, clubAngle: 85, hipShift: 5, headX: 50, headY: 19 },
    // Follow Through
    { bodyRotate: 40, armAngle: 70, clubAngle: 170, hipShift: 8, headX: 52, headY: 17 },
  ];

  const c = configs[phase];

  return (
    <svg viewBox="0 0 100 120" className="golfer-svg">
      {/* Alignment line (toe to toe extended) */}
      <line x1="5" y1="98" x2="95" y2="98" stroke="#58a6ff" strokeWidth="1.5"
        strokeDasharray="4,2" opacity="0.7" />
      {/* Ball */}
      <circle cx="50" cy="98" r="2.5" fill="#fff" opacity="0.9" />
      {/* Left foot */}
      <ellipse cx={42 + c.hipShift} cy="96" rx="6" ry="2.5" fill="#4a5568" />
      {/* Right foot */}
      <ellipse cx={58 + c.hipShift} cy="96" rx="6" ry="2.5" fill="#4a5568" />
      {/* Left leg */}
      <line x1={42 + c.hipShift} y1="96" x2={44 + c.hipShift / 2} y2="78"
        stroke="#58a6ff" strokeWidth="3" strokeLinecap="round" />
      {/* Right leg */}
      <line x1={58 + c.hipShift} y1="96" x2={56 + c.hipShift / 2} y2="78"
        stroke="#58a6ff" strokeWidth="3" strokeLinecap="round" />
      {/* Body */}
      <g transform={`rotate(${c.bodyRotate}, ${50 + c.hipShift}, 78)`}>
        {/* Torso */}
        <line x1={50 + c.hipShift} y1="78" x2={50 + c.hipShift} y2="50"
          stroke="#bc8cff" strokeWidth="3.5" strokeLinecap="round" />
        {/* Arms + Club */}
        <g transform={`rotate(${c.armAngle}, ${50 + c.hipShift}, 55)`}>
          {/* Lead arm */}
          <line x1={50 + c.hipShift} y1="55" x2={50 + c.hipShift + 18} y2="65"
            stroke="#e6edf3" strokeWidth="2.5" strokeLinecap="round" />
          {/* Trail arm */}
          <line x1={50 + c.hipShift} y1="55" x2={50 + c.hipShift + 14} y2="67"
            stroke="#e6edf3" strokeWidth="2" strokeLinecap="round" />
          {/* Club */}
          <g transform={`rotate(${c.clubAngle - c.armAngle}, ${50 + c.hipShift + 18}, 65)`}>
            <line x1={50 + c.hipShift + 18} y1="65"
              x2={50 + c.hipShift + 18} y2="98"
              stroke="#f0883e" strokeWidth="1.5" strokeLinecap="round" />
            {/* Club head */}
            <rect x={50 + c.hipShift + 15} y="96" width="7" height="4"
              rx="1" fill="#f0883e" opacity="0.9" />
          </g>
        </g>
        {/* Shoulders */}
        <line x1={50 + c.hipShift - 12} y1="52" x2={50 + c.hipShift + 12} y2="52"
          stroke="#bc8cff" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Head */}
      <circle cx={c.headX} cy={c.headY} r="7" fill="#e6edf3" opacity="0.95" />
      {/* Phase label */}
      <text x="50" y="112" textAnchor="middle" fill="#8b949e"
        fontSize="7" fontFamily="system-ui">{PHASES[phase]}</text>
    </svg>
  );
};

const TopDownDiagram = ({ angle }: { angle: 'dtl' | 'faceOn' }) => (
  <svg viewBox="0 0 160 120" className="diagram-svg">
    {/* Ground */}
    <rect width="160" height="120" fill="#0d1117" rx="8" />
    {/* Target line */}
    <line x1="80" y1="10" x2="80" y2="110" stroke="#58a6ff"
      strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />
    {/* Alignment line (toe to toe) */}
    <line x1="20" y1="75" x2="140" y2="75" stroke="#3fb950"
      strokeWidth="1.5" strokeDasharray="4,2" />
    <text x="145" y="78" fill="#3fb950" fontSize="7">←→</text>
    {/* Golfer top-down (oval) */}
    <ellipse cx="80" cy="70" rx="10" ry="15" fill="#bc8cff" opacity="0.8" />
    {/* Feet dots */}
    <circle cx="70" cy="78" r="3" fill="#58a6ff" />
    <circle cx="90" cy="78" r="3" fill="#58a6ff" />
    {/* Ball */}
    <circle cx="80" cy="55" r="3" fill="white" />
    <text x="85" y="54" fill="#8b949e" fontSize="6">ball</text>
    {/* Camera position */}
    {angle === 'dtl' ? (
      <>
        <rect x="68" y="100" width="24" height="14" rx="3"
          fill="#f0883e" opacity="0.9" />
        <text x="80" y="110" textAnchor="middle" fill="#000" fontSize="6" fontWeight="bold">📱</text>
        <text x="80" y="118" textAnchor="middle" fill="#f0883e" fontSize="6">DTL</text>
        {/* Distance arrow */}
        <line x1="80" y1="85" x2="80" y2="98" stroke="#f0883e"
          strokeWidth="1" markerEnd="url(#arrow)" />
        <text x="84" y="93" fill="#f0883e" fontSize="5.5">10ft</text>
      </>
    ) : (
      <>
        <rect x="130" y="62" width="24" height="14" rx="3"
          fill="#f0883e" opacity="0.9" />
        <text x="142" y="72" textAnchor="middle" fill="#000" fontSize="6" fontWeight="bold">📱</text>
        <text x="142" y="82" textAnchor="middle" fill="#f0883e" fontSize="6">FO</text>
        <line x1="92" y1="70" x2="128" y2="70" stroke="#f0883e"
          strokeWidth="1" />
        <text x="110" y="67" fill="#f0883e" fontSize="5.5">10ft</text>
      </>
    )}
    {/* Legend */}
    <circle cx="15" cy="108" r="3" fill="#3fb950" />
    <text x="21" y="111" fill="#8b949e" fontSize="5.5">alignment line</text>
    <circle cx="15" cy="116" r="3" fill="white" />
    <text x="21" y="119" fill="#8b949e" fontSize="5.5">ball position</text>
  </svg>
);

const ChecklistItem = ({ done, text }: { done?: boolean; text: string }) => (
  <div className="checklist-item">
    <span className={`check-icon ${done ? 'check-done' : 'check-todo'}`}>
      {done ? '✅' : '○'}
    </span>
    <span>{text}</span>
  </div>
);

export default function SetupGuide({ onLaunchAssistant }: { onLaunchAssistant: () => void }) {
  const [activePhase, setActivePhase] = useState(0);
  const [activeAngle, setActiveAngle] = useState<'dtl' | 'faceOn'>('dtl');
  const [checklist, setChecklist] = useState<boolean[]>(new Array(8).fill(false));

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase(p => (p + 1) % 5);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

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

      {/* Hero */}
      <div className="setup-hero">
        <h2>📐 Camera Setup Guide</h2>
        <p>Get your camera position right before you swing.<br />
          Proper setup = accurate analysis.</p>
      </div>

      {/* 3D Swing Model */}
      <div className="guide-section">
        <div className="section-label">CAMERA SETUP & PLACEMENT</div>
        <p className="section-desc">
          See your swing from both camera angles. Switch to Aerial Map to see exactly where to place your phone.
        </p>
        <Suspense fallback={
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b22', borderRadius: '12px', color: '#58a6ff' }}>
            Loading 3D model...
          </div>
        }>
          <SwingModel />
        </Suspense>
      </div>

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

      {/* Launch Assistant */}
      <div className="guide-section">
        <div className="section-label">LIVE SETUP ASSISTANT</div>
        <p className="section-desc">
          Use your camera to get real-time alignment feedback.
          The app will draw a virtual alignment line toe-to-toe and
          tell you when your framing is perfect.
        </p>
        <button className="launch-assistant-btn" onClick={onLaunchAssistant}>
          🎯 Launch Setup Assistant
        </button>
      </div>

    </div>
  );
}

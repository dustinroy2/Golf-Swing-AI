import React, { useState } from 'react';

type SwingType = 'dtl' | 'faceOn';
type Handedness = 'right' | 'left';

interface Props {
  onComplete: () => void;
}

// ── Slide visuals (SVG illustrations, dark theme) ─────────────────────────────

const Slide1Visual = () => (
  <div className="ob-visual ob-visual-1">
    <div className="ob-glow" />
    <div className="ob-emoji">⛳</div>
    <svg className="ob-arc" viewBox="0 0 280 160" fill="none">
      <path d="M20 140 Q80 20 140 10 Q200 20 260 140"
        stroke="#3fb950" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
      <path d="M40 140 Q90 50 140 38 Q190 50 240 140"
        stroke="#58a6ff" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.25" />
    </svg>
  </div>
);

const Slide2Visual = () => (
  <div className="ob-visual ob-visual-2">
    {/* Golfer silhouette */}
    <svg className="ob-golfer-detect" viewBox="0 0 200 260" fill="none">
      {/* Body */}
      <circle cx="100" cy="38" r="18" stroke="#8b949e" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="56" x2="100" y2="130" stroke="#8b949e" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="68" y1="80" x2="132" y2="80" stroke="#8b949e" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <line x1="100" y1="130" x2="75" y2="190" stroke="#8b949e" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="100" y1="130" x2="125" y2="190" stroke="#8b949e" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      {/* Green detection box — corner brackets */}
      <path d="M40 20 L40 10 L55 10" stroke="#3fb950" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M160 20 L160 10 L145 10" stroke="#3fb950" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 200 L40 210 L55 210" stroke="#3fb950" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M160 200 L160 210 L145 210" stroke="#3fb950" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shoulder detection line */}
      <line x1="60" y1="78" x2="140" y2="78" stroke="#3fb950" strokeWidth="2.5" opacity="0.8" />
    </svg>
  </div>
);

const Slide3Visual = () => (
  <div className="ob-visual ob-visual-3">
    <svg className="ob-skeleton" viewBox="0 0 200 290" fill="none">
      {/* Extended leg lines to ground */}
      <line x1="82" y1="218" x2="82" y2="280" stroke="#3fb950" strokeWidth="1.5" opacity="0.35" />
      <line x1="118" y1="218" x2="118" y2="280" stroke="#3fb950" strokeWidth="1.5" opacity="0.35" />
      {/* Bones */}
      <g stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round">
        {/* Spine (torso) */}
        <line x1="100" y1="120" x2="100" y2="170" />
        {/* Shoulders */}
        <line x1="68" y1="125" x2="132" y2="125" />
        {/* Left arm (bent at top of backswing) */}
        <line x1="68" y1="125" x2="50" y2="95" />
        <line x1="50" y1="95" x2="60" y2="65" />
        {/* Right arm */}
        <line x1="132" y1="125" x2="118" y2="100" />
        <line x1="118" y1="100" x2="105" y2="72" />
        {/* Hips */}
        <line x1="82" y1="170" x2="118" y2="170" />
        {/* Left leg */}
        <line x1="82" y1="170" x2="80" y2="218" />
        {/* Right leg */}
        <line x1="118" y1="170" x2="118" y2="218" />
        {/* Club shaft */}
        <line x1="60" y1="65" x2="95" y2="28" strokeWidth="1.5" opacity="0.7" />
      </g>
      {/* Club head */}
      <rect x="86" y="20" width="12" height="8" rx="2" fill="#3fb950" opacity="0.7" />
      {/* Joints (large circles) */}
      <g fill="#3fb950">
        <circle cx="100" cy="42" r="8" /> {/* head */}
        <circle cx="68" cy="125" r="6" /> {/* left shoulder */}
        <circle cx="132" cy="125" r="6" /> {/* right shoulder */}
        <circle cx="50" cy="95" r="5.5" /> {/* left elbow */}
        <circle cx="118" cy="100" r="5.5" /> {/* right elbow */}
        <circle cx="60" cy="65" r="5" /> {/* left wrist */}
        <circle cx="105" cy="72" r="5" /> {/* right wrist */}
        <circle cx="82" cy="170" r="6" /> {/* left hip */}
        <circle cx="118" cy="170" r="6" /> {/* right hip */}
        <circle cx="80" cy="218" r="5" /> {/* left ankle */}
        <circle cx="118" cy="218" r="5" /> {/* right ankle */}
      </g>
    </svg>
  </div>
);

const Slide4Visual = () => (
  <div className="ob-visual ob-visual-4">
    <div className="ob-score-preview">
      <div className="ob-score-card">
        <div className="ob-score-num" style={{ color: '#3fb950' }}>78</div>
        <div className="ob-score-label">Swing Score</div>
        <div className="ob-score-coverage">3/3 checks assessed</div>
      </div>
      <div className="ob-fault-preview">
        <span className="ob-fault-dot" />
        <span>Early Extension</span>
        <span className="ob-fault-phase">Impact</span>
      </div>
      <div className="ob-tempo-preview">
        <span>Tempo</span>
        <span className="ob-tempo-val">2.9:1</span>
        <span className="ob-tempo-badge">✓ Tour range</span>
      </div>
    </div>
  </div>
);

// ── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    Visual: Slide1Visual,
    headline: 'When your swing breaks down — do you know where the problem lies?',
    subtext: '',
  },
  {
    Visual: Slide2Visual,
    headline: 'AI reads every joint in your body — from address to finish',
    subtext: '',
  },
  {
    Visual: Slide3Visual,
    headline: 'Pinpoint faults at every phase with confidence-gated tracking',
    subtext: 'We tell you when we\'re unsure — not just when it looks bad',
  },
  {
    Visual: Slide4Visual,
    headline: 'Your swing score and top fault in under 60 seconds',
    subtext: 'On-device. No internet required.',
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function Onboarding({ onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionStep, setQuestionStep] = useState(0);
  const [handedness, setHandedness] = useState<Handedness>('right');
  const [swingType, setSwingType] = useState<SwingType>('dtl');

  const isLastSlide = slide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      setShowQuestionnaire(true);
    } else {
      setSlide(s => s + 1);
    }
  };

  const handleQuestionNext = () => {
    if (questionStep === 0) {
      localStorage.setItem('handedness', handedness);
      setQuestionStep(1);
    } else {
      localStorage.setItem('swingType', swingType);
      localStorage.setItem('handedness', handedness);
      localStorage.setItem('onboardingComplete', 'true');
      onComplete();
    }
  };

  if (showQuestionnaire) {
    return (
      <div className="onboarding">
        <div className="profile-setup">
          {questionStep === 0 ? (
            <>
              <div className="profile-header">
                <h2>Right-handed or left-handed?</h2>
                <p className="profile-helper">We'll adjust how faults are described for your swing direction</p>
              </div>
              <div className="profile-illustration">🏌️</div>
              <div className="profile-toggle">
                <button
                  className={`profile-toggle-btn${handedness === 'right' ? ' active' : ''}`}
                  onClick={() => setHandedness('right')}
                >
                  Right-handed
                </button>
                <button
                  className={`profile-toggle-btn${handedness === 'left' ? ' active' : ''}`}
                  onClick={() => setHandedness('left')}
                >
                  Left-handed
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="profile-header">
                <h2>How do you usually film your swing?</h2>
                <p className="profile-helper">You can change this anytime in the Setup tab</p>
              </div>
              <div className="profile-illustration">📱</div>
              <div className="profile-toggle">
                <button
                  className={`profile-toggle-btn${swingType === 'dtl' ? ' active' : ''}`}
                  onClick={() => setSwingType('dtl')}
                >
                  Down the Line
                </button>
                <button
                  className={`profile-toggle-btn${swingType === 'faceOn' ? ' active' : ''}`}
                  onClick={() => setSwingType('faceOn')}
                >
                  Face-On
                </button>
              </div>
            </>
          )}

          <div className="profile-step-dots">
            <span className={`profile-step-dot${questionStep === 0 ? ' active' : ''}`} />
            <span className={`profile-step-dot${questionStep === 1 ? ' active' : ''}`} />
          </div>

          <button className="ob-complete-btn" onClick={handleQuestionNext}>
            {questionStep === 0 ? 'Next →' : 'Get Started →'}
          </button>
        </div>
      </div>
    );
  }

  const { Visual, headline, subtext } = SLIDES[slide];

  return (
    <div className="onboarding">
      <div className="ob-visual-wrap">
        <Visual />
      </div>

      <div className="ob-text-wrap">
        <div className="ob-dots">
          {SLIDES.map((_, i) => (
            <span key={i} className={`ob-dot${i === slide ? ' active' : ''}`} />
          ))}
        </div>

        <p className="ob-headline">{headline}</p>
        {subtext && <p className="ob-subtext">{subtext}</p>}

        <button
          className={isLastSlide ? 'ob-start-btn' : 'ob-next-btn'}
          onClick={handleNext}
        >
          {isLastSlide ? 'Get Started →' : 'Next'}
        </button>
      </div>
    </div>
  );
}

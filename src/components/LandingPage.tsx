import React from 'react';

type Tab = 'home' | 'setup' | 'upload' | 'live' | 'history';

interface WorkflowCard {
  number: number;
  icon: string;
  title: string;
  description: string;
  tab: Tab;
}

const cards: WorkflowCard[] = [
  {
    number: 1,
    icon: '📐',
    title: 'Camera Setup',
    description: 'Position your phone correctly before recording. Choose DTL or Face-On.',
    tab: 'setup',
  },
  {
    number: 2,
    icon: '📹',
    title: 'Analyze Swing',
    description: 'Upload a recorded swing for full fault analysis and tempo chart.',
    tab: 'upload',
  },
  {
    number: 3,
    icon: '🎥',
    title: 'Live Mode',
    description: 'Real-time analysis while you hit at the range.',
    tab: 'live',
  },
  {
    number: 4,
    icon: '📊',
    title: 'History',
    description: 'Track your fault trends and score improvement over time.',
    tab: 'history',
  },
];

export default function LandingPage({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <span className="landing-logo">⛳</span>
        <h1 className="landing-title">Shank</h1>
        <p className="landing-tagline">Find your shank before it finds you.</p>
      </div>

      <div className="workflow-cards">
        {cards.map(card => (
          <button key={card.tab} className="workflow-card" onClick={() => onNavigate(card.tab)}>
            <span className="workflow-number">{card.number}</span>
            <div className="workflow-icon">{card.icon}</div>
            <div className="workflow-content">
              <h3 className="workflow-title">{card.title}</h3>
              <p className="workflow-desc">{card.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

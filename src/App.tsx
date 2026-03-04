import React, { useState } from 'react';
import './App.css';
import VideoAnalyzer from './components/VideoAnalyzer';
import LiveCamera from './components/LiveCamera';
import History from './components/History';
import SetupGuide from './components/SetupGuide';
import SetupAssistant from './components/SetupAssistant';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';

type Tab = 'home' | 'setup' | 'upload' | 'live' | 'history';
type SetupView = 'guide' | 'assistant';

function App() {
  const [onboardingDone, setOnboardingDone] = useState(
    localStorage.getItem('onboardingComplete') === 'true'
  );
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [setupView, setSetupView] = useState<SetupView>('guide');

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'setup') setSetupView('guide');
  };

  if (!onboardingDone) {
    return <Onboarding onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⛳</span>
          <div>
            <h1>Shank</h1>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'home' && <LandingPage onNavigate={switchTab} />}
        {activeTab === 'setup' && setupView === 'guide' && (
          <SetupGuide onLaunchAssistant={() => setSetupView('assistant')} />
        )}
        {activeTab === 'setup' && setupView === 'assistant' && (
          <SetupAssistant onBack={() => setSetupView('guide')} />
        )}
        {activeTab === 'upload' && <VideoAnalyzer />}
        {activeTab === 'live' && <LiveCamera />}
        {activeTab === 'history' && <History />}
      </main>

      <nav className="bottom-nav">
        <button
          className={activeTab === 'home' ? 'active' : ''}
          onClick={() => switchTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={activeTab === 'setup' ? 'active' : ''}
          onClick={() => switchTab('setup')}
        >
          <span className="nav-icon">📐</span>
          <span className="nav-label">Setup</span>
        </button>
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => switchTab('upload')}
        >
          <span className="nav-icon">📹</span>
          <span className="nav-label">Analyze</span>
        </button>
        <button
          className={activeTab === 'live' ? 'active' : ''}
          onClick={() => switchTab('live')}
        >
          <span className="nav-icon">🎥</span>
          <span className="nav-label">Live</span>
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => switchTab('history')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">History</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

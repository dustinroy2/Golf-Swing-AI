import React, { useState } from 'react';
import './App.css';
import VideoAnalyzer from './components/VideoAnalyzer';
import LiveCamera from './components/LiveCamera';
import History from './components/History';
import SetupGuide from './components/SetupGuide';
import SetupAssistant from './components/SetupAssistant';

type Tab = 'setup' | 'upload' | 'live' | 'history';
type SetupView = 'guide' | 'assistant';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('setup');
  const [setupView, setSetupView] = useState<SetupView>('guide');

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'setup') setSetupView('guide');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⛳</span>
          <div>
            <h1>Golf Swing AI</h1>
            <p>Swing smarter. Never freeze. Never guess.</p>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'setup' ? 'active' : ''}
          onClick={() => switchTab('setup')}
        >
          📐 Setup
        </button>
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => switchTab('upload')}
        >
          📹 Analyze
        </button>
        <button
          className={activeTab === 'live' ? 'active' : ''}
          onClick={() => switchTab('live')}
        >
          🎥 Live
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => switchTab('history')}
        >
          📊 History
        </button>
      </nav>

      <main className="app-main">
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
    </div>
  );
}

export default App;

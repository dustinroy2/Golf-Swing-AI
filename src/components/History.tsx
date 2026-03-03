import React, { useEffect, useState } from 'react';

interface SwingRecord {
  date: string;
  score: number;
  faults: string[];
}

export default function History() {
  const [history, setHistory] = useState<SwingRecord[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('swingHistory') || '[]');
    setHistory(saved);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('swingHistory');
    setHistory([]);
  };

  const faultFrequency = () => {
    const counts: Record<string, number> = {};
    history.forEach(record => {
      record.faults.forEach(fault => {
        counts[fault] = (counts[fault] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <span style={{ fontSize: '3rem' }}>📊</span>
        <h3>No swings analyzed yet</h3>
        <p>Upload a swing video to get started!</p>
      </div>
    );
  }

  const freqFaults = faultFrequency();
  const avgScore = Math.round(history.reduce((a, b) => a + b.score, 0) / history.length);

  return (
    <div className="history">
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Swings Analyzed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{
            color: avgScore >= 80 ? '#3fb950' : avgScore >= 60 ? '#d29922' : '#f85149'
          }}>{avgScore}</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{history[0].score}</div>
          <div className="stat-label">Latest Score</div>
        </div>
      </div>

      {freqFaults.length > 0 && (
        <div className="freq-faults">
          <h3>Most Frequent Faults</h3>
          {freqFaults.map(([fault, count], i) => (
            <div key={i} className="freq-fault-row">
              <span className="freq-fault-name">{fault}</span>
              <div className="freq-bar-wrap">
                <div
                  className="freq-bar"
                  style={{ width: `${(count / history.length) * 100}%` }}
                />
              </div>
              <span className="freq-count">{count}x</span>
            </div>
          ))}
        </div>
      )}

      <div className="history-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Swing History</h3>
          <button className="clear-btn" onClick={clearHistory}>Clear All</button>
        </div>
        {history.map((record, i) => (
          <div key={i} className="history-row">
            <div className="history-date">
              {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
            </div>
            <div className="history-score" style={{
              color: record.score >= 80 ? '#3fb950' : record.score >= 60 ? '#d29922' : '#f85149'
            }}>
              {record.score}
            </div>
            <div className="history-faults">
              {record.faults.length === 0
                ? <span style={{ color: '#3fb950' }}>No faults</span>
                : record.faults.map((f, j) => (
                  <span key={j} className="fault-tag">{f}</span>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

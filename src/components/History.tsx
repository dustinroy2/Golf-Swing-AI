import React, { useEffect, useState } from 'react';

interface SwingRecord {
  date:           string;
  score:          number;
  faults:         string[];
  assessedCount?: number; // optional — older records won't have this
  totalChecks?:   number;
}

// SVG line chart of the last 30 swing scores
function ScoreTrendChart({ records }: { records: SwingRecord[] }) {
  const data    = records.slice(0, 30).reverse(); // oldest→newest left→right
  const n       = data.length;
  if (n < 2) return null;

  const W = 300, H = 70, PAD = 8;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const toX = (i: number) => PAD + (i / (n - 1)) * plotW;
  const toY = (s: number) => PAD + plotH - (s / 100) * plotH;

  // Polyline points
  const points = data.map((r, i) => `${toX(i)},${toY(r.score)}`).join(' ');

  // Trend color — dead zone of ±2.5 points to avoid misleading hair-trigger color flips
  const mid      = Math.floor(n / 2);
  const firstAvg = data.slice(0, mid).reduce((a, b) => a + b.score, 0) / mid;
  const lastAvg  = data.slice(mid).reduce((a, b)  => a + b.score, 0) / (n - mid);
  const diff     = lastAvg - firstAvg;
  const trendColor = diff >  2.5 ? '#3fb950'
                   : diff < -2.5 ? '#f85149'
                   : '#8b949e'; // neutral — no meaningful trend

  return (
    <div className="trend-chart">
      <div className="trend-title">Score Trend — Last {n} Swings</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg">
        {/* 80 and 60 reference lines */}
        {[60, 80].map(v => (
          <line key={v}
            x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)}
            stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3"
          />
        ))}
        {/* Score line */}
        <polyline
          points={points}
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots — hollow for partial sessions, filled for fully-assessed */}
        {data.map((r, i) => {
          const color    = r.score >= 80 ? '#3fb950' : r.score >= 60 ? '#d29922' : '#f85149';
          const partial  = r.assessedCount !== undefined && r.totalChecks !== undefined
                        && r.assessedCount < r.totalChecks;
          return (
            <circle key={i}
              cx={toX(i)} cy={toY(r.score)} r="2.5"
              fill={partial ? 'none' : color}
              stroke={color}
              strokeWidth="1"
            />
          );
        })}
        {/* Y-axis labels */}
        {[60, 80].map(v => (
          <text key={v} x={PAD - 2} y={toY(v) + 3} fontSize="6" fill="#8b949e" textAnchor="end">{v}</text>
        ))}
      </svg>
    </div>
  );
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

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <span style={{ fontSize: '3rem' }}>📊</span>
        <h3>No swings analyzed yet</h3>
        <p>Upload a swing video to get started!</p>
      </div>
    );
  }

  const avgScore = Math.round(history.reduce((a, b) => a + b.score, 0) / history.length);
  const best     = Math.max(...history.map(r => r.score));

  // Fault frequency — top 5
  const faultCounts: Record<string, number> = {};
  history.forEach(r => r.faults.forEach(f => { faultCounts[f] = (faultCounts[f] || 0) + 1; }));
  const freqFaults = Object.entries(faultCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="history">
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Swings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{
            color: avgScore >= 80 ? '#3fb950' : avgScore >= 60 ? '#d29922' : '#f85149'
          }}>{avgScore}</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{
            color: best >= 80 ? '#3fb950' : best >= 60 ? '#d29922' : '#f85149'
          }}>{best}</div>
          <div className="stat-label">Best</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{
            color: history[0].score >= 80 ? '#3fb950' : history[0].score >= 60 ? '#d29922' : '#f85149'
          }}>{history[0].score}</div>
          <div className="stat-label">Latest</div>
        </div>
      </div>

      <ScoreTrendChart records={history} />

      {freqFaults.length > 0 && (
        <div className="freq-faults">
          <h3>Most Frequent Faults</h3>
          {freqFaults.map(([fault, count], i) => (
            <div key={i} className="freq-fault-row">
              <span className="freq-fault-name">{fault}</span>
              <div className="freq-bar-wrap">
                <div className="freq-bar" style={{ width: `${(count / history.length) * 100}%` }} />
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
              {record.assessedCount !== undefined && record.totalChecks !== undefined
                && record.assessedCount < record.totalChecks && (
                <span className="partial-badge" style={{
                  color:       record.assessedCount >= 2 ? '#d29922' : '#f85149',
                  borderColor: record.assessedCount >= 2 ? '#d29922' : '#f85149',
                }}>{record.assessedCount}/{record.totalChecks}</span>
              )}
            </div>
            <div className="history-faults">
              {record.faults.length === 0
                ? <span style={{ color: '#3fb950' }}>No faults</span>
                : record.faults.map((f, j) => <span key={j} className="fault-tag">{f}</span>)
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

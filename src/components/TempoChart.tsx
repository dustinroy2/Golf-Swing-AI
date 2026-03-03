import React from 'react';

interface TempoChartProps {
  ratioLow:      number;
  ratioHigh:     number;
  ratioMid:      number;
  backswingTime: number; // seconds
  downswingTime: number; // seconds
  fps:           number;
  fpsTier:       'low' | 'medium' | 'high';
}

// Tour-validated range per Novosel / deWiz research
const TOUR_LOW  = 2.5;
const TOUR_HIGH = 3.0;
const SCALE_MIN = 1.0;
const SCALE_MAX = 5.0;

const TIER_CONFIG = {
  high:   { color: '#3fb950', label: 'High precision',    hint: null },
  medium: { color: '#d29922', label: 'Medium precision',  hint: 'Use 120fps+ slo-mo for tighter accuracy' },
  low:    { color: '#f85149', label: 'Low precision',     hint: 'Tempo requires slo-mo video (120fps+) for accurate results' },
};

// Map a ratio value to an x% position on the chart scale
function toX(ratio: number): number {
  return ((ratio - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

// Does the user's range overlap the tour zone?
function overlapWithTour(low: number, high: number): 'inside' | 'overlap' | 'outside' {
  if (low >= TOUR_LOW && high <= TOUR_HIGH) return 'inside';
  if (low <= TOUR_HIGH && high >= TOUR_LOW) return 'overlap';
  return 'outside';
}

export default function TempoChart({
  ratioLow, ratioHigh, ratioMid,
  backswingTime, downswingTime,
  fps, fpsTier,
}: TempoChartProps) {

  const tier    = TIER_CONFIG[fpsTier];
  const overlap = overlapWithTour(ratioLow, ratioHigh);
  const barColor = overlap === 'inside'  ? '#3fb950'
                 : overlap === 'overlap' ? '#d29922'
                 : '#f85149';

  const tourLeftPct  = toX(TOUR_LOW);
  const tourWidthPct = toX(TOUR_HIGH) - tourLeftPct;
  const barLeftPct   = Math.max(0, toX(ratioLow));
  const barWidthPct  = Math.min(100, toX(ratioHigh)) - barLeftPct;
  const midPct       = toX(ratioMid);

  const ratioLabel = ratioLow.toFixed(1) === ratioHigh.toFixed(1)
    ? `${ratioMid.toFixed(1)}:1`
    : `${ratioLow.toFixed(1)}–${ratioHigh.toFixed(1)}:1`;

  return (
    <div className="tempo-chart">
      <div className="tempo-header">
        <div className="tempo-title">
          <span>⏱ Swing Tempo</span>
          <span className="fps-badge" style={{ color: tier.color, borderColor: tier.color }}>
            {tier.label} · {fps}fps
          </span>
        </div>
        <div className="tempo-times">
          <span>Backswing <strong>{backswingTime.toFixed(2)}s</strong></span>
          <span className="tempo-divider">·</span>
          <span>Downswing <strong>{downswingTime.toFixed(2)}s</strong></span>
          <span className="tempo-divider">·</span>
          <span>Ratio <strong>{ratioLabel}</strong></span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="tempo-svg-wrapper">
        <svg viewBox="0 0 300 56" xmlns="http://www.w3.org/2000/svg" className="tempo-svg">

          {/* Track background */}
          <rect x="0" y="20" width="300" height="16" rx="3" fill="#21262d" />

          {/* Tour zone (2.5:1 – 3:1) */}
          <rect
            x={`${tourLeftPct * 3}`}
            y="20"
            width={`${tourWidthPct * 3}`}
            height="16"
            fill="#3fb950"
            opacity="0.25"
          />

          {/* User ratio range bar */}
          {barWidthPct > 0 && (
            <rect
              x={`${barLeftPct * 3}`}
              y="24"
              width={`${Math.max(2, barWidthPct * 3)}`}
              height="8"
              rx="2"
              fill={barColor}
              opacity="0.9"
            />
          )}

          {/* Midpoint tick */}
          <line
            x1={`${midPct * 3}`}
            y1="18"
            x2={`${midPct * 3}`}
            y2="38"
            stroke={barColor}
            strokeWidth="1.5"
          />

          {/* Scale labels */}
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(v => (
            <text
              key={v}
              x={`${toX(v) * 3}`}
              y="52"
              textAnchor="middle"
              fontSize="7"
              fill="#8b949e"
            >
              {v % 1 === 0 ? `${v}:1` : ''}
            </text>
          ))}

          {/* Tour zone label */}
          <text
            x={`${(tourLeftPct + tourWidthPct / 2) * 3}`}
            y="16"
            textAnchor="middle"
            fontSize="6.5"
            fill="#3fb950"
            opacity="0.8"
          >
            Tour zone
          </text>

        </svg>
      </div>

      {/* Precision hint */}
      {tier.hint && (
        <div className="tempo-hint" style={{ color: tier.color }}>
          ⚠ {tier.hint}
        </div>
      )}
    </div>
  );
}

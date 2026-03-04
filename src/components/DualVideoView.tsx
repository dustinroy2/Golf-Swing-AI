import React, { useRef, useCallback } from 'react';
import { SwingFrame, DetectedPhases } from './SwingStateMachine';
import OverlayCanvas from './OverlayCanvas';
import PhaseSelector from './PhaseSelector';

interface Fault {
  name:        string;
  phase:       string;
  description: string;
  drill:       string;
  severity:    'red' | 'yellow';
}

interface AnalysisResult {
  score:              number;
  faults:             Fault[];
  phases:             string[];
  skippedChecks:      string[];
  assessedCheckNames?: string[];
  assessedCount:      number;
  totalChecks:        number;
}

export interface SwingViewData {
  videoUrl:   string;
  allFrames:  SwingFrame[];
  phases:     DetectedPhases;
  result:     AnalysisResult;
  angle:      'dtl' | 'faceOn';
  label?:     string;
}

interface Props {
  view1:             SwingViewData;
  view2:             SwingViewData;
  overlays1:         any; // kept for API compat, unused
  overlays2:         any;
  onOverlays1Change: (s: any) => void;
  onOverlays2Change: (s: any) => void;
}

export default function DualVideoView({ view1, view2 }: Props) {
  const videoRef1  = useRef<HTMLVideoElement>(null);
  const videoRef2  = useRef<HTMLVideoElement>(null);
  const syncingRef = useRef(false);

  const syncPlay = useCallback(() => {
    const v1 = videoRef1.current;
    const v2 = videoRef2.current;
    if (!v1 || !v2) return;
    if (v1.paused && v2.paused) { v1.play(); v2.play(); }
    else { v1.pause(); v2.pause(); }
  }, []);

  const onSeek1 = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (videoRef2.current) videoRef2.current.currentTime = videoRef1.current!.currentTime;
    syncingRef.current = false;
  }, []);

  const onSeek2 = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (videoRef1.current) videoRef1.current.currentTime = videoRef2.current!.currentTime;
    syncingRef.current = false;
  }, []);

  const scoreColor = (s: number) => s >= 80 ? '#3fb950' : s >= 60 ? '#d29922' : '#f85149';

  return (
    <div className="dual-video-wrapper">
      <div className="dual-video-grid">
        {[
          { data: view1, ref: videoRef1, onSeek: onSeek1 },
          { data: view2, ref: videoRef2, onSeek: onSeek2 },
        ].map(({ data, ref, onSeek }, idx) => (
          <div key={idx} className="dual-video-col">
            <div className="dual-video-label">
              {data.label ?? `View ${idx + 1}`} · {data.angle.toUpperCase()}
            </div>
            <div className="video-overlay-container">
              <video
                ref={ref}
                src={data.videoUrl}
                className="video-player"
                crossOrigin="anonymous"
                onSeeked={onSeek}
                playsInline
              />
              {data.allFrames.length > 0 && (
                <OverlayCanvas
                  videoRef={ref}
                  allFrames={data.allFrames}
                  phaseFrames={data.phases}
                  angle={data.angle}
                  analysisMode="critique"
                  activePhase=""
                  faults={data.result.faults}
                  assessedChecks={data.result.assessedCheckNames ?? []}
                  swingArc={[]}
                  referencePlane={null}
                />
              )}
            </div>
            <div className="dual-score">
              Score: <strong style={{ color: scoreColor(data.result.score) }}>{data.result.score}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="dual-controls">
        <button className="sync-play-btn" onClick={syncPlay}>▶ Sync Play / Pause</button>
        <PhaseSelector phases={view1.phases} videoRef={videoRef1} secondaryVideoRef={videoRef2} />
      </div>

      <div className="dual-faults">
        {[
          ...view1.result.faults.map(f => ({ ...f, viewLabel: view1.label ?? 'Swing 1' })),
          ...view2.result.faults.map(f => ({ ...f, viewLabel: view2.label ?? 'Swing 2' })),
        ].map((fault, i) => (
          <div key={i} className={`fault-card fault-${fault.severity}`}>
            <div className="fault-header">
              <span className="fault-dot" style={{ background: fault.severity === 'red' ? '#f85149' : '#d29922' }} />
              <strong>{fault.name}</strong>
              <span className="fault-phase">{fault.phase}</span>
              <span className="fault-view-label">{fault.viewLabel}</span>
            </div>
            <p className="fault-description">{fault.description}</p>
            <div className="drill-box"><strong>💡 Drill:</strong> {fault.drill}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

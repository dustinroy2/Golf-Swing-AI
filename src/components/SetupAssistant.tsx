import React, { useRef, useState, useEffect, useCallback } from 'react';
import CameraPermissionModal from './CameraPermissionModal';

type FramingStatus = 'no-person' | 'too-far' | 'too-close' | 'good';

interface FootPosition {
  leftX: number;
  rightX: number;
  y: number;
}

export default function SetupAssistant({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [framing, setFraming] = useState<FramingStatus>('no-person');
  const [footPos, setFootPos] = useState<FootPosition | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [showReady, setShowReady] = useState(false);

  const statusConfig = {
    'no-person': { color: '#8b949e', text: '👤 Step into frame', border: '#30363d' },
    'too-far':   { color: '#f85149', text: '📏 Move closer to camera', border: '#f85149' },
    'too-close': { color: '#f85149', text: '↔️ Move further from camera', border: '#f85149' },
    'good':      { color: '#3fb950', text: '✅ Perfect! Hold still...', border: '#3fb950' },
  };

  const pendingStreamRef = useRef<MediaStream | null>(null);

  const startAssistant = async () => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      pendingStreamRef.current = stream;

      const tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');
      detectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );

      setStarted(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setPermissionDenied(true);
    }
  };

  // Attach stream and start loops after video element mounts
  useEffect(() => {
    if (started && videoRef.current && pendingStreamRef.current) {
      videoRef.current.srcObject = pendingStreamRef.current;
      pendingStreamRef.current = null;
      startDetection();
      startPreviewLoop();
    }
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !detectorRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const poses = await detectorRef.current.estimatePoses(canvas);
        if (!poses.length) {
          setFraming('no-person');
          setFootPos(null);
          setReadyCount(0);
          return;
        }

        const kps = poses[0].keypoints;
        const visible = kps.filter((k: any) => k.score > 0.3);
        if (visible.length < 4) {
          setFraming('no-person');
          setFootPos(null);
          return;
        }

        const ys = visible.map((k: any) => k.y);
        const xs = visible.map((k: any) => k.x);
        const height = (Math.max(...ys) - Math.min(...ys)) / canvas.height;
        const coverage = Math.max(
          (Math.max(...xs) - Math.min(...xs)) / canvas.width,
          height
        );

        // Get foot positions for alignment line
        const leftAnkle = kps[15];
        const rightAnkle = kps[16];
        if (leftAnkle.score > 0.4 && rightAnkle.score > 0.4) {
          const footY = (leftAnkle.y + rightAnkle.y) / 2;
          const leftX = Math.min(leftAnkle.x, rightAnkle.x);
          const rightX = Math.max(leftAnkle.x, rightAnkle.x);
          setFootPos({ leftX, rightX, y: footY });
        }

        if (coverage < 0.35) {
          setFraming('too-far');
          setReadyCount(0);
        } else if (coverage > 0.88) {
          setFraming('too-close');
          setReadyCount(0);
        } else {
          setFraming('good');
          setReadyCount(c => {
            const next = c + 1;
            if (next >= 3) setShowReady(true);
            return next;
          });
        }
      } catch (e) {}
    }, 800);
  };

  const startPreviewLoop = () => {
    const draw = () => {
      if (!videoRef.current || !previewCanvasRef.current) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      const pc = previewCanvasRef.current;
      const ctx = pc.getContext('2d')!;
      pc.width = videoRef.current.videoWidth || 640;
      pc.height = videoRef.current.videoHeight || 480;
      ctx.drawImage(videoRef.current, 0, 0, pc.width, pc.height);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    animFrameRef.current = requestAnimationFrame(draw);
  };

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => () => stop(), [stop]);

  const cfg = statusConfig[framing];

  if (permissionDenied) {
    return (
      <CameraPermissionModal
        onRetry={startAssistant}
        onDismiss={() => { setPermissionDenied(false); onBack(); }}
      />
    );
  }

  return (
    <div className="setup-assistant">
      {!started ? (
        <div className="assistant-start">
          <div className="assistant-hero">
            <div style={{ fontSize: '3rem' }}>🎯</div>
            <h2>Live Setup Assistant</h2>
            <p>
              Position your device where you'll record your swing.
              The assistant will draw a virtual alignment line toe-to-toe
              and tell you when your framing is perfect.
            </p>
            <div className="assistant-tips">
              <div className="tip">📏 Place phone at wrist height</div>
              <div className="tip">📐 8–12 feet from your hitting position</div>
              <div className="tip">☀️ Sun should be behind the camera</div>
            </div>
            <button
              className="analyze-btn"
              onClick={startAssistant}
              disabled={loading}
            >
              {loading ? '⚙️ Loading AI...' : '🎯 Start Setup Assistant'}
            </button>
            <button className="back-link" onClick={onBack}>
              ← Back to Setup Guide
            </button>
          </div>
        </div>
      ) : (
        <div className="assistant-live">
          {/* Status Bar */}
          <div className="assistant-status" style={{ borderColor: cfg.border }}>
            <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.text}</span>
            {framing === 'good' && (
              <div className="ready-progress">
                <div
                  className="ready-bar"
                  style={{ width: `${Math.min(readyCount / 3 * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Main Camera View */}
          <div className="assistant-viewport" style={{ borderColor: cfg.border }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="assistant-video"
            />

            {/* Alignment Overlay */}
            {footPos && (
              <div className="alignment-overlay">
                <svg
                  className="alignment-svg"
                  viewBox={`0 0 ${videoRef.current?.videoWidth || 640} ${videoRef.current?.videoHeight || 480}`}
                  preserveAspectRatio="none"
                >
                  {/* Extended toe-to-toe line */}
                  <line
                    x1={footPos.leftX - (footPos.rightX - footPos.leftX) * 0.4}
                    y1={footPos.y}
                    x2={footPos.rightX + (footPos.rightX - footPos.leftX) * 0.4}
                    y2={footPos.y}
                    stroke={framing === 'good' ? '#3fb950' : '#58a6ff'}
                    strokeWidth="3"
                    strokeDasharray="12,6"
                  />
                  {/* Left foot dot */}
                  <circle
                    cx={footPos.leftX}
                    cy={footPos.y}
                    r="8"
                    fill={framing === 'good' ? '#3fb950' : '#58a6ff'}
                    opacity="0.8"
                  />
                  {/* Right foot dot */}
                  <circle
                    cx={footPos.rightX}
                    cy={footPos.y}
                    r="8"
                    fill={framing === 'good' ? '#3fb950' : '#58a6ff'}
                    opacity="0.8"
                  />
                  {/* Ball position marker */}
                  <circle
                    cx={(footPos.leftX + footPos.rightX) / 2}
                    cy={footPos.y}
                    r="12"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <circle
                    cx={(footPos.leftX + footPos.rightX) / 2}
                    cy={footPos.y}
                    r="4"
                    fill="#fff"
                    opacity="0.7"
                  />
                  {/* Alignment line label */}
                  <text
                    x={footPos.rightX + (footPos.rightX - footPos.leftX) * 0.4 + 10}
                    y={footPos.y + 5}
                    fill={framing === 'good' ? '#3fb950' : '#58a6ff'}
                    fontSize="16"
                    fontFamily="system-ui"
                    fontWeight="bold"
                  >
                    ←→
                  </text>
                </svg>
              </div>
            )}

            {/* Silhouette guide when no person detected */}
            {framing === 'no-person' && (
              <div className="silhouette-guide">
                <svg viewBox="0 0 80 160" className="silhouette-svg">
                  <circle cx="40" cy="20" r="14" fill="none"
                    stroke="#30363d" strokeWidth="2" strokeDasharray="4,3" />
                  <line x1="40" y1="34" x2="40" y2="90"
                    stroke="#30363d" strokeWidth="3" strokeDasharray="4,3" />
                  <line x1="15" y1="55" x2="65" y2="55"
                    stroke="#30363d" strokeWidth="2" strokeDasharray="4,3" />
                  <line x1="40" y1="90" x2="20" y2="130"
                    stroke="#30363d" strokeWidth="3" strokeDasharray="4,3" />
                  <line x1="40" y1="90" x2="60" y2="130"
                    stroke="#30363d" strokeWidth="3" strokeDasharray="4,3" />
                  <text x="40" y="155" textAnchor="middle"
                    fill="#30363d" fontSize="9" fontFamily="system-ui">
                    Stand here
                  </text>
                </svg>
              </div>
            )}

            {/* Ready overlay */}
            {showReady && (
              <div className="ready-overlay-full">
                <div className="ready-badge">
                  ✅ Perfect Framing!
                </div>
                <p>Your alignment line is set.<br />Switch to record mode.</p>
              </div>
            )}

            {/* Corner Preview */}
            <div className="corner-preview">
              <div className="corner-label">Helper View</div>
              <canvas ref={previewCanvasRef} className="preview-canvas" />
            </div>
          </div>

          {/* Hidden canvas for pose detection */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Controls */}
          <div className="assistant-controls">
            <button className="stop-btn" onClick={() => { stop(); setStarted(false); setShowReady(false); setReadyCount(0); }}>
              ⏹ Stop
            </button>
            <button className="back-link-btn" onClick={() => { stop(); onBack(); }}>
              ← Back to Guide
            </button>
            {showReady && (
              <button className="analyze-btn" style={{ marginLeft: 'auto' }}
                onClick={() => { stop(); onBack(); }}>
                📹 Go Record Swing
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="alignment-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#58a6ff' }} />
              Alignment line (toe-to-toe)
            </span>
            <span className="legend-item">
              <span style={{ fontSize: '0.8rem' }}>⊕</span>
              Ball position
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#3fb950' }} />
              Perfect framing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

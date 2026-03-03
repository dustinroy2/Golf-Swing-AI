import React, { useState, useRef } from 'react';
import {
  detectSwingPhases,
  DetectedPhases,
  CONFIDENCE_TRUST,
  CONFIDENCE_LOW,
} from './SwingStateMachine';
import TempoChart from './TempoChart';

// requestVideoFrameCallback is not yet in TypeScript's lib — declare it here
declare global {
  interface HTMLVideoElement {
    requestVideoFrameCallback(
      callback: (now: DOMHighResTimeStamp, metadata: { mediaTime: number; presentedFrames: number }) => void
    ): number;
  }
}

interface Fault {
  name: string;
  phase: string;
  description: string;
  drill: string;
  severity: 'red' | 'yellow';
}

interface AnalysisResult {
  score:          number;
  faults:         Fault[];
  phases:         string[];
  skippedChecks:  string[];
  assessedCount:  number; // checks that had trusted joints and actually ran
  totalChecks:    number; // always 4 — used to detect score inflation from bad video
}

interface TempoResult {
  ratioLow:      number;
  ratioHigh:     number;
  ratioMid:      number;
  backswingTime: number;
  downswingTime: number;
}

interface VideoMeta {
  fps:      number;
  fpsTier:  'low' | 'medium' | 'high';
  width:    number;
  height:   number;
  duration: number;
}

// ─── Background FPS detection ─────────────────────────────────────────────────
// Creates an offscreen muted video, plays 0.5s, counts requestVideoFrameCallback
// ticks to measure actual encoded frame rate. Falls back to 30 if API unavailable.
async function detectVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    video.muted      = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const finish = (fps: number) => {
      video.pause();
      URL.revokeObjectURL(url);
      const w = video.videoWidth  || 0;
      const h = video.videoHeight || 0;
      resolve({
        fps,
        fpsTier:  fps >= 120 ? 'high' : fps >= 60 ? 'medium' : 'low',
        width:    w,
        height:   h,
        duration: video.duration || 0,
      });
    };

    video.addEventListener('loadedmetadata', () => {
      if (!('requestVideoFrameCallback' in video)) {
        finish(30); // API not available — assume 30fps
        return;
      }

      let frameCount    = 0;
      let startTime: number | null = null;
      const SAMPLE_WINDOW = Math.min(0.5, (video.duration || 0.5) * 0.8);

      const countFrame = (_now: DOMHighResTimeStamp, meta: { mediaTime: number }) => {
        if (startTime === null) startTime = meta.mediaTime;
        frameCount++;
        const elapsed = meta.mediaTime - startTime;
        if (elapsed >= SAMPLE_WINDOW) {
          finish(Math.round(frameCount / elapsed));
        } else {
          video.requestVideoFrameCallback(countFrame);
        }
      };

      // Safety timeout — if callbacks stall, resolve with what we have
      const timeout = setTimeout(() => {
        if (startTime !== null && frameCount > 1) {
          finish(Math.round(frameCount / (SAMPLE_WINDOW)));
        } else {
          finish(30);
        }
      }, 2500);

      video.requestVideoFrameCallback(countFrame);
      video.play().catch(() => {
        clearTimeout(timeout);
        finish(30);
      });
    });

    video.load();
  });
}

function resolutionLabel(width: number, height: number): string {
  const long = Math.max(width, height); // handle portrait video
  if (long >= 3840) return '4K';
  if (long >= 1920) return '1080p';
  if (long >= 1280) return '720p';
  if (long >= 854)  return '480p';
  return `${Math.min(width, height)}p`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Tempo calculation with uncertainty range ─────────────────────────────────
// Each phase boundary has ±0.5 × sampleInterval uncertainty.
// backswingTime = top - address  → ±1 × sampleInterval total
// downswingTime = impact - top   → ±1 × sampleInterval total
function calculateTempo(phases: DetectedPhases): TempoResult {
  const si            = phases.sampleInterval;
  const backswingTime = phases.top.time    - phases.address.time;
  const downswingTime = phases.impact.time - phases.top.time;

  const bsLow  = Math.max(0.05, backswingTime - si);
  const bsHigh = backswingTime + si;
  const dsLow  = Math.max(0.05, downswingTime - si);
  const dsHigh = downswingTime + si;

  return {
    backswingTime,
    downswingTime,
    ratioMid:  backswingTime / Math.max(0.05, downswingTime),
    ratioLow:  bsLow  / dsHigh,
    ratioHigh: bsHigh / dsLow,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoAnalyzer() {
  const [videoFile, setVideoFile]     = useState<File | null>(null);
  const [videoUrl, setVideoUrl]       = useState<string>('');
  const [videoMeta, setVideoMeta]     = useState<VideoMeta | null>(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [tempoResult, setTempoResult] = useState<TempoResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResult(null);
    setTempoResult(null);
    setVideoMeta(null);
    setCurrentPhase('');
    // Detect FPS and resolution silently in the background
    detectVideoMeta(file).then(setVideoMeta);
  };

  const speakResult = (res: AnalysisResult) => {
    if (!('speechSynthesis' in window)) return;
    const text = `Score ${res.score}. ${
      res.faults.length > 0
        ? `Primary fault: ${res.faults[0].name}. Drill: ${res.faults[0].drill}`
        : 'Great swing! No major faults detected.'
    }`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const analyzeSwing = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setResult(null);
    setTempoResult(null);

    try {
      setCurrentPhase('Loading pose detection model...');
      const tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );

      const phases = await detectSwingPhases(
        videoRef.current,
        canvasRef.current,
        detector,
        setCurrentPhase
      );

      if (!phases) {
        setCurrentPhase('Could not detect swing. Ensure full body is visible with good lighting.');
        setAnalyzing(false);
        return;
      }

      setCurrentPhase('Calculating faults...');
      drawImpactFrame(phases.impact.pose);

      const frameWidth  = canvasRef.current.width;
      const frameHeight = canvasRef.current.height;
      const analysisResult = calculateFaults(phases, frameWidth, frameHeight);
      const tempo          = calculateTempo(phases);

      setResult(analysisResult);
      setTempoResult(tempo);
      setCurrentPhase('');
      speakResult(analysisResult);

      const history = JSON.parse(localStorage.getItem('swingHistory') || '[]');
      history.unshift({
        date:          new Date().toISOString(),
        score:         analysisResult.score,
        faults:        analysisResult.faults.map(f => f.name),
        assessedCount: analysisResult.assessedCount,
        totalChecks:   analysisResult.totalChecks,
      });
      localStorage.setItem('swingHistory', JSON.stringify(history.slice(0, 50)));

    } catch (err) {
      console.error(err);
      setCurrentPhase('Error analyzing swing. Please try again.');
    }

    setAnalyzing(false);
  };

  const drawImpactFrame = (pose: any) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const keypoints   = pose.keypoints;
    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
      [5, 11], [6, 12], [11, 12], [11, 13], [13, 15],
      [12, 14], [14, 16],
    ];

    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth   = 2;
    connections.forEach(([a, b]) => {
      const kpA = keypoints[a];
      const kpB = keypoints[b];
      if ((kpA.score ?? 0) >= CONFIDENCE_LOW && (kpB.score ?? 0) >= CONFIDENCE_LOW) {
        ctx.beginPath();
        ctx.moveTo(kpA.x, kpA.y);
        ctx.lineTo(kpB.x, kpB.y);
        ctx.stroke();
      }
    });

    keypoints.forEach((kp: any) => {
      const score = kp.score ?? 0;
      if (score >= CONFIDENCE_TRUST) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#3fb950';
        ctx.fill();
      } else if (score >= CONFIDENCE_LOW) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#8b949e';
        ctx.fill();
        ctx.fillStyle   = '#ffffff';
        ctx.font        = 'bold 8px sans-serif';
        ctx.textAlign   = 'center';
        ctx.fillText('?', kp.x, kp.y + 3);
      }
    });
  };

  const calculateFaults = (
    phases:      DetectedPhases,
    frameWidth:  number,
    frameHeight: number,
  ): AnalysisResult => {
    const faults: Fault[]         = [];
    const skippedChecks: string[] = [];
    const TOTAL_CHECKS = 4;
    let score         = 100;
    let assessedCount = 0;
    const { address, top, impact } = phases;
    const trusted = (kp: any) => (kp.score ?? 0) >= CONFIDENCE_TRUST;
    const visible = (kp: any) => (kp.score ?? 0) >= CONFIDENCE_LOW;

    // Helper: consistent three-tier skip message for any check
    const skipMessage = (
      joints:       any[],
      unclearMsg:   string,
      notVisibleMsg: string,
    ) => {
      if (joints.some(visible)) skippedChecks.push(unclearMsg);
      else                      skippedChecks.push(notVisibleMsg);
    };

    // ── Shoulder Tilt at Address (Phase 0) ───────────────────────────────────
    const addrLS = address.pose.keypoints[5];
    const addrRS = address.pose.keypoints[6];
    if (trusted(addrLS) && trusted(addrRS)) {
      assessedCount++;
      if (Math.abs(addrLS.y - addrRS.y) / frameHeight > 0.08) {
        faults.push({
          name: 'Shoulder Tilt at Address', phase: 'Address', severity: 'yellow',
          description: 'Your shoulders are not level at address.',
          drill: 'Place a club across your shoulders in front of a mirror. Practice until the club sits parallel to the ground.',
        });
        score -= 15;
      }
    } else {
      skipMessage(
        [addrLS, addrRS],
        'Shoulder alignment at address unclear — try better lighting',
        'Shoulders not visible at address — adjust camera to show full upper body',
      );
    }

    // ── Reverse Pivot (Phase 2 — Top) ────────────────────────────────────────
    const addrLS2 = address.pose.keypoints[5];
    const topLS   = top.pose.keypoints[5];
    if (trusted(addrLS2) && trusted(topLS)) {
      assessedCount++;
      if ((topLS.x - addrLS2.x) / frameWidth > 0.08) {
        faults.push({
          name: 'Reverse Pivot', phase: 'Top', severity: 'red',
          description: 'Your weight is shifting toward the target on the backswing.',
          drill: 'Stand with your back against a wall. Your trail hip should graze the wall on the backswing — not your lead hip.',
        });
        score -= 20;
      }
    } else {
      skipMessage(
        [addrLS2, topLS],
        'Shoulder position unclear at top — try better lighting or move camera further back',
        'Shoulders not visible at top of backswing — ensure full upper body is in frame',
      );
    }

    // ── Head Up at Impact (Phase 3) ───────────────────────────────────────────
    const addrNose = address.pose.keypoints[0];
    const impNose  = impact.pose.keypoints[0];
    if (trusted(addrNose) && trusted(impNose)) {
      assessedCount++;
      if ((addrNose.y - impNose.y) / frameHeight > 0.06) {
        faults.push({
          name: 'Head Up at Impact', phase: 'Impact', severity: 'red',
          description: 'Your head is rising before impact — you are coming out of the shot.',
          drill: 'Focus on the back of the ball until after impact. Put a tee in the ground and try to see it after the swing.',
        });
        score -= 20;
      }
    } else {
      skipMessage(
        [addrNose, impNose],
        'Head position unclear at impact — ensure face is visible and lighting is adequate',
        'Head not visible — make sure your face is not cut off by the camera frame',
      );
    }

    // ── Early Extension (Phase 3 — Impact) ───────────────────────────────────
    const addrLH = address.pose.keypoints[11];
    const impLH  = impact.pose.keypoints[11];
    if (trusted(addrLH) && trusted(impLH)) {
      assessedCount++;
      if (Math.abs(addrLH.x - impLH.x) / frameWidth > 0.1) {
        faults.push({
          name: 'Early Extension', phase: 'Impact', severity: 'red',
          description: 'Your hips are thrusting toward the ball through impact.',
          drill: 'Place a headcover behind your trail heel at address. Keep your hips back and rotate around your spine through impact.',
        });
        score -= 20;
      }
    } else {
      skipMessage(
        [addrLH, impLH],
        'Hip position unclear at impact — try filming from directly down the line',
        'Hips not visible — ensure full body from head to knees is in frame',
      );
    }

    const phaseOrder = ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'];
    faults.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));
    return {
      score:         Math.max(0, score),
      faults:        faults.slice(0, 2),
      phases:        ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'],
      skippedChecks,
      assessedCount,
      totalChecks:   TOTAL_CHECKS,
    };
  };

  return (
    <div className="analyzer">
      <div className="upload-section">
        <label className="upload-label">
          <input type="file" accept="video/*" onChange={handleFileUpload} />
          <div className="upload-box">
            {videoFile ? (
              <div className="upload-file-info">
                <span>✅ {videoFile.name}</span>
                {videoMeta ? (
                  <span className="video-meta">
                    {resolutionLabel(videoMeta.width, videoMeta.height)}
                    {' · '}{videoMeta.fps}fps
                    {' · '}{formatDuration(videoMeta.duration)}
                    {videoMeta.fpsTier === 'low' && (
                      <span className="meta-nudge"> · ⚠ Use slo-mo for precise tempo</span>
                    )}
                  </span>
                ) : (
                  <span className="video-meta">Detecting...</span>
                )}
              </div>
            ) : (
              <>
                <span className="upload-icon">📹</span>
                <span>Upload your golf swing video</span>
                <span className="upload-hint">MP4, MOV, or AVI</span>
              </>
            )}
          </div>
        </label>

        {videoUrl && (
          <button className="analyze-btn" onClick={analyzeSwing} disabled={analyzing}>
            {analyzing ? '🔄 Analyzing...' : '⚡ Analyze Swing'}
          </button>
        )}
      </div>

      {videoUrl && (
        <div className="video-section">
          <video ref={videoRef} src={videoUrl} controls className="video-player" crossOrigin="anonymous" />
          <canvas ref={canvasRef} className="pose-canvas" />
        </div>
      )}

      {analyzing && currentPhase && (
        <div className="analyzing-status">
          <div className="spinner">⚙️</div>
          <span>{currentPhase}</span>
        </div>
      )}

      {!analyzing && currentPhase && (
        <div className="analyzing-status error">
          <span>⚠️ {currentPhase}</span>
        </div>
      )}

      {result && (
        <div className="results">
          <div className="score-card">
            <div className="score-number" style={{
              color: result.score >= 80 ? '#3fb950' : result.score >= 60 ? '#d29922' : '#f85149'
            }}>
              {result.score}
            </div>
            <div className="score-label">Swing Score</div>
            <div className="score-coverage" style={{
              color: result.assessedCount === result.totalChecks ? '#8b949e'
                   : result.assessedCount >= 2               ? '#d29922'
                   : '#f85149'
            }}>
              {result.assessedCount}/{result.totalChecks} checks assessed
            </div>
          </div>

          {result.skippedChecks.length > 0 && (
            <div className="skipped-checks">
              <h3>Could Not Assess</h3>
              {result.skippedChecks.map((msg, i) => (
                <div key={i} className="skipped-row">
                  <span className="skipped-dot" />
                  {msg}
                </div>
              ))}
            </div>
          )}

          {result.faults.length === 0 ? (
            <div className="no-faults">✅ {result.assessedCount === result.totalChecks
              ? 'Great swing! No major faults detected.'
              : 'No faults detected in assessed checks.'
            }</div>
          ) : (
            <div className="faults-list">
              <h3>
                {result.faults.length} fault{result.faults.length > 1 ? 's' : ''} found
                {result.skippedChecks.length > 0 && (
                  <span className="faults-subtext">
                    {' · '}{result.skippedChecks.length} check{result.skippedChecks.length > 1 ? 's' : ''} skipped
                  </span>
                )}
              </h3>
              {result.faults.map((fault, i) => (
                <div key={i} className={`fault-card fault-${fault.severity}`}>
                  <div className="fault-header">
                    <span className="fault-dot" style={{
                      background: fault.severity === 'red' ? '#f85149' : '#d29922'
                    }} />
                    <strong>{fault.name}</strong>
                    <span className="fault-phase">{fault.phase}</span>
                  </div>
                  <p className="fault-description">{fault.description}</p>
                  <div className="drill-box">
                    <strong>💡 Drill:</strong> {fault.drill}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tempoResult && videoMeta && (
            <TempoChart
              ratioLow={tempoResult.ratioLow}
              ratioHigh={tempoResult.ratioHigh}
              ratioMid={tempoResult.ratioMid}
              backswingTime={tempoResult.backswingTime}
              downswingTime={tempoResult.downswingTime}
              fps={videoMeta.fps}
              fpsTier={videoMeta.fpsTier}
            />
          )}

          <button className="speak-btn" onClick={() => speakResult(result)}>
            🔊 Read Results Aloud
          </button>
        </div>
      )}
    </div>
  );
}

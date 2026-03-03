import React, { useState, useRef } from 'react';
import {
  detectSwingPhases,
  DetectedPhases,
  CONFIDENCE_TRUST,
  CONFIDENCE_LOW,
} from './SwingStateMachine';

interface Fault {
  name: string;
  phase: string;
  description: string;
  drill: string;
  severity: 'red' | 'yellow';
}

interface AnalysisResult {
  score: number;
  faults: Fault[];
  phases: string[];
}

export default function VideoAnalyzer() {
  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [videoUrl, setVideoUrl]     = useState<string>('');
  const [analyzing, setAnalyzing]   = useState(false);
  const [result, setResult]         = useState<AnalysisResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResult(null);
      setCurrentPhase('');
    }
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

    try {
      setCurrentPhase('Loading pose detection model...');
      const tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');
      // Lightning: ~15ms/frame on modern hardware — fast enough for the web prototype.
      // Switch to Thunder for higher accuracy if needed (costs ~5× more time per frame).
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
        setCurrentPhase('Could not detect swing. Ensure the full body is visible with good lighting.');
        setAnalyzing(false);
        return;
      }

      setCurrentPhase('Calculating faults...');
      drawImpactFrame(phases.impact.pose);

      const frameWidth  = canvasRef.current.width;
      const frameHeight = canvasRef.current.height;
      const analysisResult = calculateFaults(phases, frameWidth, frameHeight);
      setResult(analysisResult);
      setCurrentPhase('');
      speakResult(analysisResult);

      const history = JSON.parse(localStorage.getItem('swingHistory') || '[]');
      history.unshift({
        date:   new Date().toISOString(),
        score:  analysisResult.score,
        faults: analysisResult.faults.map(f => f.name),
      });
      localStorage.setItem('swingHistory', JSON.stringify(history.slice(0, 50)));

    } catch (err) {
      console.error(err);
      setCurrentPhase('Error analyzing swing. Please try again.');
    }

    setAnalyzing(false);
  };

  // Draw the impact frame pose on canvas — confidence-gated per SRD:
  // green dot  = score >= 0.7 (trusted)
  // yellow dot = score 0.5–0.7 (low confidence, shown but excluded from faults)
  // hidden     = score < 0.5
  const drawImpactFrame = (pose: any) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const keypoints = pose.keypoints;
    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
      [5, 11], [6, 12], [11, 12], [11, 13], [13, 15],
      [12, 14], [14, 16],
    ];

    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
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
        ctx.fillStyle = '#3fb950'; // green — trusted
        ctx.fill();
      } else if (score >= CONFIDENCE_LOW) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#8b949e'; // gray — low confidence
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', kp.x, kp.y + 3);
      }
      // score < CONFIDENCE_LOW: render nothing
    });
  };

  const calculateFaults = (
    phases:      DetectedPhases,
    frameWidth:  number,
    frameHeight: number
  ): AnalysisResult => {
    const faults: Fault[] = [];
    let score = 100;
    const { address, top, impact } = phases;

    // Only include a joint in fault calculation if confidence >= CONFIDENCE_TRUST (0.7)
    const trusted = (kp: any) => (kp.score ?? 0) >= CONFIDENCE_TRUST;

    // ── Shoulder Tilt at Address (Phase 0) ───────────────────────────────────
    const addrLS = address.pose.keypoints[5];
    const addrRS = address.pose.keypoints[6];
    if (trusted(addrLS) && trusted(addrRS)) {
      const tilt = Math.abs(addrLS.y - addrRS.y) / frameHeight;
      if (tilt > 0.08) {
        faults.push({
          name: 'Shoulder Tilt at Address',
          phase: 'Address',
          description: 'Your shoulders are not level at address.',
          drill: 'Place a club across your shoulders and set up in front of a mirror. Practice until the club sits parallel to the ground.',
          severity: 'yellow',
        });
        score -= 15;
      }
    }

    // ── Reverse Pivot (Phase 2 — Top) ────────────────────────────────────────
    const addrLS2 = address.pose.keypoints[5];
    const topLS   = top.pose.keypoints[5];
    if (trusted(addrLS2) && trusted(topLS)) {
      const shoulderShift = (topLS.x - addrLS2.x) / frameWidth;
      if (shoulderShift > 0.08) {
        faults.push({
          name: 'Reverse Pivot',
          phase: 'Top',
          description: 'Your weight is shifting toward the target on the backswing.',
          drill: 'Stand with your back against a wall. Your trail hip should graze the wall on the backswing — not your lead hip.',
          severity: 'red',
        });
        score -= 20;
      }
    }

    // ── Head Up at Impact (Phase 3) ──────────────────────────────────────────
    const addrNose = address.pose.keypoints[0];
    const impNose  = impact.pose.keypoints[0];
    if (trusted(addrNose) && trusted(impNose)) {
      const headRise = (addrNose.y - impNose.y) / frameHeight;
      if (headRise > 0.06) {
        faults.push({
          name: 'Head Up at Impact',
          phase: 'Impact',
          description: 'Your head is rising before impact — you are coming out of the shot.',
          drill: 'Focus on the back of the ball until after impact. Put a tee in the ground and try to see it after the swing.',
          severity: 'red',
        });
        score -= 20;
      }
    }

    // ── Early Extension (Phase 3 — Impact) ───────────────────────────────────
    const addrLH = address.pose.keypoints[11];
    const impLH  = impact.pose.keypoints[11];
    if (trusted(addrLH) && trusted(impLH)) {
      const hipThrust = Math.abs(addrLH.x - impLH.x) / frameWidth;
      if (hipThrust > 0.1) {
        faults.push({
          name: 'Early Extension',
          phase: 'Impact',
          description: 'Your hips are thrusting toward the ball through impact.',
          drill: 'Place a headcover behind your trail heel at address. Keep your hips back and rotate around your spine through impact.',
          severity: 'red',
        });
        score -= 20;
      }
    }

    // Chronological triage — report top 2 faults by phase order (fix root cause first)
    const phaseOrder = ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'];
    faults.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));

    return {
      score:  Math.max(0, score),
      faults: faults.slice(0, 2),
      phases: ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'],
    };
  };

  return (
    <div className="analyzer">
      <div className="upload-section">
        <label className="upload-label">
          <input type="file" accept="video/*" onChange={handleFileUpload} />
          <div className="upload-box">
            {videoFile ? (
              <span>✅ {videoFile.name}</span>
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
          <button
            className="analyze-btn"
            onClick={analyzeSwing}
            disabled={analyzing}
          >
            {analyzing ? '🔄 Analyzing...' : '⚡ Analyze Swing'}
          </button>
        )}
      </div>

      {videoUrl && (
        <div className="video-section">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="video-player"
            crossOrigin="anonymous"
          />
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
          </div>

          {result.faults.length === 0 ? (
            <div className="no-faults">✅ Great swing! No major faults detected.</div>
          ) : (
            <div className="faults-list">
              <h3>Top Faults Found</h3>
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

          <button className="speak-btn" onClick={() => speakResult(result)}>
            🔊 Read Results Aloud
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';

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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const speakResult = (result: AnalysisResult) => {
    if ('speechSynthesis' in window) {
      const text = `Score ${result.score}. ${
        result.faults.length > 0
          ? `Primary fault: ${result.faults[0].name}. Drill: ${result.faults[0].drill}`
          : 'Great swing! No major faults detected.'
      }`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const analyzeSwing = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setCurrentPhase('Loading pose detection model...');

    try {
      const tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');
      setCurrentPhase('Model loaded. Analyzing swing phases...');

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        }
      );

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const phases = ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'];
      const poseData: any[] = [];
      const duration = video.duration;
      const sampleTimes = [0.05, 0.25, 0.5, 0.75, 0.95];

      for (let i = 0; i < sampleTimes.length; i++) {
        setCurrentPhase(`Analyzing ${phases[i]}...`);
        video.currentTime = duration * sampleTimes[i];
        await new Promise(resolve => setTimeout(resolve, 300));

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const poses = await detector.estimatePoses(canvas);

        if (poses.length > 0) {
          poseData.push({ phase: phases[i], pose: poses[0], time: sampleTimes[i] });
          drawPoseOnCanvas(ctx, poses[0], canvas.width, canvas.height);
        }
      }

      setCurrentPhase('Calculating faults...');
      const analysisResult = calculateFaults(poseData);
      setResult(analysisResult);
      setCurrentPhase('');
      speakResult(analysisResult);

      // Save to history
      const history = JSON.parse(localStorage.getItem('swingHistory') || '[]');
      history.unshift({
        date: new Date().toISOString(),
        score: analysisResult.score,
        faults: analysisResult.faults.map(f => f.name),
      });
      localStorage.setItem('swingHistory', JSON.stringify(history.slice(0, 50)));

    } catch (err) {
      console.error(err);
      setCurrentPhase('Error analyzing swing. Please try again.');
    }
    setAnalyzing(false);
  };

  const drawPoseOnCanvas = (ctx: CanvasRenderingContext2D, pose: any, width: number, height: number) => {
    const keypoints = pose.keypoints;
    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
      [5, 11], [6, 12], [11, 12], [11, 13], [13, 15],
      [12, 14], [14, 16]
    ];

    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    connections.forEach(([a, b]) => {
      const kpA = keypoints[a];
      const kpB = keypoints[b];
      if (kpA.score > 0.5 && kpB.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(kpA.x, kpA.y);
        ctx.lineTo(kpB.x, kpB.y);
        ctx.stroke();
      }
    });

    keypoints.forEach((kp: any) => {
      if (kp.score > 0.5) {
        const color = kp.score > 0.7 ? '#3fb950' : kp.score > 0.5 ? '#d29922' : '#8b949e';
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
  };

  const calculateFaults = (poseData: any[]): AnalysisResult => {
    const faults: Fault[] = [];
    let score = 100;

    if (poseData.length < 3) {
      return { score: 0, faults: [], phases: [] };
    }

    const address = poseData.find(p => p.phase === 'Address')?.pose;
    const top = poseData.find(p => p.phase === 'Top')?.pose;
    const impact = poseData.find(p => p.phase === 'Impact')?.pose;

    // Check shoulder tilt at address
    if (address) {
      const leftShoulder = address.keypoints[5];
      const rightShoulder = address.keypoints[6];
      if (leftShoulder.score > 0.6 && rightShoulder.score > 0.6) {
        const tilt = Math.abs(leftShoulder.y - rightShoulder.y);
        const frameHeight = 480;
        if (tilt / frameHeight > 0.08) {
          faults.push({
            name: 'Shoulder Tilt at Address',
            phase: 'Address',
            description: 'Your shoulders are not level at address.',
            drill: 'Stand in front of a mirror and place a club across your shoulders. Practice setting up with the club parallel to the ground.',
            severity: 'yellow',
          });
          score -= 15;
        }
      }
    }

    // Check head movement (head up at impact)
    if (address && impact) {
      const addressNose = address.keypoints[0];
      const impactNose = impact.keypoints[0];
      if (addressNose.score > 0.6 && impactNose.score > 0.6) {
        const headRise = addressNose.y - impactNose.y;
        const frameHeight = 480;
        if (headRise / frameHeight > 0.06) {
          faults.push({
            name: 'Head Up at Impact',
            phase: 'Impact',
            description: 'Your head is rising before impact — you are coming out of the shot.',
            drill: 'Keep your eyes focused on the back of the ball until after impact. Practice with a tee in the ground and try to see the tee after you swing.',
            severity: 'red',
          });
          score -= 20;
        }
      }
    }

    // Check early extension (hips moving toward ball)
    if (address && impact) {
      const addressLeftHip = address.keypoints[11];
      const impactLeftHip = impact.keypoints[11];
      if (addressLeftHip.score > 0.6 && impactLeftHip.score > 0.6) {
        const hipThrust = Math.abs(addressLeftHip.x - impactLeftHip.x);
        const frameWidth = 640;
        if (hipThrust / frameWidth > 0.1) {
          faults.push({
            name: 'Early Extension',
            phase: 'Impact',
            description: 'Your hips are thrusting toward the ball through impact.',
            drill: 'Place a headcover behind your right heel at address. Focus on keeping your hips back and rotating around your spine through impact.',
            severity: 'red',
          });
          score -= 20;
        }
      }
    }

    // Check reverse pivot at top
    if (address && top) {
      const addressLeftHip = address.keypoints[11];
      const topLeftHip = top.keypoints[11];
      const addressLeftShoulder = address.keypoints[5];
      const topLeftShoulder = top.keypoints[5];
      if (
        addressLeftHip.score > 0.6 && topLeftHip.score > 0.6 &&
        addressLeftShoulder.score > 0.6 && topLeftShoulder.score > 0.6
      ) {
        const shoulderShift = topLeftShoulder.x - addressLeftShoulder.x;
        const frameWidth = 640;
        if (shoulderShift / frameWidth > 0.08) {
          faults.push({
            name: 'Reverse Pivot',
            phase: 'Top',
            description: 'Your weight is shifting toward the target on the backswing.',
            drill: 'Feel your right hip turning behind you on the backswing. Practice with your back against a wall — your right hip should graze the wall as you turn back.',
            severity: 'red',
          });
          score -= 20;
        }
      }
    }

    // Limit to top 2 faults (chronological)
    const phaseOrder = ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'];
    faults.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));
    const topFaults = faults.slice(0, 2);
    const finalScore = Math.max(0, score + (faults.length - topFaults.length) * 0);

    return {
      score: Math.max(0, finalScore),
      faults: topFaults,
      phases: poseData.map(p => p.phase),
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
            <div className="no-faults">
              ✅ Great swing! No major faults detected.
            </div>
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

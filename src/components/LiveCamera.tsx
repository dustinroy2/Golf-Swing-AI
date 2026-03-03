import React, { useRef, useState, useEffect } from 'react';

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ready' | 'recording' | 'processing'>('idle');
  const [swingsQueued, setSwingsQueued] = useState(0);
  const [framing, setFraming] = useState<'too-far' | 'too-close' | 'good' | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const framingIntervalRef = useRef<any>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setStatus('ready');
        startFramingCheck();
      }
    } catch (err) {
      alert('Camera access denied. Please allow camera access and try again.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(framingIntervalRef.current);
    setCameraActive(false);
    setStatus('idle');
    setFraming(null);
  };

  const startFramingCheck = async () => {
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();

    const poseDetection = await import('@tensorflow-models/pose-detection');
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
    detectorRef.current = detector;

    framingIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      try {
        const poses = await detector.estimatePoses(canvas);
        if (poses.length > 0) {
          const keypoints = poses[0].keypoints.filter((kp: any) => kp.score > 0.3);
          if (keypoints.length > 0) {
            const xs = keypoints.map((kp: any) => kp.x);
            const ys = keypoints.map((kp: any) => kp.y);
            const bboxWidth = (Math.max(...xs) - Math.min(...xs)) / canvas.width;
            const bboxHeight = (Math.max(...ys) - Math.min(...ys)) / canvas.height;
            const coverage = Math.max(bboxWidth, bboxHeight);

            if (coverage < 0.4) setFraming('too-far');
            else if (coverage > 0.85) setFraming('too-close');
            else setFraming('good');
          }
        }
      } catch (e) {}
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const framingMessage = () => {
    if (framing === 'too-far') return { text: '📏 Move closer to camera', color: '#f85149' };
    if (framing === 'too-close') return { text: '↔️ Move further from camera', color: '#f85149' };
    if (framing === 'good') return { text: '✅ Perfect framing — ready to swing!', color: '#3fb950' };
    return { text: '👤 Step into frame', color: '#8b949e' };
  };

  const msg = framingMessage();

  return (
    <div className="live-camera">
      <div className="camera-header">
        <h2>🎥 Live Range Mode</h2>
        <p>Auto-detects and analyzes your swings continuously</p>
      </div>

      {!cameraActive ? (
        <div className="camera-start">
          <div className="camera-icon">📷</div>
          <h3>Start Live Analysis</h3>
          <p>Point your device at the golfer from the side. The app will automatically detect and analyze each swing.</p>
          <button className="analyze-btn" onClick={startCamera}>
            🎥 Start Camera
          </button>
        </div>
      ) : (
        <div className="camera-view">
          <div className="framing-indicator" style={{ borderColor: msg.color }}>
            <span style={{ color: msg.color }}>{msg.text}</span>
            {framing === 'good' && (
              <span className="haptic-badge">📳 Haptic ready on iOS</span>
            )}
          </div>

          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-player"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {framing === 'good' && (
              <div className="ready-overlay">
                <div className="ready-pulse" />
              </div>
            )}
          </div>

          {swingsQueued > 0 && (
            <div className="queue-badge">
              ⚙️ {swingsQueued} swing{swingsQueued > 1 ? 's' : ''} processing...
            </div>
          )}

          <div className="camera-controls">
            <button className="stop-btn" onClick={stopCamera}>
              ⏹ Stop Camera
            </button>
          </div>

          <div className="live-info">
            <div className="info-card">
              <strong>Range Mode</strong>
              <p>In the full iOS app, swings are auto-clipped and analyzed in the background while you keep hitting.</p>
            </div>
            <div className="info-card">
              <strong>Audio Coach</strong>
              <p>Wear your AirPods — results will be spoken aloud after each swing is processed.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

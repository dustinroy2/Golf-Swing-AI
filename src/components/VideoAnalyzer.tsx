import React, { useState, useRef } from 'react';
import {
  detectSwingPhases,
  DetectedPhases,
  SwingFrame,
  CONFIDENCE_TRUST,
  CONFIDENCE_LOW,
} from './SwingStateMachine';
import DualVideoView, { SwingViewData } from './DualVideoView';
import OverlayCanvas from './OverlayCanvas';
import {
  buildSwingArc,
  computeReferencePlane,
  classifySwingPath,
  ArcPoint,
  ReferencePlane,
  SwingPathResult,
} from '../utils/swingPlaneCalculator';
import { extractAngles, ExtractedAngles } from '../utils/angleExtractor';
import SwingReplayScreen from './SwingReplayScreen';
import DiagnosisScreen from './DiagnosisScreen';
import CauseChainScreen from './CauseChainScreen';
import FixScreen from './FixScreen';

type V3Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';

declare global {
  interface HTMLVideoElement {
    requestVideoFrameCallback(
      callback: (now: DOMHighResTimeStamp, metadata: { mediaTime: number; presentedFrames: number }) => void
    ): number;
  }
}

export type ShotShape = 'slice' | 'pull' | 'push' | 'hook' | 'thin' | 'chunk' | 'shank' | 'topped';

interface Fault {
  name: string;
  phase: string;
  description: string;
  drill: string;
  severity: 'red' | 'yellow';
  shotShapes: ShotShape[];  // shot outcomes caused by this fault
}

export interface ScorecardRow {
  name:   string;
  phase:  string;
  status: 'good' | 'bad';
  note:   string;
}

interface AnalysisResult {
  score:              number;
  faults:             Fault[];
  phases:             string[];
  skippedChecks:      string[];
  assessedCheckNames: string[];  // which checks were actually assessed
  assessedCount:      number;
  totalChecks:        number;
  shankRisk:          boolean;   // true when multiple impact faults suggest shank territory
  scorecardRows:      ScorecardRow[]; // full pass/fail list for Fix Screen
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

// ─── Utility functions ────────────────────────────────────────────────────────

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
      resolve({
        fps,
        fpsTier:  fps >= 120 ? 'high' : fps >= 60 ? 'medium' : 'low',
        width:    video.videoWidth  || 0,
        height:   video.videoHeight || 0,
        duration: video.duration    || 0,
      });
    };

    video.addEventListener('loadedmetadata', () => {
      if (!('requestVideoFrameCallback' in video)) { finish(30); return; }

      let frameCount = 0;
      let startTime: number | null = null;
      const SAMPLE_WINDOW = Math.min(0.5, (video.duration || 0.5) * 0.8);

      const countFrame = (_now: DOMHighResTimeStamp, meta: { mediaTime: number }) => {
        if (startTime === null) startTime = meta.mediaTime;
        frameCount++;
        if (meta.mediaTime - startTime >= SAMPLE_WINDOW) {
          finish(Math.round(frameCount / (meta.mediaTime - startTime)));
        } else {
          video.requestVideoFrameCallback(countFrame);
        }
      };

      const timeout = setTimeout(() => finish(30), 2500);
      video.requestVideoFrameCallback(countFrame);
      video.play().catch(() => { clearTimeout(timeout); finish(30); });
    });

    video.load();
  });
}

function resolutionLabel(w: number, h: number): string {
  const long = Math.max(w, h);
  if (long >= 3840) return '4K';
  if (long >= 1920) return '1080p';
  if (long >= 1280) return '720p';
  if (long >= 854)  return '480p';
  return `${Math.min(w, h)}p`;
}

function formatDuration(s: number): string {
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

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

function calculateFaults(
  phases:      DetectedPhases,
  frameWidth:  number,
  frameHeight: number,
  angle:       'dtl' | 'faceOn',
): AnalysisResult {
  const faults: Fault[]              = [];
  const skippedChecks: string[]      = [];
  const assessedCheckNames: string[] = [];
  const scorecardRows: ScorecardRow[]= [];
  const TOTAL_CHECKS = 3;
  let score = 100;
  const { address, top, impact } = phases;
  const trusted = (kp: any) => (kp?.score ?? 0) >= CONFIDENCE_TRUST;
  const visible  = (kp: any) => (kp?.score ?? 0) >= CONFIDENCE_LOW;

  const skip = (joints: any[], unclearMsg: string, notVisMsg: string) => {
    skippedChecks.push(joints.some(visible) ? unclearMsg : notVisMsg);
  };

  // ── Shoulder Tilt at Address ───────────────────────────────────────────────
  const addrLS = address.pose.keypoints[5];
  const addrRS = address.pose.keypoints[6];
  if (trusted(addrLS) && trusted(addrRS)) {
    assessedCheckNames.push('Shoulder Tilt');
    if (Math.abs(addrLS.y - addrRS.y) / frameHeight > 0.08) {
      faults.push({
        name: 'Shoulder Tilt at Address', phase: 'Setup', severity: 'yellow',
        description: 'Your shoulders are not level at address. This pre-sets a compensating move through the swing.',
        drill: 'Place a club across your shoulders in front of a mirror. Practice until the club sits parallel to the ground.',
        shotShapes: ['push', 'pull'],
      });
      scorecardRows.push({ name: 'Shoulder Alignment', phase: 'Setup', status: 'bad', note: 'Not level at address' });
      score -= 15;
    } else {
      scorecardRows.push({ name: 'Shoulder Alignment', phase: 'Setup', status: 'good', note: 'Level and square' });
    }
  } else {
    skip([addrLS, addrRS],
      'Shoulder alignment at address unclear — try better lighting',
      'Shoulders not visible at address — adjust camera to show full upper body');
  }

  // ── Reverse Pivot — Face-On only ──────────────────────────────────────────
  if (angle === 'faceOn') {
    const addrLS2 = address.pose.keypoints[5];
    const topLS   = top.pose.keypoints[5];
    if (trusted(addrLS2) && trusted(topLS)) {
      assessedCheckNames.push('Weight Shift');
      if ((topLS.x - addrLS2.x) / frameWidth > 0.08) {
        faults.push({
          name: 'Reverse Pivot', phase: 'Top of Backswing', severity: 'red',
          description: 'Your weight is shifting toward the target on the backswing. This causes you to fall back through impact, robbing power and direction.',
          drill: 'Stand with your back against a wall. Feel your trail hip graze the wall on the backswing — pressure should load into your trail foot.',
          shotShapes: ['slice', 'push', 'topped'],
        });
        scorecardRows.push({ name: 'Weight Transfer', phase: 'Top of Backswing', status: 'bad', note: 'Reverse pivot detected' });
        score -= 20;
      } else {
        scorecardRows.push({ name: 'Weight Transfer', phase: 'Top of Backswing', status: 'good', note: 'Weight loads into trail foot' });
      }
    } else {
      skip([addrLS2, topLS],
        'Shoulder position unclear at top — try better lighting',
        'Shoulders not visible at top — ensure full upper body is in frame');
    }
  }

  // ── Head Up at Impact ─────────────────────────────────────────────────────
  const addrNose = address.pose.keypoints[0];
  const impNose  = impact.pose.keypoints[0];
  if (trusted(addrNose) && trusted(impNose)) {
    assessedCheckNames.push('Head Position');
    if ((addrNose.y - impNose.y) / frameHeight > 0.06) {
      faults.push({
        name: 'Head Up at Impact', phase: 'Moment of Impact', severity: 'red',
        description: 'Your head is rising before impact — you\'re coming out of the shot early. The club face opens and the path goes off-plane at the worst possible moment.',
        drill: 'Place a tee in the ground at the ball position. Keep your eyes on that tee until you hear the club pass through. "Watch the tee disappear."',
        shotShapes: ['thin', 'shank', 'slice'],
      });
      scorecardRows.push({ name: 'Head Position', phase: 'Moment of Impact', status: 'bad', note: 'Rose before contact' });
      score -= 20;
    } else {
      scorecardRows.push({ name: 'Head Position', phase: 'Moment of Impact', status: 'good', note: 'Stayed level through impact' });
    }
  } else {
    skip([addrNose, impNose],
      'Head position unclear at impact — ensure face is visible',
      'Head not visible — make sure face is not cut off by the camera');
  }

  // ── Early Extension — DTL only ────────────────────────────────────────────
  if (angle === 'dtl') {
    const addrLH = address.pose.keypoints[11];
    const impLH  = impact.pose.keypoints[11];
    if (trusted(addrLH) && trusted(impLH)) {
      assessedCheckNames.push('Hip Stability');
      if (Math.abs(addrLH.x - impLH.x) / frameWidth > 0.1) {
        faults.push({
          name: 'Early Extension', phase: 'Moment of Impact', severity: 'red',
          description: 'Your hips are thrusting toward the ball through impact. The club is forced off-plane and the hosel leads the face — the most common cause of shanks.',
          drill: 'Set up with your trail glute touching a wall. Maintain that contact through impact. Your hips rotate, they don\'t lunge forward.',
          shotShapes: ['shank', 'chunk', 'thin'],
        });
        scorecardRows.push({ name: 'Hip Position', phase: 'Moment of Impact', status: 'bad', note: 'Early extension — hips lunging forward' });
        score -= 20;
      } else {
        scorecardRows.push({ name: 'Hip Position', phase: 'Moment of Impact', status: 'good', note: 'Hips stayed back through impact' });
      }
    } else {
      skip([addrLH, impLH],
        'Hip position unclear at impact — try filming directly down the line',
        'Hips not visible — ensure full body from head to knees is in frame');
    }
  }

  const phaseOrder = ['Setup', 'Takeaway', 'Top of Backswing', 'Moment of Impact', 'Follow-Through'];
  faults.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));

  // Shank risk: any fault that lists 'shank' as a shot shape
  const shankRisk = faults.some(f => f.shotShapes.includes('shank'));

  return {
    score:              Math.max(0, score),
    faults,
    phases:             phaseOrder,
    skippedChecks,
    assessedCheckNames,
    assessedCount:      assessedCheckNames.length,
    totalChecks:        TOTAL_CHECKS,
    shankRisk,
    scorecardRows,
  };
}

function drawImpactFrame(pose: any, canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  const ctx = canvas.getContext('2d')!;
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const kps = pose.keypoints;
  const connections = [[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
  ctx.strokeStyle = '#3fb950'; ctx.lineWidth = 2.5;
  connections.forEach(([a,b]) => {
    const kpA = kps[a], kpB = kps[b];
    if ((kpA?.score??0) >= CONFIDENCE_LOW && (kpB?.score??0) >= CONFIDENCE_LOW) {
      ctx.beginPath(); ctx.moveTo(kpA.x,kpA.y); ctx.lineTo(kpB.x,kpB.y); ctx.stroke();
    }
  });
  [15,16].forEach(i => {
    const kp = kps[i];
    if ((kp?.score??0) >= CONFIDENCE_LOW) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(kp.x,kp.y); ctx.lineTo(kp.x,canvas.height); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
  kps.forEach((kp: any) => {
    const s = kp?.score ?? 0;
    if (s >= CONFIDENCE_TRUST) {
      ctx.beginPath(); ctx.arc(kp.x,kp.y,6,0,Math.PI*2); ctx.fillStyle='#3fb950'; ctx.fill();
    } else if (s >= CONFIDENCE_LOW) {
      ctx.beginPath(); ctx.arc(kp.x,kp.y,6,0,Math.PI*2); ctx.fillStyle='#8b949e'; ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center';
      ctx.fillText('?',kp.x,kp.y+3);
    }
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoAnalyzer() {
  // Angle type — editable on page
  const [swingAngle, setSwingAngle] = useState<'dtl'|'faceOn'>(
    (localStorage.getItem('swingType') ?? 'dtl') as 'dtl'|'faceOn'
  );

  // Primary video
  const [videoFile, setVideoFile]       = useState<File | null>(null);
  const [videoUrl, setVideoUrl]         = useState('');
  const [videoMeta, setVideoMeta]       = useState<VideoMeta | null>(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [result, setResult]             = useState<AnalysisResult | null>(null);
  const [tempoResult, setTempoResult]   = useState<TempoResult | null>(null);
  const [progressMsg, setProgressMsg]   = useState('');
  const [allFrames, setAllFrames]       = useState<SwingFrame[]>([]);
  const [detectedPhases, setDetectedPhases] = useState<DetectedPhases | null>(null);

  // v3 Screen state (null = pre-analysis)
  const [screen, setScreen]   = useState<V3Screen | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Swing path data (computed for history/future use, not displayed in v3 screens)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [swingArc, setSwingArc]               = useState<ArcPoint[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [referencePlane, setReferencePlane]   = useState<ReferencePlane | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [swingPathResult, setSwingPathResult] = useState<SwingPathResult | null>(null);

  // Angles per phase (computed for history/future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [phaseAngles, setPhaseAngles] = useState<Record<string, ExtractedAngles>>({});

  // Secondary video
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [view2File, setView2File]     = useState<File | null>(null);
  const [view2Url, setView2Url]       = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [view2Meta, setView2Meta]     = useState<VideoMeta | null>(null);
  const [analyzing2, setAnalyzing2]   = useState(false);
  const [result2, setResult2]         = useState<AnalysisResult | null>(null);
  const [allFrames2, setAllFrames2]   = useState<SwingFrame[]>([]);
  const [phases2, setPhases2]         = useState<DetectedPhases | null>(null);
  const [progressMsg2, setProgressMsg2] = useState('');

  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const video2Ref  = useRef<HTMLVideoElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  // ── Angle selection ────────────────────────────────────────────────────────
  const handleAngleChange = (angle: 'dtl' | 'faceOn') => {
    setSwingAngle(angle);
    localStorage.setItem('swingType', angle);
    if (videoUrl) {
      setResult(null);
      setTempoResult(null);
      setAllFrames([]);
      setDetectedPhases(null);
      setScreen(null);
      setSwingArc([]);
      setReferencePlane(null);
      setSwingPathResult(null);
      setPhaseAngles({});
    }
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResult(null);
    setTempoResult(null);
    setVideoMeta(null);
    setProgressMsg('');
    setAllFrames([]);
    setDetectedPhases(null);
    setScreen(null);
    setSwingArc([]);
    setReferencePlane(null);
    setSwingPathResult(null);
    setPhaseAngles({});
    setView2File(null); setView2Url(''); setResult2(null); setAllFrames2([]); setPhases2(null);
    detectVideoMeta(file).then(setVideoMeta);
  };

  const handleReset = () => {
    setVideoFile(null); setVideoUrl(''); setVideoMeta(null);
    setResult(null); setTempoResult(null); setProgressMsg('');
    setAllFrames([]); setDetectedPhases(null);
    setScreen(null);
    setSwingArc([]); setReferencePlane(null); setSwingPathResult(null);
    setPhaseAngles({});
    setView2File(null); setView2Url(''); setResult2(null); setAllFrames2([]); setPhases2(null);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  // ── Speech ────────────────────────────────────────────────────────────────
  const speakResult = (res: AnalysisResult) => {
    if (!('speechSynthesis' in window)) return;
    const text = `Score ${res.score}. ${
      res.faults.length > 0
        ? `Primary fault: ${res.faults[0].name}. Drill: ${res.faults[0].drill}`
        : 'Great swing! No major faults detected.'
    }`;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const handleSpeakToggle = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else if (result) {
      speakResult(result);
    }
  };

  // ── Core analysis engine ──────────────────────────────────────────────────
  const runAnalysis = async (
    videoEl:  HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    onProgress: (msg: string) => void,
    angle: 'dtl' | 'faceOn',
  ) => {
    onProgress('Loading pose detection model...');
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();

    const poseDetection = await import('@tensorflow-models/pose-detection');
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );

    const phases = await detectSwingPhases(videoEl, canvasEl, detector, onProgress);
    if (!phases) return null;

    onProgress('Calculating faults...');
    drawImpactFrame(phases.impact.pose, canvasEl, videoEl);

    const frameWidth  = canvasEl.width;
    const frameHeight = canvasEl.height;
    const analysisResult = calculateFaults(phases, frameWidth, frameHeight, angle);
    const tempo          = calculateTempo(phases);

    return { result: analysisResult, tempo, phases, allFrames: phases.allFrames };
  };

  // ── Analyze primary swing ─────────────────────────────────────────────────
  const analyzeSwing = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setResult(null); setTempoResult(null); setAllFrames([]); setDetectedPhases(null);
    setScreen(null); setSwingArc([]); setReferencePlane(null);

    try {
      const out = await runAnalysis(videoRef.current, canvasRef.current, setProgressMsg, swingAngle);

      if (!out) {
        setProgressMsg('Could not detect swing. Ensure full body is visible with good lighting.');
        setAnalyzing(false);
        return;
      }

      setResult(out.result);
      setTempoResult(out.tempo);
      setDetectedPhases(out.phases);
      setAllFrames(out.allFrames);
      setProgressMsg('');

      // Build swing path arc
      const arc = buildSwingArc(
        out.allFrames,
        out.phases.address.time,
        out.phases.top.time,
        out.phases.impact.time,
        out.phases.followThrough.time,
      );
      setSwingArc(arc);

      // Extract per-phase angles
      setPhaseAngles({
        Address: extractAngles(out.phases.address.pose.keypoints),
        Top:     extractAngles(out.phases.top.pose.keypoints),
        Impact:  extractAngles(out.phases.impact.pose.keypoints),
      });

      // Compute reference plane (need to wait for video element dimensions)
      // We'll compute on next frame when video has dimensions
      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (vid && canvas) {
        const scaleX = canvas.clientWidth  / (vid.videoWidth  || canvas.clientWidth);
        const scaleY = canvas.clientHeight / (vid.videoHeight || canvas.clientHeight);
        const plane = computeReferencePlane(
          out.phases.address.pose.keypoints,
          scaleX, scaleY,
          canvas.clientHeight || 400,
        );
        setReferencePlane(plane);

        if (plane && arc.length > 0) {
          const pathResult = classifySwingPath(
            arc, plane, scaleX, scaleY,
            vid.videoWidth || 640,
            vid.videoHeight || 480,
            canvas.clientHeight || 400,
          );
          setSwingPathResult(pathResult);
        }
      }

      // Save to history
      const history = JSON.parse(localStorage.getItem('swingHistory') || '[]');
      history.unshift({
        date:          new Date().toISOString(),
        score:         out.result.score,
        faults:        out.result.faults.map(f => f.name),
        assessedCount: out.result.assessedCount,
        totalChecks:   out.result.totalChecks,
      });
      localStorage.setItem('swingHistory', JSON.stringify(history.slice(0, 50)));

      // Launch v3 replay screen
      setScreen('replay');

    } catch (err) {
      console.error(err);
      setProgressMsg('Error analyzing swing. Please try again.');
    }

    setAnalyzing(false);
  };

  // ── Analyze second swing ──────────────────────────────────────────────────
  const analyzeSwing2 = async () => {
    if (!video2Ref.current || !canvas2Ref.current) return;
    setAnalyzing2(true);
    setResult2(null); setAllFrames2([]); setPhases2(null);
    try {
      const out = await runAnalysis(video2Ref.current, canvas2Ref.current, setProgressMsg2, swingAngle);
      if (!out) { setProgressMsg2('Could not detect swing in second video.'); setAnalyzing2(false); return; }
      setResult2(out.result);
      setPhases2(out.phases);
      setAllFrames2(out.allFrames);
      setProgressMsg2('');
    } catch (err) {
      setProgressMsg2('Error analyzing second video.');
    }
    setAnalyzing2(false);
  };

  // ── Score color ────────────────────────────────────────────────────────────
  const scoreColor = (s: number) => s >= 80 ? '#3fb950' : s >= 60 ? '#d29922' : '#f85149';

  // ── Dual view ─────────────────────────────────────────────────────────────
  const dualReady = result && result2 && detectedPhases && phases2 && videoUrl && view2Url;

  if (dualReady) {
    const view1: SwingViewData = {
      videoUrl, allFrames, phases: detectedPhases!, result: result!, angle: swingAngle, label: 'Swing 1',
    };
    const view2: SwingViewData = {
      videoUrl: view2Url, allFrames: allFrames2, phases: phases2!, result: result2!, angle: swingAngle, label: 'Swing 2',
    };
    return (
      <div className="analyzer">
        <button className="reset-btn" style={{ margin: '0 0 12px' }} onClick={() => {
          setView2File(null); setView2Url(''); setResult2(null); setAllFrames2([]); setPhases2(null);
        }}>✕ Close Dual View</button>
        <DualVideoView
          view1={view1} view2={view2}
          overlays1={{ skeleton: true, pro: false, angles: false, trail: false }}
          overlays2={{ skeleton: true, pro: false, angles: false, trail: false }}
          onOverlays1Change={() => {}} onOverlays2Change={() => {}}
        />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  // v3 screen overlay — takes over the full content area after analysis
  if (screen && result && detectedPhases) {
    return (
      <div className="v3-screen-container">
        {/* Hidden video + canvas kept in DOM for any future seek operations */}
        <video ref={videoRef} src={videoUrl} playsInline muted
          style={{ display: 'none' }} crossOrigin="anonymous" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {screen === 'replay' && (
          <SwingReplayScreen
            videoUrl={videoUrl}
            allFrames={allFrames}
            detectedPhases={detectedPhases}
            frameWidth={videoMeta?.width ?? 640}
            frameHeight={videoMeta?.height ?? 480}
            shankRisk={result.shankRisk}
            faultCount={result.faults.length}
            onNavigate={setScreen}
          />
        )}
        {screen === 'diagnosis' && (
          <DiagnosisScreen
            result={result}
            tempoResult={tempoResult}
            onNavigate={setScreen}
            speaking={speaking}
            onSpeakToggle={handleSpeakToggle}
          />
        )}
        {screen === 'chain' && (
          <CauseChainScreen
            result={result}
            videoUrl={videoUrl}
            detectedPhases={detectedPhases}
            frameWidth={videoMeta?.width ?? 640}
            frameHeight={videoMeta?.height ?? 480}
            onNavigate={setScreen}
          />
        )}
        {screen === 'fix' && (
          <FixScreen
            result={result}
            onNavigate={setScreen}
            onReset={handleReset}
          />
        )}
      </div>
    );
  }

  return (
    <div className="analyzer">

      {/* ── Angle chips (pre-analysis) ─────────────────────────────────────── */}
      <div className="analyzer-topbar">
        <div className="angle-chips">
          <button
            className={`angle-chip${swingAngle === 'dtl' ? ' active' : ''}`}
            onClick={() => handleAngleChange('dtl')}
          >DTL</button>
          <button
            className={`angle-chip${swingAngle === 'faceOn' ? ' active' : ''}`}
            onClick={() => handleAngleChange('faceOn')}
          >Face-On</button>
        </div>
      </div>

      {/* ── Upload area ──────────────────────────────────────────────────── */}
      {!videoUrl && (
        <label className="upload-hero">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            onChange={handleFileUpload}
          />
          <div className="upload-hero-inner">
            <span className="upload-hero-icon">📹</span>
            <span className="upload-hero-text">Upload your swing video</span>
            <span className="upload-hero-hint">MP4 or MOV · On iPhone: tap then choose <strong>Photo Library</strong></span>
          </div>
        </label>
      )}

      {/* ── File meta + actions ───────────────────────────────────────────── */}
      {videoUrl && !result && (
        <div className="upload-meta-row">
          <span className="upload-meta-text">
            {videoFile?.name}
            {videoMeta && ` · ${resolutionLabel(videoMeta.width, videoMeta.height)} · ${videoMeta.fps}fps · ${formatDuration(videoMeta.duration)}`}
            {videoMeta?.fpsTier === 'low' && ' · ⚠ Slo-mo recommended'}
          </span>
          <button className="upload-meta-clear" onClick={handleReset}>✕</button>
        </div>
      )}

      {/* ── Video hero (pre-analysis only) ───────────────────────────────── */}
      {videoUrl && (
        <div className="video-hero-container">
          <video
            ref={videoRef}
            src={videoUrl}
            controls={!result}
            playsInline
            className="video-hero"
            crossOrigin="anonymous"
          />
          {/* Change video button */}
          {result && (
            <button className="video-change-btn" onClick={handleReset}>✕ New Swing</button>
          )}
        </div>
      )}

      {/* ── Hidden analysis canvas ────────────────────────────────────────── */}
      <canvas ref={canvasRef} className="pose-canvas" style={{ display: 'none' }} />

      {/* ── Analyze button / progress ─────────────────────────────────────── */}
      {videoUrl && !result && (
        <div className="analyze-actions">
          <button className="analyze-btn" onClick={analyzeSwing} disabled={analyzing}>
            {analyzing ? '🔄 Analyzing...' : '⚡ Analyze Swing'}
          </button>
          {!analyzing && (
            <button className="reset-btn" onClick={handleReset}>✕ Clear</button>
          )}
        </div>
      )}

      {analyzing && progressMsg && (
        <div className="analyzing-status">
          <div className="spinner">⚙️</div>
          <span>{progressMsg}</span>
        </div>
      )}
      {!analyzing && progressMsg && (
        <div className="analyzing-status error"><span>⚠️ {progressMsg}</span></div>
      )}

      {/* ── Second video section ─────────────────────────────────────────── */}
      {view2Url && (
        <div className="second-video-section">
          <h3 className="second-video-title">Swing 2
            {view2Meta && <span className="video-meta"> · {resolutionLabel(view2Meta.width, view2Meta.height)} · {view2Meta.fps}fps</span>}
          </h3>
          <div className="video-hero-container">
            <video ref={video2Ref} src={view2Url} controls playsInline className="video-hero" crossOrigin="anonymous" />
            {allFrames2.length > 0 && (
              <OverlayCanvas
                videoRef={video2Ref}
                allFrames={allFrames2}
                phaseFrames={phases2}
                angle={swingAngle}
                analysisMode="critique"
                activePhase=""
                faults={result2?.faults ?? []}
                assessedChecks={result2?.assessedCheckNames ?? []}
                swingArc={[]}
                referencePlane={null}
              />
            )}
          </div>
          {!result2 && (
            <button className="analyze-btn" onClick={analyzeSwing2} disabled={analyzing2} style={{ marginTop: 12 }}>
              {analyzing2 ? '🔄 Analyzing...' : '⚡ Analyze Swing 2'}
            </button>
          )}
          {progressMsg2 && <div className="analyzing-status"><span>{progressMsg2}</span></div>}
          {result2 && (
            <div className="result-score-line" style={{ color: scoreColor(result2.score) }}>
              Score: {result2.score} · {result2.faults.length} fault{result2.faults.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

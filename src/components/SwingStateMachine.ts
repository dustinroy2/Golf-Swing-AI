// ─── Keypoint indices (MoveNet 17-keypoint model) ───────────────────────────
export const LEAD_WRIST  = 9;  // left wrist
export const TRAIL_WRIST = 10; // right wrist
// To support left-handed golfers later: swap these two constants — nothing else changes.

// ─── Confidence thresholds (per SRD) ────────────────────────────────────────
export const CONFIDENCE_TRUST = 0.7; // full trust — include in fault calculation
export const CONFIDENCE_LOW   = 0.5; // low confidence — draw gray "?" node, exclude from faults

// ─── Velocity tuning ────────────────────────────────────────────────────────
const TOP_SEARCH_MULTIPLIER = 2.0; // only search for top-of-swing minimum after velocity
                                    // has exceeded 2× takeaway threshold (kills hitch false positive)

// ─── Types ──────────────────────────────────────────────────────────────────
export interface SwingFrame {
  time: number;
  pose: any;
  wristMidpoint: { x: number; y: number; confidence: number };
  velocity: number;
}

export interface DetectedPhases {
  address:        SwingFrame;
  takeaway:       SwingFrame;
  top:            SwingFrame;
  impact:         SwingFrame;
  followThrough:  SwingFrame;
  sampleInterval: number; // seconds between dense-scan frames — used to calculate timing uncertainty
  allFrames:      SwingFrame[]; // all ~20 frames from dense pass — used for overlay animation
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise<void>(resolve => {
    if (Math.abs(video.currentTime - time) < 0.001) { resolve(); return; }
    const timeout = setTimeout(resolve, 500); // fallback if seeked never fires
    const onSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

async function getPoseAtTime(
  video:    HTMLVideoElement,
  canvas:   HTMLCanvasElement,
  ctx:      CanvasRenderingContext2D,
  detector: any,
  time:     number
): Promise<any | null> {
  await seekTo(video, time);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const poses = await detector.estimatePoses(canvas);
  return poses.length > 0 ? poses[0] : null;
}

function getWristMidpoint(pose: any): { x: number; y: number; confidence: number } {
  const lw = pose.keypoints[LEAD_WRIST];
  const tw = pose.keypoints[TRAIL_WRIST];
  return {
    x:          (lw.x + tw.x) / 2,
    y:          (lw.y + tw.y) / 2,
    confidence: Math.min(lw.score ?? 0, tw.score ?? 0),
  };
}

// ─── Two-Pass Swing Phase Detector ───────────────────────────────────────────

export async function detectSwingPhases(
  video:      HTMLVideoElement,
  canvas:     HTMLCanvasElement,
  detector:   any,
  onProgress: (msg: string) => void
): Promise<DetectedPhases | null> {

  const duration    = video.duration;
  const ctx         = canvas.getContext('2d')!;
  canvas.width      = video.videoWidth  || 640;
  canvas.height     = video.videoHeight || 480;
  const frameHeight = canvas.height;

  // ── PASS 1: Coarse scan (10 frames across full video) ─────────────────────
  // Goal: find the approximate time of peak wrist velocity (≈ impact)
  // so Pass 2 only processes the relevant 2-3 second window.

  const COARSE_SAMPLES = 10;
  const coarse: Array<{ time: number; x: number; y: number }> = [];

  for (let i = 0; i < COARSE_SAMPLES; i++) {
    onProgress(`Pass 1: Scanning for swing (${i + 1}/${COARSE_SAMPLES})...`);
    const t    = (i / (COARSE_SAMPLES - 1)) * duration;
    const pose = await getPoseAtTime(video, canvas, ctx, detector, t);
    if (pose) {
      const w = getWristMidpoint(pose);
      if (w.confidence > 0.3) coarse.push({ time: t, x: w.x, y: w.y });
    }
  }

  if (coarse.length < 3) return null;

  // Find the interval with highest wrist velocity
  let maxVel = 0;
  let peakInterval = 1;
  for (let i = 1; i < coarse.length; i++) {
    const dt  = coarse[i].time - coarse[i - 1].time;
    const dx  = (coarse[i].x - coarse[i - 1].x) / frameHeight;
    const dy  = (coarse[i].y - coarse[i - 1].y) / frameHeight;
    const vel = Math.sqrt(dx * dx + dy * dy) / dt;
    if (vel > maxVel) { maxVel = vel; peakInterval = i; }
  }

  // Midpoint of peak interval ≈ impact time
  const swingCenter = (coarse[peakInterval - 1].time + coarse[peakInterval].time) / 2;
  const swingStart  = Math.max(0,        swingCenter - 2.0); // 2s before impact catches address
  const swingEnd    = Math.min(duration, swingCenter + 1.0); // 1s after impact catches follow-through

  // ── PASS 2: Dense scan (20 frames within swingStart→swingEnd) ─────────────
  // Goal: build a velocity curve over the swing window and run the state machine.

  const DENSE_SAMPLES = 20;
  const frames: SwingFrame[] = [];

  for (let i = 0; i < DENSE_SAMPLES; i++) {
    onProgress(`Pass 2: Analyzing frame ${i + 1}/${DENSE_SAMPLES}...`);
    const t    = swingStart + (i / (DENSE_SAMPLES - 1)) * (swingEnd - swingStart);
    const pose = await getPoseAtTime(video, canvas, ctx, detector, t);
    if (pose) {
      const wrist = getWristMidpoint(pose);
      frames.push({ time: t, pose, wristMidpoint: wrist, velocity: 0 });
    }
  }

  if (frames.length < 5) return null;

  // Calculate per-frame wrist velocities (normalized to frame height)
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1];
    const curr = frames[i];
    const dt   = curr.time - prev.time;
    if (dt > 0) {
      const dx = (curr.wristMidpoint.x - prev.wristMidpoint.x) / frameHeight;
      const dy = (curr.wristMidpoint.y - prev.wristMidpoint.y) / frameHeight;
      curr.velocity = Math.sqrt(dx * dx + dy * dy) / dt;
    }
  }
  frames[0].velocity = frames[1]?.velocity ?? 0;

  const vels = frames.map(f => f.velocity);

  // ── State Machine ─────────────────────────────────────────────────────────

  // Impact = global velocity maximum (downswing is always the fastest point)
  const impactIdx = vels.indexOf(Math.max(...vels));

  // Adaptive takeaway threshold = mean + 0.5 stddev of all velocities
  const mean = vels.reduce((a, b) => a + b, 0) / vels.length;
  const std  = Math.sqrt(vels.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / vels.length);
  const TAKEAWAY_THRESHOLD  = mean + std * 0.5;
  const TOP_GUARD_THRESHOLD = TAKEAWAY_THRESHOLD * TOP_SEARCH_MULTIPLIER;

  // Address = last frame before velocity first crosses takeaway threshold
  let firstSpike = impactIdx;
  for (let i = 0; i < impactIdx; i++) {
    if (frames[i].velocity >= TAKEAWAY_THRESHOLD) { firstSpike = i; break; }
  }
  const addressIdx = Math.max(0, firstSpike - 1);

  // Takeaway = first frame crossing takeaway threshold after address
  let takeawayIdx = addressIdx + 1;
  for (let i = addressIdx + 1; i < impactIdx; i++) {
    if (frames[i].velocity >= TAKEAWAY_THRESHOLD) { takeawayIdx = i; break; }
  }

  // Top = local velocity minimum AFTER velocity has crossed 2× takeaway threshold
  // (guard against false minimums from tempo hitches mid-takeaway)
  let topIdx: number | null = null;
  let crossedGuard = false;
  for (let i = takeawayIdx; i < impactIdx - 1; i++) {
    if (frames[i].velocity >= TOP_GUARD_THRESHOLD) crossedGuard = true;
    if (crossedGuard) {
      if (frames[i].velocity <= frames[i - 1].velocity &&
          frames[i].velocity <= frames[i + 1].velocity) {
        topIdx = i;
        break;
      }
    }
  }
  // Fallback: lowest velocity in takeaway→impact range
  if (topIdx === null) {
    let minV = Infinity;
    for (let i = takeawayIdx; i < impactIdx; i++) {
      if (frames[i].velocity < minV) { minV = frames[i].velocity; topIdx = i; }
    }
  }
  const resolvedTopIdx = topIdx ?? Math.floor((takeawayIdx + impactIdx) / 2);

  // Follow-through = second local velocity minimum after impact
  let followIdx: number | null = null;
  for (let i = impactIdx + 2; i < frames.length - 1; i++) {
    if (frames[i].velocity <= frames[i - 1].velocity &&
        frames[i].velocity <= frames[i + 1].velocity) {
      followIdx = i;
      break;
    }
  }
  // Fallback: last frame in window (e.g. golfer holds a long finish pose)
  if (followIdx === null) followIdx = frames.length - 1;

  const sampleInterval = (swingEnd - swingStart) / (DENSE_SAMPLES - 1);

  return {
    address:        frames[addressIdx],
    takeaway:       frames[takeawayIdx],
    top:            frames[resolvedTopIdx],
    impact:         frames[impactIdx],
    followThrough:  frames[followIdx],
    sampleInterval,
    allFrames:      frames,
  };
}

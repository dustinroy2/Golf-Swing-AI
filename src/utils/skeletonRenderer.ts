import { SwingFrame } from '../components/SwingStateMachine';

// MoveNet 17-keypoint skeleton connections (skip face landmarks 1-4)
export const CONNECTIONS: [number, number][] = [
  [5, 6],   // shoulder-to-shoulder
  [5, 7],   // left shoulder → left elbow
  [7, 9],   // left elbow → left wrist
  [6, 8],   // right shoulder → right elbow
  [8, 10],  // right elbow → right wrist
  [5, 11],  // left shoulder → left hip
  [6, 12],  // right shoulder → right hip
  [11, 12], // hip-to-hip
  [11, 13], // left hip → left knee
  [13, 15], // left knee → left ankle
  [12, 14], // right hip → right knee
  [14, 16], // right knee → right ankle
  [0, 5],   // nose → left shoulder
  [0, 6],   // nose → right shoulder
];

export interface SkeletonDrawOptions {
  color: string;
  opacity: number;
  jointRadius: number;
  lineWidth: number;
  glow?: boolean;
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: any[],
  options: SkeletonDrawOptions
): void {
  const { color, opacity, jointRadius, lineWidth, glow } = options;
  const MIN_SCORE = 0.3;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
  }

  // Draw connections
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  for (const [a, b] of CONNECTIONS) {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (!kpA || !kpB) continue;
    if ((kpA.score ?? 1) < MIN_SCORE || (kpB.score ?? 1) < MIN_SCORE) continue;
    ctx.beginPath();
    ctx.moveTo(kpA.x, kpA.y);
    ctx.lineTo(kpB.x, kpB.y);
    ctx.stroke();
  }

  // Draw joints
  ctx.fillStyle = color;
  for (const kp of keypoints) {
    if (!kp) continue;
    if ((kp.score ?? 1) < MIN_SCORE) continue;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, jointRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function interpolateKeypoints(frameA: SwingFrame, frameB: SwingFrame, t: number): any[] {
  const kpsA = frameA.pose?.keypoints;
  const kpsB = frameB.pose?.keypoints;
  if (!kpsA || !kpsB) return kpsA ?? kpsB ?? [];

  return kpsA.map((kpA: any, i: number) => {
    const kpB = kpsB[i];
    if (!kpB) return kpA;
    return {
      x:     kpA.x + (kpB.x - kpA.x) * t,
      y:     kpA.y + (kpB.y - kpA.y) * t,
      score: (kpA.score ?? 0) * (1 - t) + (kpB.score ?? 0) * t,
      name:  kpA.name,
    };
  });
}

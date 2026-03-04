import { SwingFrame } from '../components/SwingStateMachine';

export interface TrailPoint {
  x: number;
  y: number;
  t: number; // 0 = address, 1 = impact
}

function normalize(dx: number, dy: number): [number, number] {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.0001) return [0, 1];
  return [dx / len, dy / len];
}

// Extrapolate clubhead position from wrist + elbow direction
function getClubheadPos(
  wristX: number, wristY: number,
  elbowX: number, elbowY: number
): [number, number] {
  const forearmLen = Math.sqrt((wristX - elbowX) ** 2 + (wristY - elbowY) ** 2);
  const [nx, ny] = normalize(wristX - elbowX, wristY - elbowY);
  const extLen = forearmLen * 1.8;
  return [wristX + nx * extLen, wristY + ny * extLen];
}

// Build trail of clubhead positions from address to impact.
// Uses lead wrist (kp[9]) + lead elbow (kp[7]) for right-handed golfers.
export function buildClubTrail(
  frames: SwingFrame[],
  addressTime: number,
  impactTime: number
): TrailPoint[] {
  const range = impactTime - addressTime;
  if (range <= 0) return [];

  const trail: TrailPoint[] = [];

  for (const frame of frames) {
    if (frame.time < addressTime || frame.time > impactTime) continue;
    const kps = frame.pose?.keypoints;
    if (!kps) continue;

    const lWrist = kps[9];
    const lElbow = kps[7];
    const rWrist = kps[10];
    const rElbow = kps[8];

    // Prefer lead side (left); fallback to trail side
    let wrist = lWrist;
    let elbow = lElbow;
    if ((wrist?.score ?? 0) < 0.25 && (rWrist?.score ?? 0) >= 0.25) {
      wrist = rWrist;
      elbow = rElbow;
    }

    if (!wrist || !elbow || (wrist.score ?? 0) < 0.25) continue;

    const [cx, cy] = getClubheadPos(wrist.x, wrist.y, elbow.x, elbow.y);
    const t = (frame.time - addressTime) / range;
    trail.push({ x: cx, y: cy, t });
  }

  return trail;
}

export function drawClubTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[]
): void {
  if (trail.length < 2) return;

  ctx.save();

  // Draw connecting path with gradient
  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1];
    const curr = trail[i];
    const grad = ctx.createLinearGradient(prev.x, prev.y, curr.x, curr.y);
    // Orange → gold gradient along the trail
    grad.addColorStop(0, `hsla(${25 + prev.t * 20}, 90%, 55%, 0.75)`);
    grad.addColorStop(1, `hsla(${25 + curr.t * 20}, 90%, 55%, 0.75)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }

  // Draw dots growing from 3px at address to 6px at impact
  for (const pt of trail) {
    const r = 3 + pt.t * 3;
    const hue = 25 + pt.t * 20;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 90%, 60%, 0.9)`;
    ctx.fill();
  }

  ctx.restore();
}

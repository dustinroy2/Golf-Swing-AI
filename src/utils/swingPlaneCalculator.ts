import { SwingFrame } from '../components/SwingStateMachine';

export interface ArcPoint {
  x: number;
  y: number;
  segment: 'backswing' | 'downswing' | 'followThrough';
  t: number; // 0 = address, 1 = followThrough
}

export interface ReferencePlane {
  x1: number; y1: number; // anchor at ankle level
  x2: number; y2: number; // extended to top of frame
}

export type SwingPathVerdict = 'on-plane' | 'over-top' | 'too-flat';

export interface SwingPathResult {
  verdict: SwingPathVerdict;
  backswingDev: number;   // avg deviation % of frameH (positive = above plane)
  downswingDev: number;
  followDev: number;
  fix: string;
}

// ── Build wrist midpoint arc through full swing ────────────────────────────
export function buildSwingArc(
  frames: SwingFrame[],
  addressTime: number,
  topTime: number,
  impactTime: number,
  followThroughTime: number,
): ArcPoint[] {
  const totalRange = followThroughTime - addressTime;
  if (totalRange <= 0) return [];

  const arc: ArcPoint[] = [];

  for (const frame of frames) {
    if (frame.time < addressTime - 0.05 || frame.time > followThroughTime + 0.05) continue;
    const kps = frame.pose?.keypoints;
    if (!kps) continue;

    const lw = kps[9];  // left wrist
    const rw = kps[10]; // right wrist

    const lwOk = (lw?.score ?? 0) >= 0.25;
    const rwOk = (rw?.score ?? 0) >= 0.25;
    if (!lwOk && !rwOk) continue;

    let wx: number, wy: number;
    if (lwOk && rwOk) {
      wx = (lw.x + rw.x) / 2;
      wy = (lw.y + rw.y) / 2;
    } else if (lwOk) {
      wx = lw.x; wy = lw.y;
    } else {
      wx = rw.x; wy = rw.y;
    }

    const t = (frame.time - addressTime) / totalRange;
    let segment: ArcPoint['segment'];
    if (frame.time <= topTime) {
      segment = 'backswing';
    } else if (frame.time <= impactTime) {
      segment = 'downswing';
    } else {
      segment = 'followThrough';
    }

    arc.push({ x: wx, y: wy, segment, t });
  }

  // Sort by time
  arc.sort((a, b) => a.t - b.t);
  return arc;
}

// ── Compute reference plane line from address keypoints ────────────────────
// Line from right ankle (ball level) through wrist midpoint at address,
// extended to top of frame. Returns pixel coords.
export function computeReferencePlane(
  addressKps: any[],
  scaleX: number,
  scaleY: number,
  canvasH: number,
): ReferencePlane | null {
  const lw  = addressKps[9];
  const rw  = addressKps[10];
  const la  = addressKps[15];
  const ra  = addressKps[16];

  const lwOk = (lw?.score ?? 0) >= 0.2;
  const rwOk = (rw?.score ?? 0) >= 0.2;
  const laOk = (la?.score ?? 0) >= 0.2;
  const raOk = (ra?.score ?? 0) >= 0.2;

  if (!lwOk && !rwOk) return null;

  // Wrist midpoint in pixel space
  let wx: number, wy: number;
  if (lwOk && rwOk) {
    wx = ((lw.x + rw.x) / 2) * scaleX;
    wy = ((lw.y + rw.y) / 2) * scaleY;
  } else if (lwOk) {
    wx = lw.x * scaleX; wy = lw.y * scaleY;
  } else {
    wx = rw.x * scaleX; wy = rw.y * scaleY;
  }

  // Anchor at ankle level (ball position proxy)
  let ax: number, ay: number;
  if (laOk && raOk) {
    ax = ((la.x + ra.x) / 2) * scaleX;
    ay = ((la.y + ra.y) / 2) * scaleY;
  } else if (laOk) {
    ax = la.x * scaleX; ay = la.y * scaleY;
  } else if (raOk) {
    ax = ra.x * scaleX; ay = ra.y * scaleY;
  } else {
    ax = wx; ay = canvasH;
  }

  // Extend line through wrist upward to top of frame (y=0)
  // Line direction: from ankle (ax,ay) through wrist (wx,wy)
  const dx = wx - ax;
  const dy = wy - ay; // negative = going up

  if (Math.abs(dy) < 1) return null;

  // Extend to top of frame (y = 0) and bottom (y = canvasH)
  const tTop    = (0 - ay) / dy;
  const tBottom = (canvasH - ay) / dy;

  return {
    x1: ax + tBottom * dx,
    y1: canvasH,
    x2: ax + tTop * dx,
    y2: 0,
  };
}

// ── Classify swing path vs reference plane ─────────────────────────────────
// Positive deviation = above the reference line (over-top = steep)
// Negative deviation = below (too flat)
export function classifySwingPath(
  arc: ArcPoint[],
  plane: ReferencePlane,
  scaleX: number,
  scaleY: number,
  nativeW: number,
  nativeH: number,
  canvasH: number,
): SwingPathResult {
  // Signed perpendicular distance from a point to the plane line
  const lineDx = plane.x2 - plane.x1;
  const lineDy = plane.y2 - plane.y1;
  const lineLen = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

  function deviation(px: number, py: number): number {
    // Convert from native coords to canvas
    const cx = px * scaleX;
    const cy = py * scaleY;
    if (lineLen < 1) return 0;
    // Signed distance: positive = above the plane line (left side when line goes up-right)
    return (lineDx * (plane.y1 - cy) - lineDy * (plane.x1 - cx)) / lineLen;
  }

  const bsDev: number[] = [];
  const dsDev: number[] = [];
  const ftDev: number[] = [];

  for (const pt of arc) {
    const d = deviation(pt.x, pt.y) / canvasH; // normalize to canvas height
    if (pt.segment === 'backswing')     bsDev.push(d);
    else if (pt.segment === 'downswing') dsDev.push(d);
    else                                ftDev.push(d);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;

  const backswingDev   = avg(bsDev);
  const downswingDev   = avg(dsDev);
  const followDev      = avg(ftDev);

  // Classification based on downswing segment (most important)
  let verdict: SwingPathVerdict;
  let fix: string;

  if (downswingDev > 0.06) {
    verdict = 'over-top';
    fix = 'Start the downswing by dropping your trail elbow toward your hip before rotating. Feel like the club "falls into the slot" from the inside.';
  } else if (downswingDev < -0.06) {
    verdict = 'too-flat';
    fix = 'Your downswing is coming too far from the inside. Focus on rotating your lead hip toward the target sooner while keeping your hands higher at the start of the downswing.';
  } else {
    verdict = 'on-plane';
    fix = 'Your swing path is on plane. Focus on consistent contact and tempo.';
  }

  return { verdict, backswingDev, downswingDev, followDev, fix };
}

// ── Draw swing arc on canvas ───────────────────────────────────────────────
export function drawSwingArc(
  ctx: CanvasRenderingContext2D,
  arc: ArcPoint[],
  plane: ReferencePlane | null,
  scaleX: number,
  scaleY: number,
): void {
  if (arc.length < 2) return;

  ctx.save();

  // Draw reference plane line (dashed white)
  if (plane) {
    ctx.beginPath();
    ctx.moveTo(plane.x1, plane.y1);
    ctx.lineTo(plane.x2, plane.y2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tolerance band (±6% canvasH around the line) — subtle green zone
    // Draw as two offset parallel lines
    const angle = Math.atan2(plane.y2 - plane.y1, plane.x2 - plane.x1);
    const band = ctx.canvas.height * 0.06;
    const perpX = Math.sin(angle) * band;
    const perpY = -Math.cos(angle) * band;

    ctx.beginPath();
    ctx.moveTo(plane.x1 + perpX, plane.y1 + perpY);
    ctx.lineTo(plane.x2 + perpX, plane.y2 + perpY);
    ctx.moveTo(plane.x1 - perpX, plane.y1 - perpY);
    ctx.lineTo(plane.x2 - perpX, plane.y2 - perpY);
    ctx.strokeStyle = 'rgba(63,185,80,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw arc segments
  const segmentColor: Record<ArcPoint['segment'], string> = {
    backswing:     '#58a6ff', // blue
    downswing:     '#f85149', // red/orange
    followThrough: '#bc8cff', // purple
  };

  // Group consecutive same-segment points and draw as paths
  let i = 0;
  while (i < arc.length) {
    const seg = arc[i].segment;
    const color = segmentColor[seg];
    ctx.beginPath();
    ctx.moveTo(arc[i].x * scaleX, arc[i].y * scaleY);
    let j = i;
    while (j < arc.length && arc[j].segment === seg) {
      ctx.lineTo(arc[j].x * scaleX, arc[j].y * scaleY);
      j++;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    // Draw dots at each point
    for (let k = i; k < j; k++) {
      ctx.beginPath();
      ctx.arc(arc[k].x * scaleX, arc[k].y * scaleY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
    }

    i = j;
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

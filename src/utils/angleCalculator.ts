const MIN_SCORE = 0.3;

function score(kp: any): number { return kp?.score ?? 0; }

function drawExtendedLine(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  bx: number, by: number,
  extend: number  // fraction to extend beyond each endpoint
): void {
  const dx = bx - ax;
  const dy = by - ay;
  ctx.moveTo(ax - dx * extend, ay - dy * extend);
  ctx.lineTo(bx + dx * extend, by + dy * extend);
}

function angleDegFromHorizontal(ax: number, ay: number, bx: number, by: number): number {
  return Math.round(Math.atan2(by - ay, bx - ax) * (180 / Math.PI));
}

function angleFromVertical(ax: number, ay: number, bx: number, by: number): number {
  const rad = Math.atan2(bx - ax, by - ay); // note: x and y swapped for vertical ref
  return Math.round(Math.abs(rad) * (180 / Math.PI));
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  color: string
): void {
  ctx.save();
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  const w = ctx.measureText(text).width;
  ctx.fillRect(x - 2, y - 13, w + 4, 16);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawAngleOverlays(
  ctx: CanvasRenderingContext2D,
  keypoints: any[],
  angle: 'dtl' | 'faceOn'
): void {
  const lSho = keypoints[5];
  const rSho = keypoints[6];
  const lHip = keypoints[11];
  const rHip = keypoints[12];
  const lWri = keypoints[9];
  const rWri = keypoints[10];
  const lElb = keypoints[7];

  ctx.save();
  ctx.lineCap = 'round';

  // ── Shoulder tilt line (amber, dashed) ────────────────────────────────────
  if (score(lSho) >= MIN_SCORE && score(rSho) >= MIN_SCORE) {
    const deg = angleDegFromHorizontal(lSho.x, lSho.y, rSho.x, rSho.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    drawExtendedLine(ctx, lSho.x, lSho.y, rSho.x, rSho.y, 0.4);
    ctx.stroke();
    ctx.setLineDash([]);
    drawLabel(ctx, `${Math.abs(deg)}°`, (lSho.x + rSho.x) / 2 + 6, Math.min(lSho.y, rSho.y) - 6, '#f59e0b');
  }

  // ── Spine angle (cyan, solid) ─────────────────────────────────────────────
  if (score(lSho) >= MIN_SCORE && score(rSho) >= MIN_SCORE &&
      score(lHip) >= MIN_SCORE && score(rHip) >= MIN_SCORE) {
    const shoMidX = (lSho.x + rSho.x) / 2;
    const shoMidY = (lSho.y + rSho.y) / 2;
    const hipMidX = (lHip.x + rHip.x) / 2;
    const hipMidY = (lHip.y + rHip.y) / 2;
    const deg = angleFromVertical(hipMidX, hipMidY, shoMidX, shoMidY);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth   = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(hipMidX, hipMidY);
    ctx.lineTo(shoMidX, shoMidY);
    ctx.stroke();
    drawLabel(ctx, `${deg}°`, shoMidX + 8, shoMidY, '#06b6d4');
  }

  // ── Hip line (purple, dashed) ─────────────────────────────────────────────
  if (score(lHip) >= MIN_SCORE && score(rHip) >= MIN_SCORE) {
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    drawExtendedLine(ctx, lHip.x, lHip.y, rHip.x, rHip.y, 0.3);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Swing plane — DTL only (amber dashed, wrist → upward) ────────────────
  if (angle === 'dtl' && score(lWri) >= MIN_SCORE && score(rWri) >= MIN_SCORE &&
      score(lElb) >= MIN_SCORE) {
    const wristMidX = (lWri.x + rWri.x) / 2;
    const wristMidY = (lWri.y + rWri.y) / 2;
    // Direction: from elbow mid to wrist mid, extended upward
    const lelbX = lElb.x;
    const lelbY = lElb.y;
    const dx = wristMidX - lelbX;
    const dy = wristMidY - lelbY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const extLen = 150;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(wristMidX, wristMidY);
    ctx.lineTo(wristMidX - nx * extLen, wristMidY - ny * extLen);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

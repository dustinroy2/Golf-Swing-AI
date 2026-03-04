// Draws annotated arrows on canvas pointing at key joints.
// Red arrows = detected fault at this phase.
// Green arrows = check that passed at this phase.

interface ArrowSpec {
  joints:    number[];           // keypoint indices to point at
  label:     string;
  direction: 'up' | 'down' | 'left' | 'right';
}

// Fault name → arrow spec
const FAULT_ARROWS: Record<string, ArrowSpec> = {
  'Shoulder Tilt at Address': { joints: [5, 6], label: 'Shoulders uneven',   direction: 'up'    },
  'Head Up at Impact':        { joints: [0],    label: 'Head lifting',        direction: 'up'    },
  'Early Extension':          { joints: [11,12],label: 'Hips thrusting fwd', direction: 'right' },
  'Reverse Pivot':            { joints: [6],    label: 'No weight shift',     direction: 'left'  },
};

// Check name → arrow spec for passing checks (green)
const PASS_ARROWS: Record<string, ArrowSpec & { phases: string[] }> = {
  'Shoulder Tilt': {
    joints: [5, 6], label: 'Shoulders level', direction: 'up', phases: ['Address'],
  },
  'Head Position': {
    joints: [0], label: 'Head steady', direction: 'up', phases: ['Impact'],
  },
  'Hip Stability': {
    joints: [11, 12], label: 'Hips stable', direction: 'right', phases: ['Impact'],
  },
  'Weight Shift': {
    joints: [6], label: 'Good weight shift', direction: 'left', phases: ['Top'],
  },
};

// Fault name → which phase it belongs to (for filtering)
const FAULT_PHASES: Record<string, string> = {
  'Shoulder Tilt at Address': 'Address',
  'Head Up at Impact':        'Impact',
  'Early Extension':          'Impact',
  'Reverse Pivot':            'Top',
};

function drawArrow(
  ctx: CanvasRenderingContext2D,
  jointX: number,
  jointY: number,
  direction: ArrowSpec['direction'],
  label: string,
  color: string,
): void {
  const SHAFT = 44;
  const HEAD  = 10;
  const PAD   = 6;

  const dirVec: Record<string, [number, number]> = {
    up:    [0, -1],
    down:  [0,  1],
    left:  [-1, 0],
    right: [1,  0],
  };

  const [dx, dy] = dirVec[direction];

  // Arrow start (from joint outward)
  const startX = jointX + dx * 18;
  const startY = jointY + dy * 18;
  const endX   = startX + dx * SHAFT;
  const endY   = startY + dy * SHAFT;

  ctx.save();
  ctx.globalAlpha = 0.92;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Arrowhead
  const perpX = -dy;
  const perpY = dx;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - dx * HEAD + perpX * HEAD * 0.5, endY - dy * HEAD + perpY * HEAD * 0.5);
  ctx.lineTo(endX - dx * HEAD - perpX * HEAD * 0.5, endY - dy * HEAD - perpY * HEAD * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Label box
  ctx.font = 'bold 11px -apple-system, sans-serif';
  const textW = ctx.measureText(label).width;
  const boxW  = textW + PAD * 2;
  const boxH  = 18;

  let lx = endX + dx * 4 - boxW / 2;
  let ly = endY + dy * 4 - boxH / 2;

  // Nudge box so it doesn't go off-canvas
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  lx = Math.max(2, Math.min(lx, cw - boxW - 2));
  ly = Math.max(2, Math.min(ly, ch - boxH - 2));

  ctx.fillStyle = 'rgba(13,17,23,0.82)';
  ctx.beginPath();
  ctx.roundRect(lx, ly, boxW, boxH, 4);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillText(label, lx + PAD, ly + boxH - 5);

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawFaultArrows(
  ctx: CanvasRenderingContext2D,
  keypoints: any[],   // scaled pixel keypoints
  faults: { name: string; phase: string; severity: string }[],
  phaseName: string,
  assessedChecks: string[],  // e.g. ['Shoulder Tilt', 'Head Up']
): void {
  // --- Red arrows for faults at this phase ---
  for (const fault of faults) {
    if (FAULT_PHASES[fault.name] !== phaseName) continue;
    const spec = FAULT_ARROWS[fault.name];
    if (!spec) continue;

    // Target point = average of specified joints
    const pts = spec.joints
      .map(i => keypoints[i])
      .filter(kp => kp && (kp.score ?? 0) >= 0.2);
    if (pts.length === 0) continue;

    const tx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const ty = pts.reduce((s, p) => s + p.y, 0) / pts.length;

    drawArrow(ctx, tx, ty, spec.direction, spec.label, '#f85149');
  }

  // --- Green arrows for checks that passed at this phase ---
  for (const [checkName, spec] of Object.entries(PASS_ARROWS)) {
    if (!spec.phases.includes(phaseName)) continue;
    if (!assessedChecks.includes(checkName)) continue;

    // Only show green if this check wasn't a fault
    const isFault = faults.some(f => f.name.includes(checkName) && FAULT_PHASES[f.name] === phaseName);
    if (isFault) continue;

    const pts = spec.joints
      .map(i => keypoints[i])
      .filter(kp => kp && (kp.score ?? 0) >= 0.2);
    if (pts.length === 0) continue;

    const tx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const ty = pts.reduce((s, p) => s + p.y, 0) / pts.length;

    drawArrow(ctx, tx, ty, spec.direction, spec.label, '#3fb950');
  }
}

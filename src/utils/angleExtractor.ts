// Extracts numerical angle values from MoveNet keypoints.
// Reuses geometry from angleCalculator.ts but returns numbers instead of drawing.

function angleDegFromHorizontal(ax: number, ay: number, bx: number, by: number): number {
  return Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
}

function angleFromVertical(ax: number, ay: number, bx: number, by: number): number {
  const rad = Math.atan2(bx - ax, ay - by); // note swapped for vertical
  return Math.abs(rad * (180 / Math.PI));
}

export interface ExtractedAngles {
  shoulderTilt: number | null;   // degrees from horizontal (0 = level)
  spineAngle:   number | null;   // degrees from vertical (90 = horizontal)
  hipTilt:      number | null;   // degrees from horizontal (0 = level)
}

export interface AngleGrade {
  value: number;
  label: string;  // e.g. "Level ✓" or "12° steep ✗"
  pass: boolean;
}

export function extractAngles(keypoints: any[]): ExtractedAngles {
  const lSho = keypoints[5];
  const rSho = keypoints[6];
  const lHip = keypoints[11];
  const rHip = keypoints[12];

  const shoOk = (lSho?.score ?? 0) >= 0.3 && (rSho?.score ?? 0) >= 0.3;
  const hipOk = (lHip?.score ?? 0) >= 0.3 && (rHip?.score ?? 0) >= 0.3;

  let shoulderTilt: number | null = null;
  let spineAngle:   number | null = null;
  let hipTilt:      number | null = null;

  if (shoOk) {
    shoulderTilt = Math.abs(angleDegFromHorizontal(lSho.x, lSho.y, rSho.x, rSho.y));
  }

  if (shoOk && hipOk) {
    const shoMidX = (lSho.x + rSho.x) / 2;
    const shoMidY = (lSho.y + rSho.y) / 2;
    const hipMidX = (lHip.x + rHip.x) / 2;
    const hipMidY = (lHip.y + rHip.y) / 2;
    spineAngle = angleFromVertical(hipMidX, hipMidY, shoMidX, shoMidY);
  }

  if (hipOk) {
    hipTilt = Math.abs(angleDegFromHorizontal(lHip.x, lHip.y, rHip.x, rHip.y));
  }

  return { shoulderTilt, spineAngle, hipTilt };
}

// Grade each angle against biomechanical targets
export function gradeShoulderTilt(deg: number): AngleGrade {
  const pass = deg <= 5;
  return {
    value: deg,
    label: pass ? `${deg.toFixed(1)}° — Level ✓` : `${deg.toFixed(1)}° — Tilted ✗`,
    pass,
  };
}

export function gradeSpineAngle(deg: number): AngleGrade {
  const pass = deg >= 25 && deg <= 45;
  let label: string;
  if (deg < 25) label = `${deg.toFixed(1)}° — Too upright ✗`;
  else if (deg > 45) label = `${deg.toFixed(1)}° — Too bent ✗`;
  else label = `${deg.toFixed(1)}° — Athletic ✓`;
  return { value: deg, label, pass };
}

export function gradeHipTilt(deg: number): AngleGrade {
  const pass = deg <= 5;
  return {
    value: deg,
    label: pass ? `${deg.toFixed(1)}° — Square ✓` : `${deg.toFixed(1)}° — Tilted ✗`,
    pass,
  };
}

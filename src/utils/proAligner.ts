import { ProKeypoints, proKpsToArray } from '../data/proReference';

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

// Aligns normalized pro keypoints onto the user's skeleton in pixel space.
// 1. Finds user hip midpoint and torso length.
// 2. Scales + translates each pro keypoint to match user body position.
export function alignProToUser(
  proKps:     ProKeypoints,
  userKps:    any[],  // scaled pixel keypoints
  _videoWidth: number,
  _videoHeight: number
): Array<{ x: number; y: number; score: number }> {
  const lHip = userKps[11];
  const rHip = userKps[12];
  const lSho = userKps[5];
  const rSho = userKps[6];

  // Need hips and at least one shoulder with some confidence
  if (!lHip || !rHip || (lHip.score ?? 0) < 0.2 || (rHip.score ?? 0) < 0.2) {
    return proKpsToArray(proKps).map(() => ({ x: 0, y: 0, score: 0 }));
  }

  const hipMidX = (lHip.x + rHip.x) / 2;
  const hipMidY = (lHip.y + rHip.y) / 2;

  let torsoLen = 200; // fallback px
  if (lSho && rSho && (lSho.score ?? 0) >= 0.2 && (rSho.score ?? 0) >= 0.2) {
    const shoMidX = (lSho.x + rSho.x) / 2;
    const shoMidY = (lSho.y + rSho.y) / 2;
    torsoLen = dist(hipMidX, hipMidY, shoMidX, shoMidY);
    if (torsoLen < 20) torsoLen = 200; // degenerate case
  }

  const proArr = proKpsToArray(proKps);

  return proArr.map(kp => {
    if (kp.score === 0) return { x: 0, y: 0, score: 0 };
    return {
      x:     hipMidX + kp.x * torsoLen,
      y:     hipMidY + kp.y * torsoLen,
      score: 1.0,
    };
  });
}

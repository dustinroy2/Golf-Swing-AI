import { DetectedPhases } from '../components/SwingStateMachine';

// Normalized keypoints: hip midpoint = [0, 0], scale 1.0 = torso length
// PLACEHOLDER — replace with GolfDB / PGA Tour data
export type ProKeypoints = { [name: string]: [number, number] };

export interface ProReference {
  address:  ProKeypoints;
  top:      ProKeypoints;
  impact:   ProKeypoints;
}

// ── Right-handed DTL reference ────────────────────────────────────────────────
export const proReferenceDTL: ProReference = {
  address: {
    // PLACEHOLDER — approximate address position (DTL, right-handed)
    nose:           [0.05,  -1.60],
    left_shoulder:  [-0.30, -1.00],
    right_shoulder: [ 0.30, -1.00],
    left_elbow:     [-0.45, -0.60],
    right_elbow:    [ 0.55, -0.55],
    left_wrist:     [-0.50, -0.20],
    right_wrist:    [ 0.65, -0.15],
    left_hip:       [-0.15,  0.00],
    right_hip:      [ 0.15,  0.00],
    left_knee:      [-0.20,  0.55],
    right_knee:     [ 0.20,  0.55],
    left_ankle:     [-0.20,  1.10],
    right_ankle:    [ 0.20,  1.10],
  },
  top: {
    // PLACEHOLDER — top of backswing (DTL)
    nose:           [0.00,  -1.65],
    left_shoulder:  [-0.20, -1.05],
    right_shoulder: [ 0.30, -0.95],
    left_elbow:     [ 0.10, -1.20],
    right_elbow:    [ 0.50, -1.30],
    left_wrist:     [ 0.25, -1.50],
    right_wrist:    [ 0.55, -1.50],
    left_hip:       [-0.15,  0.00],
    right_hip:      [ 0.15,  0.00],
    left_knee:      [-0.20,  0.55],
    right_knee:     [ 0.22,  0.52],
    left_ankle:     [-0.20,  1.10],
    right_ankle:    [ 0.20,  1.10],
  },
  impact: {
    // PLACEHOLDER — impact position (DTL)
    nose:           [-0.05, -1.55],
    left_shoulder:  [-0.35, -1.00],
    right_shoulder: [ 0.25, -1.00],
    left_elbow:     [-0.55, -0.65],
    right_elbow:    [ 0.40, -0.70],
    left_wrist:     [-0.60, -0.30],
    right_wrist:    [ 0.50, -0.25],
    left_hip:       [-0.20,  0.00],
    right_hip:      [ 0.10,  0.00],
    left_knee:      [-0.22,  0.53],
    right_knee:     [ 0.22,  0.53],
    left_ankle:     [-0.20,  1.10],
    right_ankle:    [ 0.18,  1.10],
  },
};

// ── Right-handed Face-On reference ────────────────────────────────────────────
export const proReferenceFaceOn: ProReference = {
  address: {
    // PLACEHOLDER — approximate address position (Face-On, right-handed)
    nose:           [ 0.00, -1.60],
    left_shoulder:  [-0.30, -1.00],
    right_shoulder: [ 0.30, -1.00],
    left_elbow:     [-0.45, -0.60],
    right_elbow:    [ 0.45, -0.60],
    left_wrist:     [-0.20, -0.25],
    right_wrist:    [ 0.20, -0.25],
    left_hip:       [-0.15,  0.00],
    right_hip:      [ 0.15,  0.00],
    left_knee:      [-0.20,  0.55],
    right_knee:     [ 0.20,  0.55],
    left_ankle:     [-0.22,  1.10],
    right_ankle:    [ 0.22,  1.10],
  },
  top: {
    // PLACEHOLDER — top of backswing (Face-On)
    nose:           [ 0.05, -1.60],
    left_shoulder:  [-0.25, -1.05],
    right_shoulder: [ 0.32, -0.95],
    left_elbow:     [ 0.15, -1.15],
    right_elbow:    [ 0.55, -1.10],
    left_wrist:     [ 0.30, -1.40],
    right_wrist:    [ 0.55, -1.35],
    left_hip:       [-0.15,  0.00],
    right_hip:      [ 0.15,  0.00],
    left_knee:      [-0.18,  0.55],
    right_knee:     [ 0.20,  0.55],
    left_ankle:     [-0.22,  1.10],
    right_ankle:    [ 0.22,  1.10],
  },
  impact: {
    // PLACEHOLDER — impact position (Face-On)
    nose:           [-0.05, -1.55],
    left_shoulder:  [-0.35, -0.98],
    right_shoulder: [ 0.25, -1.02],
    left_elbow:     [-0.55, -0.65],
    right_elbow:    [ 0.35, -0.70],
    left_wrist:     [-0.30, -0.30],
    right_wrist:    [ 0.30, -0.30],
    left_hip:       [-0.22,  0.00],
    right_hip:      [ 0.08,  0.00],
    left_knee:      [-0.22,  0.53],
    right_knee:     [ 0.22,  0.53],
    left_ankle:     [-0.22,  1.10],
    right_ankle:    [ 0.18,  1.10],
  },
};

// Keypoint name index map (MoveNet 17-point order)
const KP_INDEX: { [name: string]: number } = {
  nose: 0,
  left_eye: 1, right_eye: 2,
  left_ear: 3, right_ear: 4,
  left_shoulder: 5, right_shoulder: 6,
  left_elbow: 7, right_elbow: 8,
  left_wrist: 9, right_wrist: 10,
  left_hip: 11, right_hip: 12,
  left_knee: 13, right_knee: 14,
  left_ankle: 15, right_ankle: 16,
};

export function proKpsToArray(kps: ProKeypoints): Array<{ x: number; y: number; score: number }> {
  const arr: Array<{ x: number; y: number; score: number }> = new Array(17).fill(null).map(() => ({
    x: 0, y: 0, score: 0,
  }));
  for (const [name, [nx, ny]] of Object.entries(kps)) {
    const idx = KP_INDEX[name];
    if (idx !== undefined) {
      arr[idx] = { x: nx, y: ny, score: 1.0 };
    }
  }
  return arr;
}

// Returns normalized pro keypoints for the phase nearest to currentTime
export function getProReferenceForPhase(
  phases: DetectedPhases,
  currentTime: number,
  angle: 'dtl' | 'faceOn'
): ProKeypoints | null {
  const ref = angle === 'dtl' ? proReferenceDTL : proReferenceFaceOn;

  const diffs = [
    { phase: 'address', time: phases.address.time, kps: ref.address },
    { phase: 'top',     time: phases.top.time,     kps: ref.top     },
    { phase: 'impact',  time: phases.impact.time,  kps: ref.impact  },
  ];

  let nearest = diffs[0];
  for (const d of diffs) {
    if (Math.abs(d.time - currentTime) < Math.abs(nearest.time - currentTime)) {
      nearest = d;
    }
  }

  return nearest.kps;
}

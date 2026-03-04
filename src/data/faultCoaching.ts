// Coaching content per fault name — used by CauseChainScreen and FixScreen.
// Keyed by Fault.name (exact string match).

export interface FaultCoaching {
  phaseKey:         'address' | 'top' | 'impact' | 'followThrough';
  phaseExplainer:   string;
  consequence:      string;
  correctPosition:  string;
  drillName:        string;
  drillSteps:       string[];
  fixQuote:         string;       // shown on Fix Screen hero
  // Keypoint indices to annotate (MoveNet 17-point model)
  annotationKps:    Array<{ idx: number; label: string; note: string; status: 'bad' | 'good' }>;
}

export const FAULT_COACHING: Record<string, FaultCoaching> = {
  'Shoulder Tilt at Address': {
    phaseKey:  'address',
    phaseExplainer:
      'Your starting position before the club moves. Everything cascades from here.',
    consequence:
      'Pre-tilted shoulders rotate on a tilted axis. The path swings outside-in and the face opens — a slice or a pull is almost guaranteed.',
    correctPosition:
      'Shoulders sit parallel to the ground and square to the target line. Spine angle is neutral — slight forward tilt, no lateral lean.',
    drillName:  'Mirror Shoulder Check',
    drillSteps: [
      'Stand in front of a full-length mirror in your address position.',
      'Place a club shaft across your shoulders and look at the angle.',
      'Adjust until the shaft is level — memorize that feeling.',
      'Hit 20 balls with that setup feeling before each shot.',
    ],
    fixQuote:
      '"Fix the setup and half your problems disappear before the club moves."',
    annotationKps: [
      { idx: 5,  label: 'L Shoulder', note: 'High — needs to be level', status: 'bad' },
      { idx: 6,  label: 'R Shoulder', note: 'Low — creating tilt',      status: 'bad' },
    ],
  },

  'Reverse Pivot': {
    phaseKey:  'top',
    phaseExplainer:
      'The highest point of your backswing, just before you start the downswing. This is where your body stores power.',
    consequence:
      'Forces a compensating lunge toward the ball at impact. The path goes steeply down-and-out, the face opens — slices, shanks, and topped shots.',
    correctPosition:
      '70–80% of pressure on trail foot at the top. Head stays behind the ball. Lead shoulder under the chin. Hips rotate 45°, shoulders 90°.',
    drillName:  'Wall Drill',
    drillSteps: [
      'Stand with your trail hip just touching a wall or a golf bag.',
      'Grip a club and take your address position — trail hip barely makes contact.',
      'Backswing: feel your trail hip press into the wall as weight loads.',
      'If your hip pulls away from the wall, you are reverse-pivoting.',
      'Hit 10 balls with the wall feedback, then step away and swing free.',
    ],
    fixQuote:
      '"Load into the wall, unload at the ball. Power comes from the ground, not a lunge."',
    annotationKps: [
      { idx: 5,  label: 'Lead Shoulder', note: 'Shifted toward target — should load back', status: 'bad' },
      { idx: 11, label: 'Lead Hip',      note: 'Weight forward at top',                    status: 'bad' },
    ],
  },

  'Head Up at Impact': {
    phaseKey:  'impact',
    phaseExplainer:
      'The split second when the club face meets the ball. Every fault upstream shows up here.',
    consequence:
      'Lifting the head early shortens the arc and opens the face at contact. The ball rockets thin, slices right, or catches the hosel.',
    correctPosition:
      'Eyes on ball position until after contact. Head stays level — or even slightly lower — through the strike zone. "See the ground long after the ball is gone."',
    drillName:  'Tee Drill',
    drillSteps: [
      'Place a tee in the ground at your ball position (no ball needed).',
      'Take your normal swing — try to keep your eyes on the tee after impact.',
      'The goal: see the tee still there when your arms are fully extended.',
      '"Watch the tee disappear" — not "look up to see where it went."',
    ],
    fixQuote:
      '"Stay down an extra half-second and the ball takes care of itself."',
    annotationKps: [
      { idx: 0, label: 'Head', note: 'Rising before contact — stay level', status: 'bad' },
    ],
  },

  'Early Extension': {
    phaseKey:  'impact',
    phaseExplainer:
      'The split second when the club face meets the ball. Every fault upstream shows up here.',
    consequence:
      'Hips thrust toward the ball push the club off-plane. The hosel arrives at the ball before the face — that is the shank. Also causes chunks and thins.',
    correctPosition:
      'Hips open 30–40° but stay back. Trail heel lifts naturally. Hands lead the face at contact with forward shaft lean. Spine angle held from address.',
    drillName:  'Glute Wall Drill',
    drillSteps: [
      'Set up with your trail glute touching a wall or bag — barely making contact.',
      'Address the ball normally — maintain that light glute contact.',
      'Swing through impact: glute must stay on the wall. Rotate, don\'t slide.',
      'If your glutes leave the wall toward the ball, you are early extending.',
      'Do this for 15 minutes. The groove will transfer to the course.',
    ],
    fixQuote:
      '"Fix the hip thrust and the shank disappears. The hosel can\'t reach the ball if the hips rotate instead of lunge."',
    annotationKps: [
      { idx: 11, label: 'Lead Hip',  note: 'Lunging toward ball — rotate, don\'t slide', status: 'bad' },
      { idx: 12, label: 'Trail Hip', note: 'Should be rotating open, not thrusting',      status: 'bad' },
    ],
  },
};

// Phase explainers for phases with no detected fault (used on phase health strip tooltips)
export const PHASE_EXPLAINERS: Record<string, string> = {
  'Setup':             'Your starting position before the club moves. Everything cascades from here.',
  'Takeaway':          'The first move away from the ball. Sets the plane for the entire swing.',
  'Top of Backswing':  'The highest point of your backswing, just before you start the downswing. This is where your body stores power.',
  'Moment of Impact':  'The split second when the club face meets the ball. Every fault upstream shows up here.',
  'Follow-Through':    'After the ball is gone. A balanced finish tells you the swing was sequenced correctly.',
};

// Which phase in DetectedPhases corresponds to each UI phase name
export const PHASE_KEY_MAP: Record<string, 'address' | 'takeaway' | 'top' | 'impact' | 'followThrough'> = {
  'Setup':            'address',
  'Takeaway':         'takeaway',
  'Top of Backswing': 'top',
  'Moment of Impact': 'impact',
  'Follow-Through':   'followThrough',
};

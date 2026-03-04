# Styling Recommendations — GolfFix → Our Dark Theme
> Concrete changes to make, prioritized by impact.
> This is the implementation queue for the styling pass.

---

## What We've Studied

14 screenshots from GolfFix AI (live app):
- 4 onboarding slides
- 1 login screen
- 5 profile setup screens
- 2 paywall screens
- 1 upgrade confirm

Plus: GOLFFIX_REFERENCE.md, DESIGN_BRIEF.md

---

## Priority 1 — Critical (do these first)

### 1.1 Onboarding Flow (currently: MISSING)
**Impact**: Retention. Users have zero context when they open the app for the first time.

**What to build**: `src/components/Onboarding.tsx`
- 4 slides, shown only on first visit (localStorage flag)
- Slide 1: hero gradient background + hook question
- Slide 2: green detection box overlay concept (SVG or CSS)
- Slide 3: our actual green skeleton wireframe (SVG illustration of pose)
- Slide 4: score card preview + CTA "Get Started"
- After slide 4: 2-question profile questionnaire (handedness + camera angle)
- See: `knowledge-base/ONBOARDING_PATTERNS.md` for full spec

### 1.2 iOS Camera Permission Modal (currently: BROKEN)
**Impact**: Live Mode and Setup Assistant are unusable on iOS without this.

**What to build**: Add to `LiveCamera.tsx` and `SetupAssistant.tsx`
```tsx
} catch (err: any) {
  if (err.name === 'NotAllowedError') {
    setCameraError('permission_denied');
  }
}

// In JSX:
{cameraError === 'permission_denied' && (
  <CameraPermissionModal onRetry={startCamera} />
)}
```

**The modal**: Full screen overlay, numbered steps for iOS Settings navigation, "Try Again" button.
See: `knowledge-base/IOS_PERMISSIONS.md` for full spec.

### 1.3 Green Skeleton Overlay (currently: BLUE)
**Impact**: Visual identity. GolfFix's skeleton is their signature look. We should match it.

**Change in `VideoAnalyzer.tsx`** `drawImpactFrame()`:
```typescript
// BEFORE:
ctx.strokeStyle = '#58a6ff'; // blue

// AFTER:
ctx.strokeStyle = '#3fb950'; // match GolfFix green
ctx.lineWidth = 2.5;
ctx.lineCap = 'round';

// Joint circles:
ctx.fillStyle = '#3fb950'; // green fills, not just dots
// Draw circles radius 6 (not 5) — more visible
```

Also add extended leg lines to ground (GolfFix style):
```typescript
// After drawing left and right ankle connections,
// draw thin vertical lines from ankle to frame bottom
ctx.strokeStyle = 'rgba(63, 185, 80, 0.4)';
ctx.lineWidth = 1.5;
// left ankle → bottom
// right ankle → bottom
```

### 1.4 Segmented Toggle Style (currently: bottom-border style)
**Impact**: Design polish. GolfFix uses full pill container with inset active state.

**Change in `App.css`**:
```css
/* REPLACE current swing-type-toggle styles with: */
.swing-type-toggle {
  display: flex;
  background: #21262d;
  border: 1.5px solid #30363d;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.swing-type-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #8b949e;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.swing-type-btn.active {
  background: #0d1117;
  color: #58a6ff;
  box-shadow: 0 0 0 1.5px #58a6ff inset;
}
```

---

## Priority 2 — High Impact

### 2.1 Paywall / Subscription Screen
**Build**: `src/components/Paywall.tsx`
- Dark navy/purple gradient background
- "Pro ⚡" gradient badge
- "Start Your 14-Day Free Trial" large headline
- Feature checklist with ✓ marks
- Teal trial banner
- Gradient CTA button "Start Free Trial"
- Price disclosure below button

### 2.2 Landing Page Hero Upgrade
**Current**: Logo + tagline + 4 cards

**Upgrade to match GolfFix's confident visual language**:
- Add a dark gradient hero banner above the cards (not just text)
- Consider adding a small score card preview image showing "Score: 78" in green — this is the product promise
- Cards should feel more "app-like" — slightly larger touch targets (min 64px height)

### 2.3 Analysis Results — Phase Scrubber
**Build in `VideoAnalyzer.tsx`**:
```tsx
const phases = ['Address', 'Takeaway', 'Top', 'Impact', 'Follow-Through'];
const [activePhase, setActivePhase] = useState(3); // default to Impact

<div className="phase-scrubber">
  {phases.map((phase, i) => (
    <button
      key={phase}
      className={`phase-btn${activePhase === i ? ' active' : ''}`}
      onClick={() => setActivePhase(i)}
    >
      {phase}
    </button>
  ))}
</div>
```

CSS:
```css
.phase-scrubber {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px 0;
}

.phase-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid #30363d;
  border-radius: 20px;
  background: #21262d;
  color: #8b949e;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}

.phase-btn.active {
  background: #3fb950;
  border-color: #3fb950;
  color: #000;
  font-weight: 600;
}
```

### 2.4 Profile Setup Questionnaire
**Build**: `src/components/ProfileSetup.tsx`
- Shows after onboarding completes (first-run only)
- Q1: Handedness — Right/Left pill toggle + golfer illustration (emoji SVG)
- Q2: Default camera angle — DTL/Face-On (pre-selects from localStorage)
- Sets localStorage: `handedness`, confirms `swingType`

---

## Priority 3 — Polish

### 3.1 Bottom Nav Visual Polish
GolfFix's tab bar has a very slight inner shadow at the top (no aggressive border):
```css
.bottom-nav {
  border-top: none;
  box-shadow: 0 -1px 0 #30363d, 0 -8px 20px rgba(0, 0, 0, 0.3);
}
```

Active icon should be slightly larger:
```css
.bottom-nav button.active .nav-icon {
  transform: scale(1.1);
  transition: transform 0.15s;
}
```

### 3.2 Header Simplification
Remove tagline from header (it's already on the landing page):
```tsx
// BEFORE:
<div>
  <h1>Golf Swing AI</h1>
  <p>Swing smarter. Never freeze. Never guess.</p>
</div>

// AFTER:
<h1>Golf Swing AI</h1>
```

And reduce header height — it's taking too much vertical space on mobile:
```css
.app-header {
  padding: 10px 20px; /* was 12px 24px */
}

.app-header h1 {
  font-size: 1.1rem; /* was 1.2rem */
}
```

### 3.3 Fault Card Severity Bars
Add a percentage influence indicator (future, but design it now):
```
Early Extension                       Impact
━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░      65% influence
```

### 3.4 Score Number Animation
When results first render, count up from 0 to the score:
```typescript
useEffect(() => {
  if (!result) return;
  let count = 0;
  const target = result.score;
  const step = Math.ceil(target / 20);
  const interval = setInterval(() => {
    count = Math.min(count + step, target);
    setDisplayScore(count);
    if (count >= target) clearInterval(interval);
  }, 30);
  return () => clearInterval(interval);
}, [result]);
```

### 3.5 Swing Plane Arc Overlay (DTL results)
After drawing the skeleton, add a V-shaped green arc showing the swing plane:
- Only visible when swingType === 'dtl'
- SVG path: wide V from club positions at top and follow-through, narrowing to ball
- Semi-transparent green fill: `rgba(63, 185, 80, 0.15)`
- Green stroke: `#3fb950`, lineWidth 2

---

## Quick CSS Wins (30 minutes)

These require no new components — just CSS changes:

1. **Skeleton color**: Change `#58a6ff` → `#3fb950` in `drawImpactFrame()`
2. **Toggle style**: Pill container approach (see 1.4 above)
3. **Bottom nav shadow**: Replace hard border with soft shadow
4. **Score count-up**: Animation on result render
5. **Card hover**: More pronounced on mobile touch (active state, not just hover)
6. **Add `touch-action: manipulation`** to all buttons — eliminates 300ms iOS tap delay

---

## What NOT to Change

- Dark theme — don't go light. Our dark theme is a differentiator.
- Color tokens — they're already well-defined and consistent
- Font family — system fonts work well
- Overall layout — the bottom nav + header + main content pattern is solid
- The confidence gating system — this is our differentiator, don't simplify it

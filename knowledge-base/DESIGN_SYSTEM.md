# Golf Swing AI — Design System & Component Patterns
> Single source of truth for all UI decisions.
> Dark theme only. Mobile-first. GolfFix-inspired patterns.

---

## Color Tokens

```css
/* Backgrounds */
--bg-base:         #0d1117;   /* App background */
--bg-surface:      #161b22;   /* Cards, panels */
--bg-surface-2:    #21262d;   /* Nested cards, inputs */
--bg-paywall:      linear-gradient(160deg, #0a0a2e 0%, #1a0050 60%, #0d1117 100%);

/* Borders */
--border-subtle:   #30363d;   /* Default card borders */
--border-active:   #58a6ff;   /* Active/focused borders */

/* Text */
--text-primary:    #e6edf3;   /* Main text */
--text-secondary:  #8b949e;   /* Helper text, labels */
--text-muted:      #484f58;   /* Placeholder, disabled */

/* Semantic */
--green:           #3fb950;   /* Good, in range, skeleton overlay, success */
--amber:           #d29922;   /* Warning, borderline, medium confidence */
--red:             #f85149;   /* Fault, out of range, bad */
--blue:            #58a6ff;   /* CTA, links, active states */
--purple:          #bc8cff;   /* Gradient partner, premium badge */

/* Premium / Paywall */
--premium-gradient: linear-gradient(135deg, #7c3aed, #2563eb);
--premium-teal:     #0d9488;   /* Trial badge, premium highlights */
--premium-bg:       #0a0a2e;   /* Paywall background base */

/* Skeleton Overlay (match GolfFix exactly) */
--skeleton-joint:  #3fb950;   /* Joint circles */
--skeleton-bone:   #3fb950;   /* Bone connection lines */
--skeleton-low-conf: #8b949e; /* Gray "?" nodes */
```

---

## Typography Scale

```css
/* Headings */
--text-hero:   2rem / 700     /* Landing page title, paywall headline */
--text-xl:     1.4rem / 700   /* Section headers, card titles */
--text-lg:     1.2rem / 600   /* Sub-headers */
--text-md:     1rem / 400     /* Body, card content */
--text-sm:     0.85rem / 400  /* Helper text, descriptions */
--text-xs:     0.72rem / 500  /* Labels, badges, metadata */
--text-micro:  0.65rem / 700  /* Tab labels, tiny badges */

/* Special */
--text-score:  4rem / 700     /* The big swing score number */
--text-mono:   monospace      /* FPS, coverage, technical values */
```

---

## Component Patterns

### Segmented Toggle (GolfFix-style pill)
```
┌─────────────────────────────────────────┐
│ ┌─────────────┐  ┌─────────────────┐   │
│ │ DTL — Down  │  │    Face-On      │   │
│ │  the Line   │  │                 │   │
│ └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```
- Full-width pill container with border
- Active tab: white/light fill with blue bottom or full fill
- Inactive: transparent, muted text
- **NOT bottom-border style** — full pill border on the container
- Height: ~48px, font-size: 0.9rem, font-weight: 600
- Transition: 0.2s

```css
.swing-type-toggle {
  display: flex;
  border: 1.5px solid #30363d;
  border-radius: 12px;
  background: #21262d;
  padding: 4px;
  gap: 4px;
}
.swing-type-btn.active {
  background: #0d1117;
  border-radius: 8px;
  color: #58a6ff;
  box-shadow: 0 0 0 1.5px #58a6ff;
}
```

### Workflow Cards (Landing Page)
- Number badge: gradient circle top-left
- Icon: 1.8rem emoji
- Title: 1rem / 600
- Description: 0.82rem / #8b949e
- Arrow: circular button → on hover turns blue

### Bottom Navigation
- Fixed, full-width, 60-65px height
- 5 equal tabs, flex row
- Icon + label stacked (icon 1.3rem, label 0.65rem)
- Active: #58a6ff, inactive: #8b949e
- No heavy background — just dark surface with top border

### Fault Cards
- Left border 3px: red (#f85149) or amber (#d29922)
- Header: dot + name + phase badge (right-aligned)
- Drill box: #21262d background, slightly indented

### Score Card
- Centered, 4rem bold number
- Color: green ≥80, amber 60-79, red <60
- Coverage line below in monospace

---

## Skeleton Overlay Spec (match GolfFix slide 3)

```javascript
// Joint rendering
if (confidence > 0.7) {
  ctx.fillStyle = '#3fb950';  // bright green filled circle
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
} else if (confidence > 0.5) {
  ctx.fillStyle = '#8b949e';  // gray with "?" label
}

// Bone connections
ctx.strokeStyle = '#3fb950';
ctx.lineWidth = 2.5;
ctx.lineCap = 'round';

// Extended leg lines to ground (GolfFix style)
// Draw thin vertical lines from ankles down to frame bottom
ctx.strokeStyle = '#3fb950';
ctx.lineWidth = 1.5;
ctx.setLineDash([]);
// line from left ankle down
// line from right ankle down
```

Connections to draw (MoveNet 17 keypoints):
```
5-6   (left-right shoulder)
5-7   (left shoulder-elbow)
7-9   (left elbow-wrist)
6-8   (right shoulder-elbow)
8-10  (right elbow-wrist)
5-11  (left shoulder-hip)
6-12  (right shoulder-hip)
11-12 (left-right hip)
11-13 (left hip-knee)
13-15 (left knee-ankle)
12-14 (right hip-knee)
14-16 (right knee-ankle)
0-5   (nose-left shoulder) -- spine approximation
0-6   (nose-right shoulder)
```

---

## Onboarding Screen Spec (GolfFix-adapted, dark theme)

### Layout structure (dark theme version):
```
┌─────────────────────────────────────────┐
│                                         │
│         [Golf photo or dark             │
│          gradient image ~60%]           │
│         [Overlay drawn on top]          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   Large bold text, centered             │
│   (max 3 lines, ~28px)                  │
│                                         │
│                                         │
│                                         │
│  [────────── Next / Start ──────────]   │
└─────────────────────────────────────────┘
```

- Image takes `60vh` minimum
- Text area: padding 32px horizontal, centered
- Next button: `background: #21262d`, full-width, 56px height, 12px radius, white text
- Final slide Start button: `background: linear-gradient(135deg, #58a6ff, #bc8cff)`
- Progress dots: 4 small circles below image (or at very bottom)
- Stored in localStorage as `onboardingComplete: true`

---

## Paywall Screen Spec

```
┌─────────────────────────────────────────┐
│ [× close]                               │
│                                         │
│ [Advanced⚡] ←── gradient badge          │
│                                         │
│  Start Your 14-Day                      │
│  Free Trial                ○ ←── orb   │
│                                         │
│  Practice every day, every game         │
│  becomes your new best score            │
│                                         │
│  ✓  No network Ads                      │
│  ✓  Fault Analysis (unlimited)          │
│  ✓  Tempo & Rhythm Analysis             │
│  ✓  Full History Log                    │
│  ✓  Export annotated video              │
│  ✓  DTL + Face-On angle gating          │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  14-day free trial included      │   │  ← teal banner
│  └──────────────────────────────────┘   │
│                                         │
│  [────────── Subscribe ────────────]    │  ← gradient button
└─────────────────────────────────────────┘
```

Background: `linear-gradient(160deg, #0a0a2e 0%, #1a0050 60%, #0d1117 100%)`
Badge: `linear-gradient(135deg, #7c3aed, #2563eb)` with white italic bold text
Trial banner: `background: #0d9488`, teal, rounded pill
Subscribe button: `linear-gradient(135deg, #7c3aed, #2563eb)`, full-width, 56px

---

## iOS Camera Permission Modal

When `getUserMedia` throws `NotAllowedError` on iOS:

```
┌─────────────────────────────────────────┐
│                                         │
│            📷                           │
│   Camera Access Required                │
│                                         │
│   Golf Swing AI needs camera access     │
│   to use Live Mode and Setup Assistant. │
│                                         │
│   To enable:                            │
│   1. Open  Settings                     │
│   2. Tap Safari (or your browser)       │
│   3. Tap Camera                         │
│   4. Select "Allow"                     │
│   5. Return here and try again          │
│                                         │
│  [──────────── Try Again ────────────]  │
│                                         │
└─────────────────────────────────────────┘
```

- Show as full overlay (not small toast)
- "Try Again" button re-calls getUserMedia — lets user retry after fixing settings
- For native iOS app: include deep-link button to Settings

---

## Mobile-First Breakpoints

```css
/* Default: phone (≤ 430px width) */
/* Already the primary target */

/* Tablet+ fallback */
@media (min-width: 600px) {
  .app-main { max-width: 500px; margin: 0 auto; }
  .bottom-nav { max-width: 500px; left: 50%; transform: translateX(-50%); }
}
```

---

## Animation Guidelines

- Navigation transitions: none (instant tab switch on mobile)
- Toggle transitions: 0.15s ease
- Card hover: 0.2s border-color
- Score number: count-up animation optional (0.6s)
- Skeleton overlay: draw bones in order, 50ms stagger per bone (adds polish)
- Onboarding slide transition: slide left 0.3s ease

---

## Icon Usage

| Context | Icon | Notes |
|---------|------|-------|
| Home tab | 🏠 | |
| Setup tab | 📐 | |
| Analyze tab | 📹 | |
| Live tab | 🎥 | |
| History tab | 📊 | |
| Green/good | ✅ or • (#3fb950) | |
| Red/fault | • (#f85149) | |
| Amber/warn | • (#d29922) | |
| Low confidence | ? gray dot | |
| Premium badge | ⚡ | Next to "Advanced" label |
| Audio | 🔊 | Read results aloud |
| App logo | ⛳ | Placeholder until custom logo |

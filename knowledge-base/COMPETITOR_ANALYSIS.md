# Competitor Analysis — GolfFix AI
> Deep-dive reference built from live screenshots and product guides.
> Last updated: March 2026

---

## Overview

**GolfFix AI** is our closest direct competitor in the AI golf swing analysis space.
- **App Store**: https://apps.apple.com/us/app/golffix-ai-coach-golf-lesson/id1586120680
- **Pricing**: Free tier + 14-day free trial → **~$126 CAD/year** (Advanced plan)
- **Platform**: iOS + Android
- **Core differentiator**: Onboarding experience is polished, analysis is visual-first

---

## Onboarding Flow — Screen by Screen

### Slide 1: "When your swing isn't going the way you want — where does the problem lie?"
- **Layout**: Full-bleed golf action photo (~60% of screen height)
- **Photo**: Golfer mid-swing through sand trap, dramatic composition
- **Text area**: White background, large bold centered text (~28px, two lines)
- **CTA**: Full-width dark charcoal pill button "Next" pinned to bottom
- **Key pattern**: No logo, no branding — just a hook question. Respect the user's time.

### Slide 2: "AI analyzes my swing and clearly tells me what the issues are"
- **Layout**: Same 60/40 split
- **Photo**: Female golfer at address (Face-On view), green fairway background
- **Overlay**: Bright green corner brackets (like a camera viewfinder) around head + torso. Green horizontal line at shoulder level.
- **Key pattern**: Shows the detection UI BEFORE the user has even signed up. Builds trust visually.

### Slide 3: "Improve your skills with precise motion recognition technology and core swing principles"
- **Layout**: Same 60/40 split
- **Photo**: Male golfer at top of backswing (DTL-ish view), green polo
- **Overlay**: Full green skeleton — large green circles at every joint, thick green lines for bones (shoulders, arms, spine, legs), green vertical lines extending from feet down to ground
- **Key pattern**: The skeleton is the hero product demonstration. Show it on slide 3, not buried in results.

### Slide 4: "With GolfFix, golf gets easier and easier!"
- **Layout**: Same 60/40 split
- **Photo**: Female golfer at follow-through (DTL view)
- **Overlay**: Semi-transparent bright green V-shaped swing plane arc — wide at top, narrow at ball, dramatic visual fill
- **CTA**: Full-width BLUE button "Start with GolfFix" (blue, not charcoal — signals primary commitment)
- **Key pattern**: Final slide uses accent color button to signal "this is the big action."

### Login Screen: "PERFECT SWING, PERFECT SCORE!"
- **Layout**: Full-bleed background photo (golfer hitting, dark/moody sky)
- **Logo**: Top-left — G icon circle + "GolfFix" wordmark
- **Tagline**: Large white bold headline "PERFECT SWING, PERFECT SCORE!" + blue "GolfFix" text
- **Auth buttons**: Three full-width white pill buttons — Apple, Google, Email
- **Guest option**: "Try as Guest" gray text link below all buttons
- **Language selector**: Top-right pill "🌐 English"

---

## Profile Setup Questionnaire

### Screen 1: Intro
- Clean white background, centered bold text: "Answer a few questions to receive an accurate Analysis."
- Very minimal — just text + Next button.

### Screen 2: Average Score
- **Illustration**: Golf flag on green, centered
- **Control**: Blue fill slider, displays selected range as large text "70 ~ 80"
- **Buttons**: Skip (outlined) + Next (dark filled) — side by side at bottom

### Screen 3: Experience
- Same slider pattern, displays years

### Screen 4: Handedness (KEY SCREEN — study carefully)
- **Header**: Bold left-aligned question "Right-handed or Left-handed?"
- **Subtext**: Two lines of gray helper text (why we ask + where to change it)
- **Illustration**: Simple flat golfer illustration, centered
- **Toggle**: Full-width pill segmented control — "Right-handed | Left-handed"
  - Selected side: WHITE fill with visible outline border on entire pill
  - Unselected side: Gray text, no fill, same pill border
  - Border: ~1.5px, medium gray, full pill radius
- **CTA**: Full-width blue "Complete" button pinned to bottom

### Screen 5: Notifications
- Bell illustration + notification preview mock
- "Later" + "OK!" buttons

---

## Subscription / Paywall Screen

### Design breakdown:
- **Background**: Deep navy/purple gradient — nearly black at top, rich dark blue/purple
- **Badge**: "Advanced⚡" — white italic text with lightning bolt, gradient purple/blue fill
- **Headline**: "Start Your 14-Day Free Trial" — very large, bold white, left-aligned
- **Subheadline**: Gray/white text on dark background
- **Feature list** (with ✓ marks):
  - No network Ads
  - Shot Fix Lesson
  - Club•Wrist Trajectory
  - Swing Comparison
  - 60FPS video supported (may vary by device)
  - Rhythm•Tempo Analysis & Drill
  - Unlimited swing log view
  - Monthly Report
  - 7 Pro swing videos
  - (more below fold)
- **Trial banner**: Teal/cyan pill "14-day free trial for first Subscription"
- **CTA button**: Full-width purple-to-blue gradient "Subscribe"
- **Pricing**: ~126 CAD/year (~$9-10/month equivalent)

### Upgrade Confirm Modal:
- White modal sheet overlaid on dark paywall
- "Advanced⚡" badge with gradient at top
- Text: "Advanced Plan upgrade complete! Experience personalized lessons anytime, anywhere."
- Single "Confirm" outlined button

---

## GolfFix Color System (for our dark theme adaptation)

| GolfFix | Usage | Our Dark Equivalent |
|---------|-------|---------------------|
| White #FFFFFF | Onboarding text areas | #e6edf3 (text primary) |
| Dark charcoal #1C1C1E | "Next" buttons | #21262d (surface 2) |
| Blue #4285F4 | Primary CTAs, "Complete", progress | #58a6ff (our accent) |
| Green #00C853 | Skeleton, overlays, detection boxes | #3fb950 (our green) |
| Navy/purple gradient | Paywall | #0a0a2e → #1a0050 (new) |
| Teal #0891B2 | Trial badge, highlights | new accent for premium |
| Gray #9E9E9E | Helper text, unselected states | #8b949e (our secondary) |

---

## UX Patterns to Steal (Prioritized)

### Must Implement:
1. **Onboarding slides** (first-run only) — 4 slides, 60/40 image/text split, dark theme adaptation
2. **Green skeleton overlay** — large green circles on joints, green bone lines (we're currently using blue)
3. **Pill segmented toggle** — full pill border, white fill on active, gray on inactive (not bottom-border style)
4. **Handedness questionnaire** — Right/Left toggle, affects how we describe faults in iOS version
5. **Paywall screen** — dark gradient, feature checklist, teal trial badge

### Should Implement:
6. **Profile setup questionnaire** — lightweight, 3 questions max, illustrations
7. **Swing plane arc overlay** — V-shaped translucent green arc on DTL analysis results
8. **Club type selection** — before analysis (Driver vs Iron gates different fault expectations)
9. **Shot trouble selection** — "I'm working on my slice" focuses feedback

### Nice to Have:
10. **Side-by-side pro swing comparison**
11. **Monthly report with club filtering**
12. **Interactive frame scrubber** by phase

---

## What We Do Better Than GolfFix

| Feature | Us | GolfFix |
|---------|----|---------|
| Confidence gating transparency | ✅ Three-tier messages | ❌ Silent failures |
| Assessment coverage score | ✅ assessedCount/totalChecks | ❌ Not shown |
| Tempo precision gating | ✅ FPS-aware ±range | ✅ Basic tempo |
| Fault-to-angle gating | ✅ DTL vs Face-On | Unknown |
| Partial session badges | ✅ History shows coverage | ❌ Not visible |

---

## What GolfFix Does Better Than Us (Right Now)

1. Onboarding — we throw users into the app with zero orientation
2. Green skeleton overlay — they show the product doing its thing before login
3. Visual overlays (swing plane arc, alignment boxes)
4. Interactive phase scrubber on results
5. Shot Fix Lesson (targeted fault mode)
6. Monthly reports + club filtering

---

## iOS Camera Permission Handling

**GolfFix properly handles iOS camera permission** — when denied it shows instructions.

For our web prototype on iOS Safari:
- `navigator.mediaDevices.getUserMedia({ video: true })` triggers iOS permission dialog
- If denied: `DOMException: NotAllowedError`
- **Cannot auto-open Settings from browser** — must show instructions instead
- User must manually go: **Settings → Safari → Camera → [your site] → Allow**
- Show a full-screen modal with these exact steps + a "Try Again" button that re-requests permission
- For PWA/native: `UIApplication.shared.open(URL(string: UIApplication.openSettingsURLString)!)` works

---

## Pricing Intelligence

| App | Free Tier | Paid | Notes |
|-----|-----------|------|-------|
| GolfFix | Yes (limited) | ~$126 CAD/year | 14-day free trial |
| Sportsbox 3D | No | ~$19.99/month | Pro-focused |
| V1 Golf | Yes (5 swings) | ~$9.99/month | Most popular |
| **Our target** | 5 swings/month | $59-79 CAD/year | Undercut GolfFix by 35-40% |

**Key insight from GolfFix paywall screen**: They lead with "14-Day Free Trial" as the headline — not the price. This dramatically reduces friction. Copy this pattern.

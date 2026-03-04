# Onboarding Design Patterns
> How to orient new users. Based on GolfFix screenshots + mobile app best practices.

---

## Why Onboarding Matters

First impressions set retention. Apps with a proper onboarding flow retain **2-3× more users** at day 7 than apps that throw users straight into the product. GolfFix's 4-slide onboarding:
1. Establishes the pain point (slide 1 — "where does the problem lie?")
2. Shows the product working (slides 2-3 — detection boxes, skeleton)
3. Shows the outcome (slide 4 — swing plane, you'll improve)
4. Converts to account (login screen)

Our app currently skips all of this and opens to a Home tab. Users have no context.

---

## GolfFix Onboarding — What Works

### The 60/40 image/text formula
- **~60% of screen**: Golf photo or illustration with an overlay showing the product
- **~40% of screen**: White/dark area with large centered text + button
- No walls of text. One idea per slide. One action per slide.

### Progressive value reveal
- Slide 1: Problem (no product shown — just emotional hook)
- Slide 2: Solution shown (detection overlay — AI can see you)
- Slide 3: Technology shown (skeleton — precise tracking)
- Slide 4: Outcome shown (swing plane — you'll improve) + primary CTA

### Button styling signals commitment level
- Slides 1-3: Dark/neutral "Next" button (low commitment — just keep going)
- Slide 4: Blue/accent CTA (this is the moment of commitment — Start)

---

## Our Onboarding Plan (4 slides, dark theme)

### Slide 1 — The Hook
- **Visual**: Dark gradient background with a photo overlay — golfer in rough, frustrated stance (or impact position). Subtle dark vignette.
- **Text**: "When your swing breaks down — do you know why?"
- **Button**: Dark "Next →" (full-width, charcoal/dark surface)

### Slide 2 — The Detection
- **Visual**: Dark background with a golf photo + our green bounding box corners drawn over a golfer silhouette. Green shoulder line overlay.
- **Text**: "AI reads every joint in your body — from address to finish"
- **Button**: Dark "Next →"

### Slide 3 — The Skeleton
- **Visual**: Our actual green skeleton overlay drawn on a dark background or photo. Show the MoveNet dots and lines prominently. This is our product demo.
- **Text**: "Pinpoint faults at every phase of your swing — with real confidence scoring"
- **Sub-text**: "We tell you when we're not sure — not just when it looks bad" (our differentiator)
- **Button**: Dark "Next →"

### Slide 4 — The Promise
- **Visual**: A score card visual with a big "78" in green + a fault card below it. Shows what results look like.
- **Text**: "Get your swing score and top fault in under 60 seconds"
- **Sub-text**: "No internet required. No subscriptions to start. Just swing."
- **Button**: Blue/accent "Get Started" → enters app

---

## First-Run Profile Questionnaire (after slide 4)

Ask 2 questions only. Keep it under 60 seconds.

### Q1: Handedness
- Bold question: "Right-handed or Left-handed?"
- Helper: "We'll adjust how we describe your swing"
- Toggle: [Right-handed | Left-handed] — pill style, white fill on active
- Action: Next →

### Q2: Preferred Camera Angle
- Bold question: "How do you usually film your swing?"
- Helper: "You can change this anytime in Setup"
- Toggle: [Down the Line | Face-On] — same pill style
- Action: Get Started →

Both values saved to localStorage:
```
localStorage.setItem('handedness', 'right')    // 'right' | 'left'
localStorage.setItem('swingType', 'dtl')       // 'dtl' | 'faceOn'
```

---

## Onboarding State (localStorage)

```typescript
// Check on app load
const hasOnboarded = localStorage.getItem('onboardingComplete') === 'true';

// After completing slide 4 + questionnaire
localStorage.setItem('onboardingComplete', 'true');
localStorage.setItem('handedness', selectedHandedness);
localStorage.setItem('swingType', selectedAngle);
```

**Flow:**
```
App loads
  └── onboardingComplete === 'true' ?
        YES → show Home tab (normal app)
        NO  → show Onboarding slides
               └── complete → set onboardingComplete
                   └── show profile questionnaire
                       └── complete → show Home tab
```

---

## Onboarding CSS (dark theme version)

```css
.onboarding-screen {
  position: fixed;
  inset: 0;
  background: #0d1117;
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.onboarding-image {
  flex: 0 0 60vh;
  position: relative;
  overflow: hidden;
  background: #161b22;
}

.onboarding-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85; /* slight dark for text readability */
}

.onboarding-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 32px 28px 40px;
  text-align: center;
}

.onboarding-headline {
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1.3;
  color: #e6edf3;
}

.onboarding-subtext {
  font-size: 0.88rem;
  color: #8b949e;
  margin-top: 8px;
}

.onboarding-dots {
  display: flex;
  gap: 8px;
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #30363d;
}

.onboarding-dot.active {
  background: #58a6ff;
  width: 24px;
  border-radius: 4px;
}

.onboarding-next-btn {
  width: 100%;
  background: #21262d;
  border: none;
  border-radius: 12px;
  color: #e6edf3;
  font-size: 1rem;
  font-weight: 600;
  padding: 16px;
  cursor: pointer;
}

.onboarding-start-btn {
  width: 100%;
  background: linear-gradient(135deg, #58a6ff, #bc8cff);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  padding: 16px;
  cursor: pointer;
}
```

---

## Profile Questionnaire CSS

```css
.profile-question {
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.profile-question h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #e6edf3;
  line-height: 1.2;
  margin-bottom: 8px;
}

.profile-question .helper {
  font-size: 0.88rem;
  color: #8b949e;
  margin-bottom: 4px;
}

.profile-illustration {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem; /* big emoji placeholder */
}

.profile-toggle {
  /* Same as swing-type-toggle in Design System */
}

.profile-complete-btn {
  width: 100%;
  background: linear-gradient(135deg, #58a6ff, #bc8cff);
  border: none;
  border-radius: 12px;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  padding: 16px;
  cursor: pointer;
  margin-top: 24px;
}
```

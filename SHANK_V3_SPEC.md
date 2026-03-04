# Shank — Analyze Page Redesign v3 Spec

**Hand this file to Claude Code.** Supersedes v2.

---

## What Changed from v2

1. **Swing Replay plays FIRST** — before any diagnostics, the user watches their swing path being traced on the video with the ball flight animated. This grounds them in what happened before we explain why.
2. **Simplified colors** — only TWO result colors: red (problem) and green (good). No amber/orange. Removes confusion about "what does orange mean?"
3. **Bigger, more readable text throughout** — minimum 11px for body, 13px for descriptions, 15px+ for headers. Use Space Grotesk as the primary font.
4. **No P-numbers in UI** — removed "P4", "P7" etc. Nobody knows what these mean. Phase names only ("Top of Backswing", "Moment of Impact"). Keep P-numbers in knowledge base for internal reference.
5. **Phase explainers inline** — each fault card includes a one-line italic explanation of what that phase of the swing IS, so beginners understand.
6. **Fix screen redesigned** — not "Your One Fix" (gimmicky). Instead: inspirational quote hero at top, full scorecard of all checks (good and bad), then the priority drill. More professional, less infomercial.
7. **Shank Academy** instead of YouTube links — references to "Shank Academy" (our own content platform) for drill videos and deep-dive lessons.
8. **"Fixing: X → Y" removed** — replaced with the scorecard showing all checks with their status, which naturally sets up what needs fixing.

---

## Screen Flow (4 screens)

```
┌──────────────────────┐
│  1. SWING REPLAY     │  ← FIRST screen after analysis
│                      │
│  Animated trace of   │
│  the swing path on   │
│  the actual video    │
│  + ball flight after │
│  impact              │
│                      │
│  Phase timeline bar  │
│  shows where faults  │
│  occurred (red)      │
│                      │
│  Result badge fades  │
│  in: "⚡ Shank"     │
│                      │
│  [See What Happened] │
│  [Replay ↻]          │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  2. DIAGNOSIS        │
│                      │
│  "What does Shank    │
│   think of your      │
│   swing?"            │
│  (Shank colored by   │
│   score)             │
│                      │
│  Score ring + Tempo  │
│  What Went Wrong     │
│  (fault list)        │
│  Phase health strip  │
│                      │
│  [Break It Down →]   │
│  [Skip to What to Fix] │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  3. CAUSE CHAIN      │  ← Swipeable
│                      │
│  Annotated video     │
│  frame with dots on  │
│  body parts          │
│                      │
│  Fault detail:       │
│  - Name + phase      │
│  - Phase explainer   │
│  - Shot badges       │
│  - Description       │
│  - Consequence       │
│  - Correct position  │
│  - Range fix + drill │
│  - Shank Academy link│
│                      │
│  [How to Fix This →] │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  4. FIX SCREEN       │
│                      │
│  ┌─ Gold quote hero ─┐
│  │ "Fix the weight   │
│  │ shift at the top  │
│  │ and the early     │
│  │ extension         │
│  │ disappears..."    │
│  └───────────────────┘│
│                      │
│  Full scorecard:     │
│  ✓ Shoulder Alignment│
│  ✓ One-Piece Takeaway│
│  ✗ Weight Transfer   │
│  ✗ Hip Position      │
│  ✗ Head Position     │
│  ✓ Balance at Finish │
│                      │
│  Priority Drill:     │
│  Wall Drill (4 steps)│
│  🎓 Shank Academy → │
│                      │
│  [Film Another Swing]│
└──────────────────────┘
```

---

## Screen 1: Swing Replay (NEW)

This screen plays automatically when analysis completes. The user sees their swing before any numbers or diagnostics.

### What it shows:
1. **Video frame** with their actual swing playing
2. **Swing path trace** overlaid — an animated line following the club head/wrist path through the swing:
   - Blue line traces the arc as the swing progresses
   - Club head dot (bright, with glow) travels along the path
   - After impact, **ball flight** animates from the impact point in the direction the ball went
   - For a shank: ball flies hard right with a "⚡ Ball flight: right" badge
3. **Phase timeline** below the video — 6 thin colored bars (Setup → Takeaway → Top → Down → Impact → Finish):
   - Green (dim) for clean phases
   - Red (bright) for phases with faults
   - Bars light up progressively as the replay plays
4. **Result badge** fades in after replay completes:
   - "⚡ Shank — Ball went right off the hosel. Two faults detected in your swing caused this."
   - Styled in badDim background with badBorder

### Implementation:
```typescript
// Use the existing wrist trajectory data from SwingStateMachine
// to draw the swing arc. Map wrist positions to % of video frame.

// Ball flight direction from shot shape diagnosis:
// shank → hard right
// slice → curves right  
// hook → curves left
// chunk → short, drops fast
// clean → straight line

// Animation: requestAnimationFrame loop or setInterval at 30ms
// Progress 0→1 over ~3 seconds
// Phase labels update as progress crosses thresholds
```

### CTAs (appear after replay completes):
- Primary (red): "See What Happened →" → diagnosis screen
- Secondary (outlined): "Replay ↻" → restarts animation

---

## Screen 2: Diagnosis

### Header
```
WHAT DOES
[Shank] think of your swing?
```
- "Shank" is colored by score: score ≤ 70 → red (#e84040), score > 70 → green (#2fbd56)
- Rest of text is white
- Font: Space Grotesk, 24px, weight 700

### Score + Tempo (side by side cards)
- Left card: ScoreRing (52px) + "Swing Score" + "X of 5 checks assessed"
- Right card: Tempo ratio in large text (20px) + "Tempo · Tour avg" 
- **Score when 0 assessed**: Show "?" in red, not a number
- Tempo color: green if ratio 2.5–3.5:1, red otherwise

### What Went Wrong
- Card with fault list, each showing: icon circle + fault name (14px, bold) + phase name (12px, secondary)
- Vertical connector lines between faults (2px bar)
- Chevron (›) on right indicating tappable

### Phase health strip
- 5 thin bars with phase labels below (9px)
- Red = fault, green (dimmed) = clean
- Labels colored: red text for fault phases, muted for clean

### CTAs
- Primary (red): "Break It Down →"
- Secondary (outlined): "Skip to What to Fix"

---

## Screen 3: Cause Chain (Swipeable)

### Swipe mechanics (same as v2)
- `scroll-snap-type: x mandatory`
- Use **IntersectionObserver** (NOT raw onScroll) to detect active card
- Progress dots at top with connector lines

### Each card contains:

#### A) Annotated Video Frame (top)
Same as v2 but with improvements:
- **Larger annotation labels**: 10px font minimum, 5px 9px padding
- **Only TWO colors for dots**: red (#e84040) for fault, green (#2fbd56) for good
- **No amber/orange anywhere**
- Dots are 10px with glow shadow

#### B) Fault Detail Card (below)

Layout (all text in Space Grotesk):

1. **Icon + Fault name** (17px, bold) + Phase name (12px, secondary)
2. **Phase explainer** — italic, 11px, muted color. Example: "The highest point of your backswing, just before you start the downswing. This is where your body stores power."
3. **Shot shape badges** — red pills only (no orange/amber variants)
4. **Description** — 13px, white, 1.7 line height
5. **Consequence** — red background strip with "→" prefix
6. **Correct Position** — green dot + "Correct Position" label (12px, green, bold) + description (13px, secondary)
7. **Range Fix** — blue dot + "Range Fix — {Drill Name}" label (12px, blue, bold) + steps (13px, secondary)
8. **Shank Academy link** — button-style: "🎓 Learn more in Shank Academy →" with blue dim background

### Bottom CTA (sticky)
- Green button: "How to Fix This →"

---

## Screen 4: Fix Screen (redesigned)

### A) Inspirational Quote Hero (top)

Gold-tinted gradient card, centered text:
```
THE FIX

"Fix the weight shift at the top and the early extension 
disappears on its own. One root cause. One fix."
```
- "THE FIX" label: gold (#d4a853), uppercase, 13px, letterspaced
- Quote: 17px, bold, white, with "One root cause. One fix." in gold
- Background: linear-gradient of gold-dim to card color
- This should feel like a coach speaking directly to you

### B) Swing Scorecard

Full list of ALL checks evaluated (not just faults), showing the complete picture:

| Status | Check | Phase | Note |
|--------|-------|-------|------|
| ✓ | Shoulder Alignment | Setup | Parallel to target line |
| ✓ | One-Piece Takeaway | Takeaway | Shoulders rotated as one unit |
| ✗ | Weight Transfer | Top of Backswing | Reverse pivot detected |
| ✗ | Hip Position | Impact | Early extension — hips lunging forward |
| ✗ | Head Position | Impact | Rose before contact |
| ✓ | Balance at Finish | Follow-Through | Full rotation, balanced |

Each row:
- Status circle (24px): green ✓ or red ✗ with dim background
- Check name (13px, bold) + phase (11px, muted) on left
- Short note (11px) on right
- Separated by 1px border lines

### C) Priority Drill

- "Priority Drill — Wall Drill" header with blue dot
- 4 numbered steps with green circled numbers
- **Shank Academy card** at bottom: "🎓 Shank Academy — Watch the full drill breakdown + pro demos"
  - Styled as a tappable card with blue dim background and border
  - This is NOT a YouTube link — it references our own content platform

### CTAs
- Primary (green): "Film Another Swing 📹"
- Secondary (outlined): "← Back to Results"

---

## Design System

### Colors (SIMPLIFIED — only 2 result colors)
```css
--bad:        #e84040;    /* Faults, problems, shank */
--bad-dim:    rgba(232,64,64,0.10);
--bad-border: rgba(232,64,64,0.22);
--good:       #2fbd56;    /* Clean checks, correct positions */
--good-dim:   rgba(47,189,86,0.08);
--good-border:rgba(47,189,86,0.18);
--accent:     #6cb4ff;    /* UI actions, drills, links */
--gold:       #d4a853;    /* Inspirational/coaching elements */
```

**RULE: Never use amber/orange for results.** Everything is either a problem (red) or good (green). Accent blue is for UI elements and actions, gold is for coaching/inspiration.

### Typography
- **Font**: Space Grotesk (Google Fonts) — modern, geometric, highly readable
- **Minimum sizes**: 
  - Body text: 13px
  - Secondary text: 11px  
  - Labels: 12px
  - Headers: 15px+
  - Hero text: 17px+
- **No monospace for user-facing content** — use Space Grotesk everywhere
- **Line height**: 1.5 minimum for body, 1.7 for longer descriptions

### Spacing
- Card padding: 14px 16px minimum
- Gap between cards: 14px
- Gap between sections within cards: 12px
- Touch targets: 44px minimum height for buttons

---

## Fault Content (no P-numbers in UI)

### Phase Names (user-facing)
- "Setup" (not "Address")
- "Takeaway" 
- "Top of Backswing" (not just "Top")
- "Moment of Impact" (not just "Impact")
- "Follow-Through"

### Phase Explainers (italic text below phase name)
- Setup: "Your starting position before the club moves. Everything cascades from here."
- Takeaway: "The first move away from the ball. Sets the plane for the entire swing."
- Top of Backswing: "The highest point of your backswing, just before you start the downswing. This is where your body stores power."
- Moment of Impact: "The split second when the club face meets the ball. Every fault upstream shows up here."
- Follow-Through: "After the ball is gone. A balanced finish tells you the swing was sequenced correctly."

---

## Shank Academy References

Instead of linking to external YouTube videos or PGA/TPI websites, all drill and learning links should point to "Shank Academy" — our own content platform (to be built).

For now, the UI shows:
- "🎓 Learn more in Shank Academy →" (on fault cards)
- "🎓 Shank Academy — Watch the full drill breakdown + pro demos" (on fix screen)

These should navigate to a placeholder screen or show a "Coming Soon" modal. The architecture should use a route like `/academy/{drill-slug}` so it's ready when content is built.

---

## State Changes

### Remove (from v2)
- `walkthroughStep`, `inWalkthrough`, `walkthroughDone`
- All walkthrough navigation handlers

### Screen state
```typescript
type Screen = 'replay' | 'diagnosis' | 'chain' | 'fix';
const [screen, setScreen] = useState<Screen>('replay'); // starts on replay
```

### Replay state
```typescript
const [replayProgress, setReplayProgress] = useState(0);
const [replayDone, setReplayDone] = useState(false);
// Animation loop: setInterval at 30ms, increment by 0.008 per tick
// Total duration: ~3.5 seconds
```

### On analysis complete
```typescript
// Instead of entering walkthrough:
setScreen('replay');
setReplayProgress(0);
setReplayDone(false);
// Animation starts automatically
```

---

## Files to Create/Modify

| File | Change |
|---|---|
| `src/components/VideoAnalyzer.tsx` | Major — replace walkthrough with screen state, add replay animation, score null handling, speak toggle |
| `src/components/SwingReplayScreen.tsx` | **New** — animated swing trace + ball flight + phase timeline |
| `src/components/DiagnosisScreen.tsx` | **New** — header, score, cause chain preview, health strip |
| `src/components/CauseChainScreen.tsx` | **New** — swipeable fault cards with annotated frames |
| `src/components/FixScreen.tsx` | **New** — quote hero, scorecard, priority drill, academy link |
| `src/components/AnnotatedVideoFrame.tsx` | **New** — video + overlay dots/labels |
| `src/App.css` | Medium — all new component styles, Space Grotesk import |
| `knowledge-base/FAULT_COACHING.md` | **New** — coaching content per fault |

---

## Verification Checklist

1. `npm run build` — 0 TypeScript errors
2. Upload swing → **Swing Replay plays first** (not diagnosis)
3. Replay shows swing arc being traced on video + ball flight after impact
4. Phase timeline bars light up progressively during replay
5. Result badge fades in after replay
6. "See What Happened" → Diagnosis screen
7. Header says "What does **Shank** think of your swing?" with Shank in red
8. "Break It Down" → Cause chain with swipeable cards
9. Each card has annotated video frame with ONLY red and green dots (no orange)
10. Phase explainer (italic) appears below phase name on each card
11. All text is readable — minimum 11px, Space Grotesk font
12. "How to Fix This" → Fix screen with gold quote at top
13. Scorecard shows ALL checks (good + bad) with status icons
14. Shank Academy links appear (can be placeholder/no-op for now)
15. "Film Another Swing" returns to upload/capture (engagement loop)
16. Score = "?" when 0 checks assessed
17. Speak toggle works (click to start, click again to stop)

---

## What NOT to Build This Session

- Shank Academy content/pages (just wire up the link targets)
- "See All Phases" carousel drill-down
- Swing history / persistence
- Paywall
- P-number labels anywhere in the UI
- Amber/orange colors anywhere in results

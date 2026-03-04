# Golf Swing AI — Design Brief for Claude Code

## Purpose
Use this document as the primary design reference when building/restyling the Golf Swing AI app. The goal is to match the look, feel, and information architecture of **GolfFix AI** (our closest free competitor) while incorporating the best UX patterns from **Sportsbox 3D Golf** (the premium reference).

---

## Reference Apps

### GolfFix AI (Primary Reference — closest to what we're building)
- **App Store**: https://apps.apple.com/us/app/golffix-ai-coach-golf-lesson/id1586120680
- **Google Play**: Search "GolfFix AI Golf Swing Analyzer"
- **Review with screenshots**: http://coursereviewandjournal.com/2024/01/12/product-review-golf-fix-app/

### Sportsbox 3D Golf (Premium Reference — UX patterns to steal)
- **Product page**: https://shop.sportsbox.ai/pages/the-golf-fix
- **App Store**: https://apps.apple.com/us/app/sportsbox-3d-golf/id1578921026

---

## GolfFix AI — UI Patterns to Match

### Home / Landing
- Clean, minimal welcome screen
- Bottom tab navigation (standard mobile pattern)
- Quick access to Record / Upload / History

### Analysis Flow
1. User picks angle: **Down the Line** or **Face-On**
2. Records or uploads a clip (max ~20 seconds)
3. AI analyzes in under 30 seconds
4. Results screen is the **hero** — this gets the most visual polish

### Results Screen (THE MOST IMPORTANT SCREEN)
- **Swing Score** displayed prominently (GolfFix uses 0–10 scale, we use 0–100)
- **Phase position buttons** — tappable horizontal row: Address / Takeaway / Top / Impact / Follow-through
  - Tapping a position jumps to that frame
  - Overlay lines are togglable: swing plane, spine tilt, shoulder tilt
  - This is NOT a static collage — it's interactive frame scrubbing by phase
- **Fault identification** with:
  - Clear fault name and which phase it occurs in
  - Severity indication
  - YouTube drill videos linked based on the detected fault
  - Side-by-side comparison with a pro swing
- **Tempo measurement** — backswing time, downswing time, pause at top, compared to a rhythm/tempo reference chart

### Swing Log / History
- Tracks scores over time
- **Prioritizes faults by frequency AND severity** — lists them so user knows what to work on first
- Daily report feature
- Score trend visualization

### Technical Overlays (what makes GolfFix stand out for "golf nerds")
- Swing plane lines overlaid on the video at each position
- Spine tilt angle displayed
- Low back tilt angle displayed
- Shoulder tilt angle displayed
- All togglable with simple tap buttons — user adds/removes overlays
- Frame-by-frame scrubbing with position markers

---

## Sportsbox 3D Golf — UX Patterns to Steal

### Home Screen
- Minimal "Welcome Back" screen with current goals and last session summary
- NOT data-heavy — surfaces ONE primary insight/goal prominently
- Example: "GET TO YOUR LEAD SIDE AT IMPACT" as the single big message

### Recording / Camera Setup
- **Alignment box** appears on screen so golfer fits into frame properly (silhouette outline)
- Supports both Face-On and Down-the-Line
- Auto swing detection — records automatically when it detects a swing
- Slo-mo required (120fps minimum)

### Analysis View
- **7 key swing positions** tracked (we use 5: Address, Takeaway, Top, Impact, Follow-through)
- Position icons with ticks shown along a **scrubber/slider** at bottom of video
- Scrubber uses actual **thumbnail frames** from the video
- **Data tiles** below the video — draggable, reorderable metrics
- Data tile **presets** — curated sets of metrics based on what outcome user is working toward
- Views toggle: 2D Video / 3D Avatar / Split

### Color System (USE THIS EXACTLY)
- **Red** = bad / needs work / out of range
- **Yellow/Amber** = close / borderline / medium confidence
- **Green** = good / in range / high confidence
- Personal data compared to **pro/tour ranges** — ranges shown visually

### Goal System
- App surfaces a single prioritized goal after analysis
- Goal includes: what to fix, why it matters, drill videos to practice
- Coaches can set custom goal ranges for students

---

## Design Specifications for Our App

### Color Palette (Dark Theme — Already Established)
```
Background:     #0d1117 (near-black)
Surface/Cards:  #161b22 (dark gray)
Borders:        #30363d (subtle gray)
Text Primary:   #e6edf3 (off-white)
Text Secondary: #8b949e (muted gray)
Green (good):   #3fb950
Amber (caution):#d29922
Red (bad):      #f85149
Accent/CTA:     #58a6ff (blue)
```

### Typography
- Clean sans-serif (system fonts: -apple-system, BlinkMacSystemFont, Segoe UI)
- Score numbers: large, bold, monospace feel
- Metric values: monospace for alignment
- Body text: 14-16px, comfortable reading

### Bottom Navigation (5 tabs)
```
🏠 Home  |  📐 Setup  |  📹 Analyze  |  🎥 Live  |  📊 History
```
- Fixed bottom bar, full width
- Active tab highlighted with accent color
- Icon + label stacked vertically
- 60-70px height
- z-index above all content
- All page content needs padding-bottom to clear the nav

### Landing Page (Home Tab)
- Logo area: ⛳ Golf Swing AI + tagline (logo TBA, use emoji+text for now)
- 4 workflow cards, vertical stack, numbered 1-4:
  1. 📐 Camera Setup — "Position your phone correctly. Choose DTL or Face-On."
  2. 📹 Analyze Swing — "Upload a swing for fault analysis and tempo chart."
  3. 🎥 Live Mode — "Real-time analysis at the range."
  4. 📊 History — "Track your trends and improvement over time."
- Each card: number badge, icon, title, one-line description, arrow/tap to navigate
- Cards should all be visible without scrolling on standard phone (keep compact)

### Setup Page
- **Remove** large hero title — minimal page label only
- **Swing Type Toggle** at top: two large segmented buttons [DTL] [Face-On]
  - Persisted to localStorage
  - Actively gates which fault checks run during analysis
  - Switching updates the camera positioning diagram below
- **3 Camera Position Cards** (the visual focus of the page):
  1. Phone Placement — where to stand (diagram)
  2. Height — hip-to-shoulder height
  3. Angle — perpendicular for DTL, straight-on for Face-On
- Existing TopDownDiagram SVG switches based on DTL/Face-On selection
- "More Setup Tips" collapsible section (closed by default) for iPhone settings, equipment, checklist

### Analysis Results Page (HERO SCREEN — most design effort here)
Match GolfFix's information hierarchy:

1. **Score Card** — large, centered, color-coded (green/amber/red)
   - Shows "X/Y checks assessed" below score
   - Assessment coverage badge when incomplete

2. **Phase Scrubber** — horizontal row of 5 tappable phase buttons
   - Address | Takeaway | Top | Impact | Follow-through
   - Active phase highlighted
   - Tapping jumps video/canvas to that frame
   - Future: overlay kinematics lines per phase

3. **Could Not Assess** section (if any checks skipped)
   - Appears BEFORE faults
   - Actionable messages: "Shoulder position unclear at top — try better lighting"

4. **Fault Cards** — top 2 faults, sorted by phase order
   - Color-coded severity border (red/amber)
   - Fault name, phase, description
   - Drill recommendation
   - Header shows: "1 fault found · 2 checks skipped"

5. **Tempo Chart** — SVG visualization
   - Backswing:Downswing ratio shown as range (e.g., 2.7–3.1:1)
   - Tour zone 2.5:1–3.0:1 as shaded band
   - FPS precision badge (green/amber/red)
   - Low-fps warning banner when applicable

### History Page
- **Stat Cards Row**: Swings | Avg Score | Best | Latest
  - Color-coded with green/amber/red thresholds
  - Best score uses threshold colors (NOT hardcoded green)
- **Score Trend Chart** — SVG line chart, last 30 sessions
  - Reference lines at 60 and 80
  - Dots: filled = full assessment, hollow = partial session
  - Trend line: green if improving >2.5pts, red if declining >2.5pts, gray neutral
- **Most Frequent Faults** — bar chart, top 5
  - Fault name + frequency bar + count
- **Session List** — reverse chronological
  - Score (color-coded) + partial badge if assessedCount < totalChecks
  - Fault tags for each session

---

## Fault-to-Angle Mapping

This is already implemented. Documenting for reference:

| Check                              | Face-On | DTL | Why |
|------------------------------------|---------|-----|-----|
| Shoulder Tilt (Y delta)            | ✅      | ✅  | Vertical shoulder height works from either view |
| Reverse Pivot (X shift addr→top)   | ✅      | ❌  | X = lateral from Face-On; X = depth from DTL (wrong axis) |
| Head Up (Y rise at impact)         | ✅      | ✅  | Vertical nose movement visible from either view |
| Early Extension (X hip movement)   | ❌      | ✅  | X = depth from DTL (hips toward ball); X = lateral from Face-On |

Both angles → exactly 3 applicable checks. `totalChecks` = 3 regardless of angle.

---

## Key Principles

1. **The analysis results screen is the hero.** Setup is a quick gate. Results are what users screenshot and share. Pour the design effort there.

2. **Single primary insight.** Don't dump all data at once. Score + top 2 faults + tempo. That's it for the main view.

3. **Red/Yellow/Green everywhere.** Consistent color language across every surface — scores, faults, trend dots, badges, precision indicators.

4. **Honest about uncertainty.** When we can't assess something, we say so. When precision is low, we show it. This builds trust.

5. **Mobile-first.** Bottom nav, touch targets, thumb-reachable CTAs. Everything should work on a phone screen at the range.

6. **Progressive disclosure.** Show the essential info up front, let power users dig deeper. Setup tips collapsed by default. Overlay lines togglable. Data tiles expandable.

---

## What We Have vs. What GolfFix Has

| Feature | Us (Current) | GolfFix | Priority |
|---------|-------------|---------|----------|
| Score display | ✅ 0-100 | ✅ 0-10 | Done |
| Phase detection | ✅ 5 phases | ✅ ~6 positions | Done |
| Fault detection | ✅ 4 checks, angle-gated | ✅ Multiple checks | Done |
| Tempo chart | ✅ With precision gating | ✅ Basic tempo display | Done |
| Confidence gating | ✅ Three-tier messages | ❌ Not visible | Done (ahead) |
| Assessment coverage | ✅ assessedCount/totalChecks | ❌ | Done (ahead) |
| Score trend chart | ✅ SVG, 30 sessions | ✅ Score log | Done |
| Fault frequency tracking | ✅ Top 5 bar chart | ✅ Prioritized list | Done |
| Interactive phase scrubber | ❌ | ✅ Tappable positions | **Next** |
| Kinematics overlay lines | ❌ | ✅ Plane/spine/shoulder | **Next** |
| Side-by-side pro comparison | ❌ | ✅ Model pro swing | Future |
| Drill videos per fault | ❌ Text drills only | ✅ YouTube links | Future |
| Alignment box (recording) | ❌ | Sportsbox has this | Future (Live Mode) |
| 3D avatar | ❌ | Sportsbox only | Not planned |
| Bottom nav | 🔧 Being built | ✅ Standard mobile | In progress |
| Landing page | 🔧 Being built | ✅ Minimal home | In progress |

---

## Implementation Notes for Claude Code

- Use **Sonnet** for execution — the architecture decisions are already made
- All new components go in `src/components/`
- Styles go in `src/App.css` — single file, no CSS modules
- State shared via `localStorage` (swingType bridge between Setup and VideoAnalyzer)
- No external UI libraries — everything is hand-built React + CSS + SVG
- Test with `npx tsc --noEmit` before committing
- Dark theme only — no light mode toggle needed

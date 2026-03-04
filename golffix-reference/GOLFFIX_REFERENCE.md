# GolfFix AI — Complete Reference for Claude Code

> **PURPOSE**: This is the single source of truth for restyling our Golf Swing AI app.
> Read this ENTIRE file before making any UI changes. Match GolfFix's look, feel, and
> information architecture. Screenshots are in `./screenshots/`.

---

## Part 1: Screenshot Map (./screenshots/)

These are actual screenshots from GolfFix AI captured on iPhone. Study each one.

### Onboarding Flow (first-run experience)
| File | Screen | What to Note |
|------|--------|-------------|
| `IMG_2900.PNG` | **Onboarding Slide 1** — "When your swing isn't going the way you want — where does the problem lie?" | Full-bleed golf photo, large centered text below, single "Next" button at bottom. Clean, minimal, white background below the image. |
| `IMG_2901.PNG` | **Onboarding Slide 2** — "AI analyzes my swing and clearly tells me what the issues are" | Shows green bounding box around head/torso + green shoulder line overlay on the golfer. This is the alignment/detection preview. |
| `IMG_2902.PNG` | **Onboarding Slide 3** — "Improve your skills with precise motion recognition technology and core swing principles" | Shows **green skeleton overlay** (MoveNet-style pose lines) on a golfer at top of backswing. Joints are green dots, bones are green lines. Green leg tracking lines extend down. |
| `IMG_2903.PNG` | **Onboarding Slide 4** — "With GolfFix, golf gets easier and easier!" | Shows **green swing plane overlay** — the V-shaped swing arc traced from DTL view. Blue "Start with GolfFix" CTA button. |
| `IMG_2904.PNG` | **Login Screen** — "PERFECT SWING, PERFECT SCORE! GolfFix" | GolfFix logo (G icon + "GolfFix" text), full-bleed background photo, three white auth buttons (Apple, Google, Email), "Try as Guest" text link below. Language selector top-right. |
| `IMG_2905.PNG` | **Nickname Setup** — "Please create a cool nickname" | Simple white screen, text input, "Check" button. Standard profile setup. |

### Profile Setup Questionnaire
| File | Screen | What to Note |
|------|--------|-------------|
| `IMG_2908.PNG` | **Pre-analysis prompt** — "Answer a few questions to receive an accurate Analysis." | Centered bold text, white background, "Next" button. Very minimal. |
| `IMG_2909.PNG` | Same as above (duplicate screenshot) | — |
| `IMG_2910.PNG` | **Average Score** — "What's your average score?" | Slider control (blue fill), displays "70 ~ 80", cute flag illustration, Skip + Next buttons at bottom. |
| `IMG_2911.PNG` | **Experience** — "How long have you been playing golf?" | Same slider pattern, "10 years ~", calendar illustration. Skip + Next. |
| `IMG_2912.PNG` | **Handedness** — "Right-handed or Left-handed?" | Golfer illustration, **segmented toggle** [Right-handed | Left-handed], blue "Complete" button. |
| `IMG_2913.PNG` | **Notifications** — "Would you like to receive news that helps improve your golf skills?" | Bell illustration, notification mock-up, Later + OK! buttons. |

### Subscription / Paywall
| File | Screen | What to Note |
|------|--------|-------------|
| `IMG_2914.PNG` | **Paywall** — "Start Your 14-Day Free Trial" | Dark theme (navy/purple gradient), "Advanced" badge, feature checklist with checkmarks (No network Ads, Shot Fix Lesson, Club·Wrist Trajectory, Swing Comparison, 60FPS, Rhythm·Tempo Analysis, Unlimited swing log, Monthly Report, 7 Pro swing videos). Teal "Subscribe" button, gradient accent. |
| `IMG_2915.PNG` | **Upgrade Confirmation** — "Advanced Plan upgrade complete!" | White modal overlay on dark background. Simple confirm button. |

---

## Part 2: GolfFix UI Design Patterns

### Color System
- **Primary accent**: Blue (#4285F4 range — used for CTAs, "Complete", progress fills)
- **Green**: Skeleton overlays, swing plane lines, alignment boxes, "good" indicators
- **Dark mode**: Navy/purple gradient for premium/paywall screens
- **Light mode**: Clean white backgrounds for onboarding and setup
- **Text**: Black headers on white, white text on dark/photo backgrounds
- **Buttons**: Full-width rounded rectangles, dark charcoal for "Next", blue for primary CTAs

### Layout Patterns
1. **Full-bleed image + text below**: Used for onboarding slides. Image takes ~60% of screen, text is centered below, button pinned to bottom.
2. **Centered illustration + question + control**: Used for profile setup. Illustration in middle, question as bold header, input control (slider/toggle), buttons at bottom.
3. **Bottom tab navigation**: Standard 5-tab mobile nav (Analysis, Focus Drill, Academy, Community, My Page)
4. **Segmented toggles**: Used for binary choices (Right/Left-handed, DTL/Face-On). Rounded pill shape, selected state is white with border, unselected is gray.

### Typography
- Headers: Large bold sans-serif (~24-28pt), black on white
- Subtext: Gray (#666), smaller, often italic or light weight
- "You can change it in My page > My Profile" — consistent helper text pattern

### Recording UI (from guide)
- **Camera angle selection**: DTL or Face-On, shown as large option before recording
- **Alignment guidelines** (Advanced feature): V-zone + vertical line for Face-On, stance line for DTL
- **Recording settings bar** at bottom: Orientation, Drill Count, Timer, Feedback Time
- Camera positioned: chest height, 2.5-4m away for Face-On, 1.8-3m for DTL
- Full body must be visible including club head and ball

---

## Part 3: GolfFix Feature Set (from guides + updates)

### Core Analysis Flow
1. User goes to Analysis tab
2. Choose: Record Swing or Import Video
3. Select camera angle (Face-On or DTL) and recording options
4. Position correctly, press START
5. AI auto-detects swing, captures and analyzes
6. **Analysis Report** generated with:
   - Swing score
   - Detected posture issues
   - Solutions and drill recommendations
   - Skeleton overlay on video
   - Swing positions breakdown

### Focus Drill (Targeted Practice)
- User selects a specific issue to work on
- Records practice swings focused on that issue
- Gets targeted feedback per swing
- Posture drill mode available

### Shot Fix Lesson (Premium — Personal AI Coach)
- User selects from 10 common "Shot Troubles" (slice, hook, thin, chunk, shank, etc.)
- AI analyzes swing to find root cause of that specific miss-hit
- Shows **percentage influence** (e.g., "Your posture has a 70% influence on your Thin Shot")
- Provides personalized drill
- Interactive conversational UI — user can ask follow-up questions to AI coach
- Two tiers: "Assistant Coach" (free/basic) and "Head Coach" (premium/advanced)

### Club-Specific Analysis
- Data separated into Total, Iron, and Driver modes
- Daily Report and Monthly Report both support club filtering
- Swing Tempo Distribution card tracks consistency
- Frequent Issues filterable by club type + "This Month" view

### 60 FPS Analysis (Premium)
- Records at 60fps for twice the visual data vs 30fps
- Better accuracy at impact — clearer clubface angle detection
- Smoother trajectory lines
- Detects subtle body movements missed at lower frame rates
- 120fps planned for future

### Recording Guidelines (from recording guide)
- **Face-On**: Camera centered on body, 2.5-4m away (6-13 feet), chest height
- **DTL**: Feet aligned in center of frame, 1.8-3m away (6-10 feet), chest height
- Camera height: between waist and chest (~130cm / 4.27ft)
- Keep camera stable — no tilt or shake
- Full body, club head, and ball must be visible entire swing
- Phone holder or tripod recommended

### Preview Guidelines (Premium Recording Feature)
- **Face-On**: V-zone guide + Vertical line on tailbone
- **DTL**: Stance line guide
- Toggleable on/off during recording

---

## Part 4: What We Should Match / Implement

### MUST MATCH (High Priority)
1. **Onboarding flow**: Full-bleed image slides with centered text below + Next button. We need 3-4 slides explaining what the app does before dropping user into the main app. Match the image-heavy, text-light pattern from IMG_2900-2903.
2. **Bottom tab navigation**: 5 tabs, standard mobile pattern. Icons + labels.
3. **Green skeleton overlay**: When showing analysis results, draw MoveNet keypoints as green dots and bone connections as green lines — exactly like IMG_2902.
4. **Swing plane visualization**: Green swing arc/plane lines overlaid on the video — like IMG_2903.
5. **Profile setup flow**: Ask handedness (Right/Left toggle) and camera angle preference. Use the centered-illustration + question + control pattern from IMG_2910-2912.
6. **Segmented toggle style**: Rounded pill shape for binary choices (DTL/Face-On, Right/Left).
7. **Analysis results as hero screen**: Score prominently displayed, skeleton overlay on frame, fault cards below.

### SHOULD IMPLEMENT (Medium Priority)
1. **Recording guidelines overlay**: Show alignment guides on the camera/recording screen (V-zone for Face-On, stance line for DTL).
2. **Club type selection**: Let user specify Driver vs Iron — affects analysis (different tempo expectations, different common faults).
3. **Shot Trouble selection**: Before analysis, optionally let user say "I'm working on my slice" so feedback can be focused.
4. **Percentage influence on faults**: Instead of just "you have early extension", show "Early Extension contributes 65% to your inconsistency" — makes feedback feel data-driven.

### NICE TO HAVE (Lower Priority)
1. Full conversational AI coach (Shot Fix Lesson style)
2. Monthly report with club-separated data
3. 120fps support
4. Community features
5. Pro swing comparison side-by-side

---

## Part 5: Our App's Current Architecture

### Already Built
- State machine: 5-phase detection (Address, Takeaway, Top, Impact, Follow-Through)
- Tempo chart with FPS-gated precision and uncertainty ranges
- Confidence gating messages ("Could Not Assess" with actionable hints)
- Score trend chart in History (SVG, last 30 swings)
- Assessment coverage (assessedCount/totalChecks)
- Fault-to-angle mapping (Face-On vs DTL gates different checks)

### Color Palette (Dark Theme)
```
Background:     #0d1117
Surface/Cards:  #161b22
Borders:        #30363d
Text Primary:   #e6edf3
Text Secondary: #8b949e
Green (good):   #3fb950
Amber (caution):#d29922
Red (bad):      #f85149
Accent/CTA:     #58a6ff
```

### Tech Stack
- React (single-page app)
- MoveNet Lightning for pose detection
- All styles in src/App.css
- No external UI libraries
- localStorage for state persistence between tabs

### File Structure
```
src/
  App.tsx              — Main app, tab routing, header
  App.css              — All styles
  components/
    LandingPage.tsx    — Home tab (being built)
    SetupGuide.tsx     — Camera setup + DTL/Face-On toggle
    VideoAnalyzer.tsx  — Upload + analysis + results (hero screen)
    SwingStateMachine.ts — Phase detection engine
    TempoChart.tsx     — SVG tempo visualization
    History.tsx        — Score trend + fault frequency + session list
    LiveAnalyzer.tsx   — Real-time camera mode (future)
```

---

## Part 6: Implementation Instructions for Claude Code

### Priority Order
1. **Add onboarding slides** (first-run only) — match IMG_2900-2903 pattern
2. **Restyle bottom navigation** — match standard mobile tab bar
3. **Add green skeleton overlay** to analysis results — match IMG_2902
4. **Restyle analysis results page** — this is the hero screen, most design effort
5. **Add profile setup** (handedness + camera angle) — match IMG_2910-2912 pattern
6. **Restyle landing page** with workflow cards
7. **Restyle setup page** with recording guidelines

### Design Rules
- Study each screenshot in `./screenshots/` before writing CSS
- Match GolfFix's layout proportions (image 60% / text 40% on onboarding)
- Use our dark theme colors, not GolfFix's light theme
- Green (#3fb950) for skeleton overlays and positive indicators
- Full-width buttons, rounded corners (8-12px radius)
- Segmented toggles for binary choices
- Centered illustrations/icons for setup questions
- Minimal text — let visuals do the talking
- Mobile-first — everything must work on phone screens

# Deszczyk i Tęcza

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Deszczyk i Tęcza |
| Activity ID | `deszczyk` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Three clouds over a meadow: touching a cloud makes it rain gently, puddles ripple and swell, and after enough rain a soft rainbow fades in and out again. |
| Category | Cause and effect; observation |
| Interaction type | Tap (touch, mouse, keyboard) |
| Status | Implemented; enabled in the menu by default |
| Source | [`js/deszczyk.js`](../../js/deszczyk.js), styles with prefix `r-` in [`css/style.css`](../../css/style.css), script tag in [`index.html`](../../index.html) |

## 2. Business purpose

- A weather toy with a delayed, rewarding consequence: rain now, rainbow later, which shows a longer chain of cause and effect than a single tap-response.
- Calm, low-stimulation scenery (pastel sky, slow-falling drops).
- Complements [Magiczny Ogród](magiczny-ogrod.md), whose rain issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) (open) asks to match the rain of this activity.
- Described in the README Activities list as item 10.

## 3. Activity flow

1. The child opens the tile; the static scene is built (the animation loop is **not** running yet).
2. Initially displayed: a pale sky, a meadow, three puddles and three clouds.
3. Interactions: tap a cloud.
4. Response: that cloud rains for 5 s (a tap during rain restarts the 5 s); drops fall straight below it; those landing in a puddle produce a ripple; puddles swell a little while it rains and shrink back after.
5. After a total of 30 "cloud-seconds" of rain a rainbow fades in (4 s), stays (10 s) and fades out (4 s).
6. There is no formal end; the child can start rain again at any time, and the rainbow can reappear.
7. Restart: leave and re-open the activity (all counters reset).
8. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Rain duration | `RAIN_S = 5` s per tap. Tapping a raining cloud resets its timer to 5 s (it does not add up). |
| Drops | Each raining cloud spawns `DROPS_PER_S = 7` drops per second; a drop falls at `FALL = 0.2` board heights per second. Pool `MAX_DROPS = 60`; when the pool is full, new spawns are skipped silently. |
| Drop path | x = cloud x plus a random offset of up to 35 % of the cloud width either way; the drop starts 0.05 board heights below the cloud centre. |
| Landing | If the drop's x is within 40 % of a puddle's width of the puddle centre, it lands at the puddle's y and creates a ripple; otherwise it lands at a random ground y between 0.74 and 0.97 and disappears without a ripple. |
| Ripples | Pool `MAX_RIPPLES = 12`; lifetime `RIPPLE_S = 2.6` s; scale from 0.2 to 1 (smoothstep) and opacity from 0.7 to 0. A ripple is skipped if the pool is full. |
| Puddles | Scale by `1 + 0.18 * level`; `level` eases towards 1 while any cloud rains and back to 0 afterwards (rate about 0.25 per second, exponential). |
| Rainbow counter | `rainTotal` increases by `dt * (number of raining clouds)` only while no rainbow is showing. At 30 (`RAINBOW_AFTER_S`) the rainbow starts and the counter resets to 0. So one cloud needs 30 s of continuous rain, three clouds 10 s. |
| Rainbow | Fade in 4 s, hold 10 s, fade out 4 s (smoothstep, max opacity 0.85); 18 s in total. Rain during the rainbow does not count towards the next one. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect, including a delayed consequence (rain leads to a rainbow).
- Calm observation of slowly falling drops, ripples and a fading rainbow.
- Noticing that several clouds together make it happen faster.

**Directly observable behavior**

- Rain starts only on touch, stops by itself, and the rainbow only appears after enough rain.
- No failure, score or text.

**Requires professional or research-based validation**

- Any claims about understanding of weather or causality. Nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** the clouds are native `<button>`s (labels "Chmurka 1" to "Chmurka 3"); they react to `pointerdown` (touch, mouse, stylus) and to keyboard-generated `click` (Enter/Space).
- **Targets:** each cloud is 30 to 36 % of the board width with `min-width: 96px`.
- **Layout:** the board is a square `min(94vw, 100dvh - 110px)` with a 60 px top margin, centred; works in portrait and landscape (a smaller board in landscape).
- **Colour:** nothing depends on colour; the rainbow is decorative.
- **Reduced motion:** every moving part (rain, ripples, puddle swelling, rainbow fades) is driven by one `requestAnimationFrame` loop, not CSS, so it still animates under the global rule. The activity has no reduced-intensity variant.
- **Touch:** `touch-action: none`, no text selection.
- **Reading:** not required. A young child can use it independently.
- **Limitations:** the clouds have no `aria-pressed` or raining state; a screen reader cannot tell whether it is raining.

## 7. Risks and limitations

- With all three clouds raining, the demand (21 drops/s, each falling for roughly 2.6 to 4 s) can exceed the pool of 60 drops, so some drops are skipped (computed from the constants; visual effect requires verification).
- Rainbow appears after real play only; a child who taps once may never see it (a single cloud needs 30 s of rain, so about 6 re-taps).
- No ending; relies on the global playtime limit.
- No privacy concerns; nothing is stored.

## 8. Configuration

No external configuration. Constants at the top of [`js/deszczyk.js`](../../js/deszczyk.js):

| Constant | Purpose | Value |
|---|---|---|
| `RAIN_S` | Rain time per tap | 5 s |
| `RAINBOW_AFTER_S` | Cloud-seconds of rain before the rainbow | 30 |
| `FADE_IN_S`, `HOLD_S`, `FADE_OUT_S` | Rainbow phases | 4, 10, 4 s |
| `MAX_DROPS`, `MAX_RIPPLES` | Pool sizes | 60, 12 |
| `DROPS_PER_S`, `FALL` | Drop rate per cloud; fall speed (board heights per second) | 7, 0.2 |
| `RIPPLE_S` | Ripple lifetime | 2.6 s |
| `CLOUDS` | Cloud `x, y, w` (fractions of the board) | (0.2, 0.17, 0.34), (0.52, 0.1, 0.36), (0.82, 0.2, 0.3) |
| `PUDDLES` | Puddle `x, y, w` | (0.24, 0.84, 0.24), (0.56, 0.92, 0.22), (0.8, 0.8, 0.2) |
| `GROUND_MIN`, `GROUND_MAX` | Landing range for drops outside puddles | 0.74, 0.97 |

Fallback: none needed (no external values).

## 9. Assets

No external asset files. The cloud (`CLOUD_SVG`) and the rainbow (six stroked arcs, colours `#f7b6c2`, `#ffd3a8`, `#fff0a8`, `#bfe6b4`, `#b5dcf5`, `#c9b8f2`, `viewBox="0 0 200 110"`) are inline SVG; the meadow, puddles, ripples and drops are CSS shapes. No images, fonts or audio.

## 10. Randomization and variants

- The only randomness is in the rain itself: each drop's horizontal offset under its cloud, and its landing y when it does not hit a puddle (`Math.random`).
- Scene, cloud and puddle layout are fixed; there are no variants and nothing is stored.

## 11. Progression and difficulty

None. The rainbow counter is a short-lived internal state (in memory only) and resets when the activity is re-opened.

## 12. Completion and feedback

- There is no completion state. The rainbow is a delayed reward, not an end.
- Feedback: falling drops, ripples, puddles swelling; the rainbow fade in and out. No failure feedback, no sound.
- After the rainbow fades out the counter starts again from 0.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/deszczyk.js`](../../js/deszczyk.js); the cleanup function cancels the frame, removes listeners and the scene.
- **Rendering:** DOM. Fixed pools of 60 drop `div`s, 12 ripple `div`s, 3 puddles, 3 cloud buttons and one rainbow element are created at mount; drops and ripples are shown or hidden with `display`.
- **Loop:** `frame()` with `dt` capped at 0.05 s. It is started by a cloud tap and stops itself when nothing is active (no rain, drops, ripples, rainbow or puddle swelling). It pauses when the tab is hidden; long gaps are never replayed.
- **State:** per-cloud `rain` timer and drop accumulator; `rainTotal`, `bowState` (0 idle, 1 fade in, 2 hold, 3 fade out), `bowT`; `level` for puddles.
- **Events:** `pointerdown` (with `preventDefault`) plus `click` (when `detail === 0`) per cloud; `visibilitychange`.
- **Shared code:** none (the activity does not use `js/random.js` or `js/animals.js`).
- **Persistence and analytics:** none.

## 15. Responsive layout and coordinate system

- A square board `.r-box` of side `min(94vw, 100dvh - 110px)`; all elements are placed with percentages of that square (clouds, puddles, drops, ripples, rainbow), so they always line up. The meadow extends beyond the square horizontally (`left/right: -100vw`).
- Drop positions are stored as fractions of the board; the rainbow occupies 4 % to 96 % of the width from 30 % of the height.
- Orientation changes need no JavaScript (CSS sizing only).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Rapid taps on clouds | Timer reset only; the pools bound the DOM. |
| Pool exhausted | New drops or ripples are skipped silently. |
| Tab hidden | Frame loop cancelled; on return `last` is reset, so the time hidden is not counted as rain or rainbow time. |
| Resize / orientation | CSS handles it; no JavaScript. |
| Leaving mid-rain | Cleanup cancels the frame and removes the scene. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Normal: open the activity; nothing moves; tap a cloud; it rains for about 5 s under that cloud only; puddles ripple and swell slightly and then shrink.
- [ ] Tap one cloud repeatedly for about 30 s; the rainbow fades in, holds and fades out.
- [ ] Tap all three clouds together; the rainbow appears after about 10 s.
- [ ] Rain during the rainbow does not trigger an immediate second rainbow.
- [ ] Incorrect interaction: tap the sky, meadow and puddles; nothing happens.
- [ ] Rapid tapping on all clouds; no slowdown, drops stay bounded.
- [ ] Restart: re-open the activity; the rainbow counter and puddles are reset.
- [ ] Randomization: drops fall at slightly different positions; confirm the layout is always identical.
- [ ] Progression: confirm that there is none.
- [ ] Portrait and landscape; rotate during rain; clouds and puddles stay aligned with the meadow.
- [ ] Touch and mouse; keyboard (Tab to each cloud, Enter/Space triggers rain, focus ring visible).
- [ ] Background/foreground: hide the tab during rain and the rainbow; on return the motion resumes without catching up.
- [ ] Reduced motion: rain, ripples and rainbow still animate.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#38](https://github.com/BielinskiLukasz/child-page/pull/38) reports that `node --check` passed and lists manual tests (including rapid tapping, orientation change and reduced motion) as pending. PR [#68](https://github.com/BielinskiLukasz/child-page/pull/68) reports a stub-DOM mount without errors and lists the "all clouds rain" symptom on a Galaxy A33 as needing a device check.

## 18. Known limitations and open issues

**Confirmed**

- No raining-state announcement for assistive technology.
- The rainbow threshold is time-based, so a casual single tap never produces a rainbow.
- No automated tests.

**Requires verification**

- Pool saturation with three clouds raining (see section 7).
- Whether per-cloud rain is visually clear on small phones (the symptom in PR #68 was a device report).

## 19. Planned improvements

`None currently planned`.

## 20. Related activities and reusable components

- Weather and sky: [Magiczny Ogród](magiczny-ogrod.md) (open issue #167 asks for its rain to match this activity's), [Dzień i Noc](dzien-i-noc.md).
- Shared helpers: none used (`js/random.js` and `js/animals.js` are not used).
- The rAF loop pattern (capped time step, stops when idle, restarts on `visibilitychange`) is shared with other activities.

## 21. Change history

- Issue [#29](https://github.com/BielinskiLukasz/child-page/issues/29) / PR [#38](https://github.com/BielinskiLukasz/child-page/pull/38): initial activity (rain, puddles, rainbow).
- Issue [#66](https://github.com/BielinskiLukasz/child-page/issues/66) / PR [#68](https://github.com/BielinskiLukasz/child-page/pull/68): drops fall below their own cloud; the rainbow counter counts cloud-seconds with a threshold of 30.
- Reviewer suggestion commit `0c0c4e8`: rain during the rainbow no longer counts towards the next one.

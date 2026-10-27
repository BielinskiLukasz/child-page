# Dzień i Noc

## 1. Overview

| Property | Value |
|---|---|
| Display name | Dzień i Noc |
| Activity ID | `dzien-i-noc` (`js/activities.js`) |
| Description | Touching the sun slowly brings night with stars, touching the moon brings the day back, touching the sky sends a cloud drifting by. By day 2-3 birds cross the sky; at night a satellite or a plane sometimes drifts past and new stars slowly appear. |
| Category | Calming, observation, cause and effect |
| Interaction type | Tap the sun/moon, tap the sky, tap a bird |
| Status | Implemented. Enabled by default in the menu (no `defaultOff` flag). |
| Source | [`js/dzien-i-noc.js`](../../js/dzien-i-noc.js), CSS classes `.dn`, `.dn-*` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A slow, predictable scene about the day-night cycle: one big button changes the whole sky with a smooth, unhurried transition. It supports calm, bedtime-like observation and has a very clear cause and effect relation (one touch, one gradual change). Compared with [Nocne Niebo](nocne-niebo.md) (connecting stars) and [Dobranoc](dobranoc.md) (a bedtime scene) it has no task, only a living sky with small optional surprises (birds, clouds, a passing plane or satellite).

## 3. Activity flow

1. The child opens the tile (hash `#dzien-i-noc`); the scene starts in full day.
2. A light blue sky, three drifting clouds and a big sun (centre, 42 % from the top) are shown; after a moment 2-3 birds fly across.
3. The child can tap the sun, the sky or a bird.
4. Tapping the sun starts a 3.5 s transition to night: the sky darkens, the sun cross-fades into a smiling moon, stars appear, clouds fade and birds disappear. Tapping the moon reverses it. Tapping the sky adds a cloud; tapping a bird makes it fly a slow loop.
5. There is no completion state.
6. The activity keeps running and switching as often as the child wants.
7. There is no restart; the scene always begins as day.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Day/night transition | `TRANSITION_MS` = 3500 ms with smoothstep easing; 1200 ms (`REDUCED_MS`) under reduced motion; driven by a `requestAnimationFrame` loop that sets the CSS variable `--p` (0 = day, 1 = night) |
| Toggle target | `progress < 0.5` means day, so a tap goes to night (target 1); otherwise to day |
| Input lock | While the transition runs (`busy`), taps on the sun/moon **and on the sky** are ignored; bird taps still work |
| Sun/moon button | One `<button>`, size `clamp(150px, 38vmin, 320px)`, at 50 % / 42 %; its `aria-label` switches between "Słońce" and "Księżyc" at `progress >= 0.5` |
| Clouds | 3 ambient clouds are kept at all times (`AMBIENT`); max 7 in total (`MAX_CLOUDS`, oldest dropped); ambient speed 1.6-2.4 vw/s; removed beyond 105 vw; width 18-30 vmin; opacity falls from .95 to .40 as night comes |
| Cloud tap | Adds a cloud entering at -30 vw at the tapped height (y minus 8 %, clamped to 2-70 %) moving 3.2 vw/s |
| Birds | Flock of 2-3 (`flockSize`, chosen each launch), daytime only. Each crosses the screen in 20 s (+/- 15-25 %), in a lane that avoids the sun/moon box, with slow wing flapping (0.55-1 vertical scale, 1.2 flaps/s); when one leaves, the next enters after 0-1.5 s. The flock appears when day is fully reached (`progress < 0.05` and target day), and is removed once `progress >= 0.5` |
| Bird tap | A bird that is not already looping flies one 2.6 s loop away from the sun/moon; bird button at least 56 px (`clamp(56px, 9vmin, 72px)`) |
| Stars | 100 fixed stars (seeded generator, same layout each visit; 10 % bright 3-4 px, others 1.4-2.7 px, opacity 0.4-0.8) in the top 60 % of the screen; a new star is added every 15-30 s up to `STAR_CAP` = 160 and grows from 1 px in 8 s (`STAR_GROW_SECONDS`); they exist (hidden) by day too |
| Night flyer | At most one; only when night is reached (`progress >= 0.95`, target night), every 20-45 s; 50 % a steady white satellite (18 s crossing), 50 % a grey airplane dot with a red pulse (12 s crossing, 0.7 s cosine pulse); not touchable; removed when day returns |
| Scoring / failure | None |

Reduced motion: transition and bird/flyer/star motion are rAF-driven and still run (the transition is shortened to 1.2 s). Ambient clouds are **not** animated: the three initial clouds stay still, no new ones are generated, and a tap on the sky creates a static cloud that disappears after 6 s.

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (touch the sun, the sky changes).
- Calm observation; the idea that day and night alternate.
- Spotting small events (a bird, a satellite or plane) in a quiet scene.

**Directly observable behavior**

- A 3.5 s smooth change between a day and a night scene with a sun/moon swap.
- Birds, clouds, stars and passing objects keep the scene alive without requiring input.

**Requires professional or research-based validation**

- Any effect on bedtime routine, calming or understanding of time. None is measured or claimed.

## 6. Accessibility and usability

- **Input:** pointer (touch, mouse, stylus) via `pointerdown`; **keyboard** for the sun/moon button and birds through `click` events with `detail === 0` (Enter/Space). Clouds can only be added by pointer.
- **Screen readers:** the sun/moon button changes its label; birds are labelled "Ptaszek". Stars, clouds and the night flyer are hidden from assistive technology.
- **Layout:** full-screen, percent and viewport-unit based, works in portrait and landscape.
- **Targets:** sun/moon at least 150 px; birds at least 56 px; the sky is a large target.
- **Colour:** day and night are distinguished by brightness and the sun/moon icon shape, not hue alone.
- **Flashing:** the plane's red pulse is a smooth cosine with a period of 0.7 s (about 1.4 Hz) on a 3.5 px dot, below the usual 3 Hz flash threshold.
- **Sound:** none. **Reading:** not required. Independent use by a young child is possible.
- **Reduced motion:** see section 4; clouds do not drift.
- **Limitations:** the sun/moon button does not expose a pressed state; sky taps are ignored during the transition.

## 7. Risks and limitations

- Night is dark (dark blue); a child may find the screen dim at bedtime, and a parent may prefer lower device brightness. Not a medical claim.
- No ending, so the playtime limit is the only stop (see [shared behaviour](README.md#shared-platform-behaviour)).
- Stars keep being added while the activity stays open (up to 60 extra), so the night sky is slightly different after a long visit.
- Birds are hidden at night, so a child who touches the moon just after day returns may wait several seconds for birds.
- In very short landscape windows the bird lanes can collapse (computed: 640x360 leaves one lane of about 30 px at the bottom), so birds may overlap one another (requires verification in a browser).
- No personal data is involved.

## 8. Configuration

No external configuration. Constants at the top of [`js/dzien-i-noc.js`](../../js/dzien-i-noc.js); layout and colours in [`css/style.css`](../../css/style.css).

| Constant | Purpose | Value |
|---|---|---|
| `MAX_CLOUDS`, `AMBIENT` | Cloud limits | 7, 3 |
| `TRANSITION_MS`, `REDUCED_MS` | Transition length | 3500, 1200 |
| `BIRD_SECONDS`, `LOOP_SECONDS` | Bird crossing and loop duration | 20, 2.6 |
| `STAR_ADD_MIN`, `STAR_ADD_MAX`, `STAR_GROW_SECONDS`, `STAR_CAP` | New-star interval (s), growth time, total cap | 15, 30, 8, 160 |
| `FLY_MIN`, `FLY_MAX`, `SAT_SECONDS`, `PLANE_SECONDS`, `BLINK_SECONDS` | Night flyer interval, crossing times and pulse | 20, 45, 18, 12, 0.7 |
| `flockSize` | Birds per launch | 2-3 (local variable) |
| Star seed | Fixed layout of the first 100 stars | 7 (`makeStars`) |

No fallback is needed because nothing is read from outside.

## 9. Assets

No external assets. Sun, moon, birds and clouds are inline SVG strings in the JS file; stars and the night flyer are CSS-styled elements. The menu icon is inline SVG in [`js/activities.js`](../../js/activities.js). No fonts, audio or images.

## 10. Randomization and variants

| What | When | Rule |
|---|---|---|
| Flock size | Each launch | 2 or 3 uniformly (`Math.random`) |
| Bird direction, lane, speed (+/- 15-25 %), phase | Each bird spawn | Uniform |
| Respawn delay | When a bird leaves | 0-1.5 s |
| Cloud heights, widths, speeds, respawn offset | Each cloud | Ranges in section 4 |
| Added stars (position, size class, opacity) | Every 15-30 s | Uniform; about 10 % bright, about 25 % stay at 1 px, the rest 1.4-2.7 px |
| Night flyer type, direction, height (4-44 %), slope (+/- 6 %) and wait | Per flyer | 50 / 50 satellite or plane |
| Initial 100 stars | Never | Fixed seed (same every launch) |

It uses `Math.random` directly, not [`js/random.js`](../../js/random.js); there is no "no immediate repeat" logic and nothing is stored.

## 11. Progression and difficulty

None. The only slow change is the growing number of stars (100 to at most 160) during a long visit; nothing is persisted.

## 12. Completion and feedback

No formal completion state. Feedback is the transition itself, a cloud appearing under a sky tap and a bird's loop. No sound and no celebration.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/dzien-i-noc.js`](../../js/dzien-i-noc.js).
- **Rendering:** DOM. `div.dn` with `.dn-night` (overlay whose opacity is `--p`), `.dn-stars`, `.dn-clouds`, the sun/moon button and bird buttons. Sun and moon are two SVG groups cross-faded by `--p`.
- **State:** `progress`, `target`, `busy`, `clouds`, `birds`, `respawn`, `growing`, `flyer`, `timers`.
- **Loops:** `step` (transition, started only on a toggle) and `cloudTick` (clouds, birds, flyer, stars; always running). Both stop when the tab is hidden; on return the clocks are reset and a toggle in progress resumes. `dt` is clamped (100 ms).
- **Events:** `pointerdown` and `click` on the scene (delegated), `visibilitychange` (also toggles `.paused`).
- **Cleanup:** cancels both frames, clears timers, removes listeners and the scene.
- **Dependencies:** none (does not use `Rand` or `Animals`).
- **Why rAF:** the transition and all motion are JavaScript-driven so they survive the global reduced-motion CSS rule.

## 15. Responsive layout and coordinate system

The scene is full-viewport. Most elements use percent or `vw`/`vmin` units: clouds translate in `vw`, star and flyer positions are percent (stars within the top 60 % of the screen), the sun/moon sits at 42 % height and scales with `vmin`. Birds are positioned in pixels per frame from the scene's client size. The bird lane calculation reserves the sun/moon box (same size formula, centred at 42 % height) so birds fly above or below it. There is no fixed aspect ratio.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Resize / rotation | Positions are recomputed from the current size each frame (birds) or are percent-based |
| Backgrounding | Both loops stop; the transition resumes with its progress kept |
| Rapid taps | Taps during a transition are ignored; clouds capped at 7 |
| Tap on the sun and moon at the same time | Not possible (one button) |
| Leaving mid-transition | Frames and timers cancelled |
| No room for bird lanes | Falls back to the top margin (birds may overlap the sun/moon in tiny viewports; requires verification) |
| Touch cancellation | `pointerdown` is used, so nothing is left pending |

## 17. Testing

No automated tests exist (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#135](https://github.com/BielinskiLukasz/child-page/pull/135) reports `node --check` and a numeric check of the bird lane geometry for 4 portrait and landscape sizes (0 overlaps with the sun/moon box) and notes that no browser was available, so a visual check on a device was recommended.

Manual scenarios (all unchecked):

- [ ] Normal: tap the sun; the sky darkens over about 3.5 s, stars appear, the sun becomes a moon; tap the moon; day returns.
- [ ] Taps on the sun/moon and sky during the transition are ignored; bird taps still loop.
- [ ] Sky tap by day and at night adds a cloud that drifts across and leaves.
- [ ] Birds: 2-3 appear after day is reached; none overlap the sun; touching one makes a slow loop; they vanish when night begins.
- [ ] Night: wait 20-45 s after night is reached; a satellite or plane crosses; the plane's red pulse is calm.
- [ ] Wait 60 s: new stars appear one by one and grow.
- [ ] Restart: reopen; scene starts as day, the flock size varies between launches.
- [ ] Progression: none expected.
- [ ] Portrait and landscape (320x568, 360x640, 640x360, 1024x768): sun/moon centred, birds avoid it, nothing is cut off.
- [ ] Touch, mouse; keyboard (Tab to sun/moon and birds, Enter/Space).
- [ ] Background/foreground during the transition; it resumes smoothly.
- [ ] Reduced motion: transition about 1.2 s, clouds static, sky tap creates a static cloud that disappears after 6 s, birds still fly.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- The flock was reduced from 7-9 to 2-3 birds (fixed on `main`: item 3 of issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167), PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173)); no flock-size limitation remains.
- Sky taps cannot add clouds by keyboard.
- Initial stars use no centring transform whereas added stars do (a sub-pixel inconsistency).
- The sun/moon button has no pressed state for assistive technology.
- Uses `Math.random` instead of the shared helper; no repeat avoidance.

**Requires verification**

- Bird lanes in very short landscape viewports (see section 7).
- Performance with up to 7 clouds, 3 birds and 160 stars on slow devices.

## 19. Planned improvements

None currently planned (the smaller flock from issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167), item 3, is done, see section 21).

## 20. Related activities and reusable components

- Similar: [Nocne Niebo](nocne-niebo.md), [Dobranoc](dobranoc.md), [Magiczny Ogród](magiczny-ogrod.md) (day/night weather), [Deszczyk i Tęcza](deszczyk-i-tecza.md).
- Pattern: a single rAF loop that writes a CSS custom property (`--p`) so motion survives the reduced-motion rule.
- Does not use [`js/random.js`](../../js/random.js) or [`js/animals.js`](../../js/animals.js).

## 21. Change history

- Issue [#6](https://github.com/BielinskiLukasz/child-page/issues/6) / PR [#13](https://github.com/BielinskiLukasz/child-page/pull/13): initial activity; keyboard activation of the sun/moon added after review.
- Issue [#21](https://github.com/BielinskiLukasz/child-page/issues/21): app review polish.
- Human requests on the PR: slowly growing stars, removed Big Dipper constellation, occasional satellite and plane.
- Issue [#111](https://github.com/BielinskiLukasz/child-page/issues/111) / PR [#135](https://github.com/BielinskiLukasz/child-page/pull/135): grey plane with red pulse, steady satellite, daytime bird flock.
- Issue [#167](https://github.com/BielinskiLukasz/child-page/issues/167) / PR [#173](https://github.com/BielinskiLukasz/child-page/pull/173): daytime flock reduced from 7-9 to 2-3 birds.

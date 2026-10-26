# Bańki Mydlane

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour); this document only records what is specific to this activity.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Bańki Mydlane |
| Activity ID | `banki` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Touching the screen blows a big soft bubble that floats up; touching a bubble splits it into smaller ones; dragging leaves a trail of small bubbles. |
| Category | Cause and effect; open-ended play |
| Interaction type | Tap and drag (touch, mouse, stylus) |
| Status | Implemented; enabled in the menu by default |
| Source | [`js/banki.js`](../../js/banki.js), styles with prefix `bm-` in [`css/style.css`](../../css/style.css), script tag in [`index.html`](../../index.html) |

## 2. Business purpose

- Gives the child an immediate, forgiving reaction to any touch anywhere on the screen: there are no targets to miss.
- Provides a calm "pop-free" bubble toy: bubbles never burst loudly or disappear abruptly; they split or fade.
- Complements [Magiczny Ogród](magiczny-ogrod.md) and [Malowanie Światłem](malowanie-swiatlem.md) as free, open-ended touch play.
- Described in the README Activities list as item 8.

## 3. Activity flow

1. The child opens the tile; the scene is built and the animation loop starts.
2. Initially displayed: one of six painted gradient backgrounds and **5 small bubbles** already floating at random positions.
3. Interactions: tap empty space (blow a big bubble), tap a bubble (split it), press and drag (small bubbles along the path).
4. The bubble fades in over 0.8 s and drifts upwards with a gentle sideways sway.
5. There is no completion state.
6. Bubbles keep fading out at the top; the child can blow more at any time.
7. Restart: leave and re-open the activity (a new background is chosen).
8. Exit: Back button or browser Back; the cleanup function stops the loop and removes the scene.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Blow | `pointerdown` on empty space creates a bubble with radius 46 to 62 (diameter 92 to 124 px) at the touch point, rising at 14 to 24 px/s. |
| Hit test | A bubble counts as touched when the distance to its centre is under `r + 8`; the nearest non-fading bubble wins. Bubbles themselves have `pointer-events: none`; all input goes to the scene. |
| Split | A touched bubble with `r > MIN_R * 1.2` (16.8) splits into 2 or 3 (50 % each); child radius is `0.66 * r` for 2 and `0.58 * r` for 3. Children get a small push (14 px/s) in different directions. The parent fades out over 1.6 s with a short 8 % scale pulse (`SPLIT_MS = 700`). |
| Small bubbles | Children with radius under 16.8 live 4 to 7 s and then fade. Touching a bubble that is already that small makes it fade away gently instead of splitting. |
| Drag trail | While the pointer is down, at most one small bubble (radius 14 to 22, rising 15.4 to 26.4 px/s) per 260 ms, only if the pointer is not on an existing bubble. |
| Motion | Each bubble: sideways sway amplitude 6 to 16 and sway speed 0.25 to 0.5 rad/s; rise speed capped at 26 px/s; a soft push back from the left/right edges. |
| Population limit | `MAX = 25` visible (non-fading) bubbles: when exceeded, the oldest fades out. A hard DOM bound of `MAX + 8` accelerates bubbles that are already fading. |
| Keep-out zones | A bubble that reaches the top (`y < r + 4`) or enters the area around the Back button or the playtime hourglass (measured from the DOM, plus 12 px padding) starts fading out. |
| Tint | Each bubble gets one of 5 RGB tints at random. |
| Sound | None. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect between touch and visible result.
- Calm visual tracking of slowly moving objects.
- Fine-motor practice of tapping and dragging.

**Directly observable behavior**

- Any touch gives a reaction; nothing can fail.
- Bubbles split or fade; they never burst abruptly.

**Requires professional or research-based validation**

- Any developmental or calming effect. Nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events with pointer capture on the scene (touch, mouse, stylus). **There is no keyboard alternative**; the scene is a single `role="img"` element labelled "Bańki mydlane unoszące się w powietrzu".
- **Targets:** the whole screen is the target; split bubbles can be small (down to about 19 px diameter), but a miss simply blows a new big bubble.
- **Orientation:** the scene fills the viewport; background gradients are pure CSS and fill any portrait or landscape size without stretching.
- **Colour/contrast:** all six backgrounds use mid/deep tones so the pale bubbles with a white highlight stay visible.
- **Reduced motion:** the movement is driven by the `requestAnimationFrame` loop, not CSS animations, so it is still present under the global `prefers-reduced-motion` rule. (There is no reduced-intensity variant.)
- **Touch:** `touch-action: none`, `user-select: none`; `pointerdown` calls `preventDefault`.
- **Reading:** not required; a young child can use it independently.

## 7. Risks and limitations

- Continuous slow motion of many bubbles; bubbles blown by rapid tapping can number up to 25 visible at a time.
- Rapid drag can create many small bubbles (limited to one per 260 ms).
- No end state; relies on the global playtime limit.
- No keyboard access (see section 6).
- No personal data is stored or sent.

## 8. Configuration

There is no external configuration; the constants at the top of [`js/banki.js`](../../js/banki.js) can only be changed in code.

| Constant | Purpose | Value |
|---|---|---|
| `MAX` | Maximum visible bubbles and pool size | 25 |
| `MIN_R` | Smallest trail bubble radius; threshold for "small" is `MIN_R * 1.2` | 14 |
| `BIG_R` | Radius range of a tapped bubble | 46 to 62 |
| `FADE_IN`, `FADE_OUT` | Fade durations | 0.8 s, 1.6 s |
| `SPLIT_MS` | Parent split pulse | 700 ms |
| `GUARD_PAD` | Padding around keep-out zones | 12 px |
| `BACKS` | Six background CSS gradients (sunny hills, dusk, beach sea, starry night, sunrise meadow, underwater) | array |
| `TINTS` | Five bubble RGB tints | array |

Fallbacks: if the Back button or hourglass element is missing, that keep-out zone is skipped.

## 9. Assets

No external asset files. Backgrounds are CSS gradients set inline; bubbles are CSS-styled `div`s (radial gradients, inset shadows) defined by `.bm-b` in `css/style.css`. No images, fonts or audio.

## 10. Randomization and variants

- **Background:** one of 6 chosen with `Rand.pickOne(BACKS, 'banki-bg')` ([`js/random.js`](../../js/random.js)), which never returns the same background as the previous launch within the same page session; not stored across reloads.
- **Bubbles:** radius, rise speed, sway phase/amplitude/speed, tint, and the number of children (2 or 3, 50 % each) are random per bubble (`Math.random`).
- **Initial bubbles:** 5, with random position (x 10 to 90 %, y 25 to 90 %), radius 16 to 30, rise 10 to 18 px/s.
- No weighted selection; no handling of an empty pool is needed (fixed arrays).

## 11. Progression and difficulty

None. There are no levels or persistence.

## 12. Completion and feedback

No completion state, no failure. Feedback is the bubble motion itself: fade-in, a small scale pulse when splitting, fade-out when small, at the top or in a keep-out zone. No sound; no automatic next round.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events** (see [Analytics status](README.md#analytics-status)); usage metrics are only proposed in open PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172).

| Event | Emitted today |
|---|---|
| `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete` | No (none are implemented) |

All metrics (starts, active time, average active time per start, completions, completion rate, replays, exit-before-completion, highest level, interactions) are **not supported**.

*Not implemented, for planning only:* as an open-ended activity, meaningful measures would be active time and interactions (blow, split, trail). No completion rate or level applies. No personally identifiable information would be needed.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/banki.js`](../../js/banki.js); returns `cleanup`, which sets a `dead` flag, cancels the frame, removes listeners and removes the scene.
- **Rendering:** DOM. Each bubble is a pooled `div.bm-b` positioned with `transform: translate(...) scale(...)` and `opacity`; `pool` recycles up to `MAX` removed elements.
- **State:** `bubbles[]` objects (`x`, `y`, `r`, `vy`, `vx`, phase, age, `fading`, `fade`, `split`, optional `life`).
- **Loop:** one `requestAnimationFrame` loop `tick()` with `dt` capped at 0.1 s; stopped on `visibilitychange` when hidden and restarted when visible.
- **Events:** `pointerdown`, `pointermove`, `pointerup`, `pointercancel` on the scene; `resize`, `orientationchange` (only re-measure the scene size); `visibilitychange`.
- **Keep-out zones:** `guards()` measures `.back` and `.hourglass` each frame with `getBoundingClientRect`.
- **Shared code:** `window.Rand.pickOne` for the background. No persistence, no analytics.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0` and uses CSS pixels relative to the scene; the origin is the top-left corner.
- `W` and `H` are the scene's client size and are re-read on resize and orientation change. Bubbles are not repositioned on resize; the soft push back from the edges (`W - r`) brings them back inside the new width.
- Backgrounds are gradients (no aspect-ratio dependency).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Rapid tapping | Population bounded (25 visible, hard DOM bound 33); oldest bubbles fade first. |
| Tab hidden | Loop stopped; resumes on return (`dt` is capped at 0.1 s so there is no catch-up). |
| Touch cancel | `pointercancel` clears the `down` flag. |
| Pointer capture unsupported | The `setPointerCapture` call is wrapped in `try/catch`. |
| Resize / orientation | Only `W` and `H` are updated (see section 15). |
| Back button / hourglass missing | Zone skipped. |
| Leaving mid-animation | `cleanup` stops everything. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Normal: open the activity; the 5 small bubbles are visible and float up; tap empty space; a big bubble appears and floats up.
- [ ] Split: tap a big bubble; it splits into 2 or 3 smaller ones; tap a medium child to split again; tap a very small bubble; it fades.
- [ ] Drag: press and drag slowly and quickly; small bubbles appear at a gentle rate and not over existing bubbles.
- [ ] Bubbles reaching the top fade out instead of disappearing abruptly; bubbles near the Back button or hourglass fade out.
- [ ] Incorrect interaction: not applicable (every touch is valid); check taps near screen edges.
- [ ] Rapid tapping for 30 s: the number of bubbles stays bounded and the frame rate remains smooth.
- [ ] Restart/randomization: re-open the activity 10 times; the background changes each time and never repeats twice in a row.
- [ ] Progression: confirm there is none.
- [ ] Portrait and landscape; rotate while bubbles are on screen; bubbles are not stuck outside the screen.
- [ ] Touch (Chrome Android, Safari iPhone/iPad) and mouse (desktop): both work; no scrolling or zoom gestures interfere.
- [ ] Keyboard: confirm that there is no keyboard interaction (known limitation).
- [ ] Background/foreground: switch tab and return; bubbles continue without jumping.
- [ ] Reduced motion: bubbles still move.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

PR [#40](https://github.com/BielinskiLukasz/child-page/pull/40) reports a Node run against a DOM stub (400 rapid taps keep the DOM bounded, all bubbles are removed after fading, cleanup empties the scene) and lists manual device tests as pending. PR [#139](https://github.com/BielinskiLukasz/child-page/pull/139) reports that 200 picks in Node reached all 6 backgrounds.

## 18. Known limitations and open issues

**Confirmed**

- No keyboard or assistive-technology interaction; the scene is a single image role.
- Bubbles are not repositioned on resize or orientation change.
- `dragged` is assigned but never read (dead variable).
- No automated tests.

**Requires verification**

- Overlap of the bubbles with the Back button and hourglass on devices with unusual safe areas (zones are measured at runtime, but device checks were pending in PR #40).
- Performance on slow devices with 25 bubbles (each has a box shadow and radial gradients).

## 19. Planned improvements

`None currently planned`.

## 20. Related activities and reusable components

- Open-ended touch play: [Magiczny Ogród](magiczny-ogrod.md), [Malowanie Światłem](malowanie-swiatlem.md), [Ogród Motyli](ogrod-motyli.md).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). The activity does not use `js/animals.js`.

## 21. Change history

- Issue [#31](https://github.com/BielinskiLukasz/child-page/issues/31) / PR [#40](https://github.com/BielinskiLukasz/child-page/pull/40): initial activity, including tiny bubbles fading on touch and keep-out zones measured from the Back button and hourglass.
- Issue [#114](https://github.com/BielinskiLukasz/child-page/issues/114) / PR [#139](https://github.com/BielinskiLukasz/child-page/pull/139): random background per launch (six scenes).

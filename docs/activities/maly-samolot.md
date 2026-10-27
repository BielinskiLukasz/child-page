# Mały Samolot

## 1. Overview

| Item | Value |
|---|---|
| Display name | Mały Samolot |
| Internal ID | `samolot` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A little propeller plane with an animal pilot on a runway among hills and clouds; touching the plane makes it take off and fly slowly, touching it again lands it. |
| Category | Cause and effect, open-ended play, observation |
| Interaction type | Tap (plane, clouds, pilot); keyboard: Enter/Space on the plane, native activation of cloud and pilot buttons |
| CSS prefix | `sa-` |
| Source | [`js/samolot.js`](../../js/samolot.js), styles in [`css/style.css`](../../css/style.css) (section `/* Mały Samolot */`) |
| Status | Implemented; enabled by default (no `defaultOff`). Listed 32nd in the README Activities list. |

## 2. Business purpose

The activity lets a child control a plane with single taps and watch a slow, smooth flight. It supports calm observation and simple cause and effect (tap, take off; tap, land) and adds small surprises (the plane circles a touched cloud, the pilot waves). Motion is deliberately slow (about 15 s to cross the screen) and the plane never moves backwards. Each launch looks different through random plane colour, airport, weather and pilot, which keeps the activity fresh without any score or goal.

## 3. Activity flow

1. The child opens the activity (`#samolot`). The scene is built with a random plane colour, airport, weather and pilot (section 10).
2. The plane is parked on the runway at 30% of the screen width; three clouds drift slowly in the sky.
3. **Tap the parked plane:** it takes off and flies a slow loop (an ellipse) around the sky.
4. **Tap the flying plane:** it descends and lands on the runway in about 4 s.
5. **Tap the plane while it is landing:** a go-around; it climbs again.
6. **Tap a cloud while flying:** the plane curves toward it, circles it once and returns to its loop. **Tap a cloud while parked:** the cloud just drifts a little to the side (2.6 s).
7. **Tap the pilot:** the pilot waves a paw for 2.4 s (does not toggle the plane).
8. There is no completion state; the activity runs until the child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (constant) |
|---|---|
| Crossing time at cruise | `CROSS_S = 15` s per screen width (cruise speed `sc = W / 15` px/s) |
| Landing time | `LAND_S = 4` s (cubic Hermite curve from the current position and velocity to the runway) |
| Flight path | ellipse centred at (W/2, 0.4H), radii `rx = 0.34W` (landscape) or `0.3W` (portrait), `ry = 0.22H`; the plane follows a look-ahead point on it |
| Direction | the plane never flies backwards: its heading is rate-limited and smoothed; take-off direction follows the way the plane is facing |
| Turn rate limit | `Om = sc / Rt`, where `Rt = max(min(W, H) * 0.12, pw * 0.3, sc / 0.7)` |
| Cloud orbit | radius `R = 1.15 * Rt`; ends after one full sweep (`2 pi`) or after 40 s; the last tapped cloud wins |
| Landing direction | lands in the current direction; if there is little room ahead it turns around and lands the other way |
| Soft trail | at most `MAX_PUFFS = 8` puffs, one every `PUFF_EVERY = 0.55` s, life `PUFF_S = 2.6` s, only when the plane is moving faster than 0.3 x cruise |
| Pilot wave | `WAVE_S = 2.4` s |
| Cloud nudge (tap while parked) | `NUDGE_S = 2.6` s, displacement up to `min(W * 0.03, 26)` px |
| Propeller | spin eases with speed (up to about 1.1 revolutions per second), blur disc opacity up to 0.28 |
| Weather | decoration only: sunny (nothing extra), cloudy (greyer sky and clouds), rain (`RAIN_N = 26` drops), snow (`SNOW_N = 22` flakes); drawn in a non-interactive layer below the clouds and plane |

The plane is a kinematic body (position, heading, speed) and is flipped vertically (`scale(1, sy)`) when it flies left so it is never shown upside down.

## 5. Educational and developmental benefits

**Intended design benefits** (not measured)

- Cause and effect: one tap changes what the plane does.
- Calm visual tracking of a slowly moving object.
- Imaginative play (animal pilot, weather, airports).

**Directly observable behavior**

- Different taps have distinct, gentle consequences (take off, land, circle a cloud, wave).
- Random scenery changes between launches without changing the controls.

**Requires professional or research-based validation**

- Any developmental effect of watching or steering the plane.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus (the plane, clouds and pilot react on `pointerdown`, so the response is immediate); keyboard: the plane is focusable (`tabindex="0"`, `role="button"`, `aria-label` `Samolot – wzlatuj lub ląduj`) and Enter/Space toggles it; the clouds (`Chmurka 1 – samolot poleci wokół niej` and so on) and the pilot (`<animal> pilot – pomachaj`) are real buttons. The scene is a `role="group"` with the label `Mały samolot`.
- **Target size:** the plane box is `pw x ph` with `pw = clamp(min(W * 0.42, H * 0.5), 170, 320)` and `ph = pw / 2`; clouds are `clamp(W * 0.2, 96, 190)` px wide (at least 96 x 56); the pilot button is at least 56 x 56 px.
- **Orientation:** layout and the flight ellipse are recomputed on `resize` and `orientationchange`; the flight state is rescaled.
- **Colour:** controls do not depend on colour; the plane colour and weather are decoration.
- **Sound:** none. **Reading:** not required.
- **Reduced motion:** the flight, propeller, trail, wave and cloud drift are driven by one `requestAnimationFrame` loop and the code contains no `prefers-reduced-motion` check, so **they continue under reduced motion**. Only the CSS rain/snow animation (`sa-fall`) is disabled by the global rule; the drops and flakes then stay at their random start positions. Motion is slow by design (about 15 s per screen crossing).
- **Touch behaviour:** `.sa` has `touch-action: none`; text selection disabled.
- **Focus:** 4 px outline `#8f7fd1` on the plane, clouds and pilot button.
- **Limitations:** a parked plane partly overlapping a cloud button hides that cloud from touch (the plane has a higher z-index); the flashing-like propeller effect is described in section 7.

## 7. Risks and limitations

- The propeller blur oscillates (`scaleY` follows `|cos|` of the angle) at up to roughly 2.2 cycles per second at full speed (a figure computed from the code, not measured); `Requires verification` against accessibility guidance on flashing.
- The animation loop never stops while the activity is open (even when the plane is parked, the clouds drift), which uses CPU/battery for as long as it is open (it is paused while the tab is hidden).
- Weather particles (rain 26, snow 22) fall continuously and are the only part of the motion that respects reduced motion.
- The activity has no ending; a child may fly indefinitely.
- No personal data is collected; nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/samolot.js`](../../js/samolot.js):

| Name | Purpose | Type | Default |
|---|---|---|---|
| `CROSS_S` | Seconds to cross the screen width at cruise | s | `15` |
| `LAND_S` | Landing duration | s | `4` |
| `MAX_DT` | Frame step cap | s | `0.05` |
| `MAX_PUFFS`, `PUFF_S`, `PUFF_EVERY` | Trail size, life and interval | number, s, s | `8`, `2.6`, `0.55` |
| `WAVE_S`, `NUDGE_S` | Pilot wave and cloud nudge | s | `2.4`, `2.6` |
| `PLANES`, `AIRPORTS`, `WEATHERS`, `PILOTS` | Content pools | arrays | 6, 3, 4, 6 entries |
| `RAIN_N`, `SNOW_N` | Weather particle counts | number | `26`, `22` |
| `CF` | Cloud centres as screen fractions | array | `[0.2,0.3] [0.5,0.27] [0.8,0.35]` |

No fallback because nothing is read from outside.

## 9. Assets

No external asset files; everything is inline SVG and CSS built in JavaScript: the plane (`planeSvg`, 200 x 100 viewBox) with the pilot head, clouds (`cloudSvg`, 160 x 90), hills (`hillsSvg`, 1000 x 200, `preserveAspectRatio="none"`), airport buildings (tower, hangar, terminal, 120 x 100), CSS sun, runway, ground and weather particles. The pilots are drawn locally in this file; they do not use the shared `Animals` family. The menu icon is inline SVG in `js/activities.js`. No unused assets.

## 10. Randomization and variants

Chosen once per launch, independently, with `Rand.pickOne` (never the same value as the previous pick for the same key within the page session):

| Pool | Key | Size | Values |
|---|---|---|---|
| Plane colours | `samolot-plane` | 6 | pink, mint, yellow, lilac, orange, blue (body, wing and tail colours) |
| Airports | `samolot-airport` | 3 | tower, hangar, terminal (each with its own runway, ground and hill colours) |
| Weather | `samolot-weather` | 4 | sunny, cloudy, rain, snow |
| Pilots | `samolot-pilot` | 6 | Miś, Zajączek, Kotek, Piesek, Myszka, Lisek |

That gives 432 combinations. The scene does not change while the activity is open. Rain and snow particles get random positions, delays and durations at build time. Nothing is persisted.

## 11. Progression and difficulty

None. There are no levels and nothing is stored.

## 12. Completion and feedback

No formal completion state. Feedback is the plane's motion (take off, landing, circling), propeller spin, trail, cloud nudge and pilot wave. No score, sound or failure feedback. The interaction cycle is: tap -> plane responds -> keep flying or park.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/samolot.js`](../../js/samolot.js), registered on the `samolot` entry; returns a cleanup function. The activity does not set `container.style.display`; the `.sa` scene is `position: fixed; inset: 0`.
- **State:** plane state `st` (`parked`, `flying`, `landing`), position `x, y`, heading `psi`, speed `spd`, turn rate `om`, facing `face`, vertical flip `sy`, `orbit`, `land` (Hermite plan), `propA`/`propW`, `puffs`, `waveT`, `cloudNudge[3]`, `clock`.
- **Rendering:** a DOM scene (sun, hills SVG, weather layer, ground, airport SVG, runway, three cloud buttons, trail layer, plane `div` with an inline SVG and the pilot button). Plane and clouds are moved with `transform`; the propeller and the paw are animated through SVG `transform` attributes.
- **Animation:** one `requestAnimationFrame` loop (`frame`, `dt` capped at 50 ms). It keeps requesting frames while the tab is visible (no idle stop), and is cancelled when `document.hidden` and restarted on return. The `sa-fall` CSS keyframe animation is used only for weather particles.
- **Events:** `pointerdown` (and `click` with `detail === 0` for keyboard) for the plane, clouds and pilot via `bindTap`; pilot and clouds stop propagation so they do not toggle the plane; `keydown` (Enter/Space) on the plane; `resize`/`orientationchange`/`visibilitychange`.
- **Randomization:** `Rand.pickOne` ([`js/random.js`](../../js/random.js)); particle positions with `Math.random`.
- **Persistence/analytics:** none.
- **Cleanup:** cancels the frame, removes all tap listeners (collected in `offs`), keydown, window and document listeners, removes remaining puffs and the scene.

## 15. Responsive layout and coordinate system

- The scene covers the whole screen (`position: fixed; inset: 0`, not inset below the Back button). Coordinates are CSS pixels in the scene (`W = clientWidth`, `H = clientHeight`).
- Static layers use percentages and CSS variables: runway at `--ry = 0.86 H`, plane parked at `yC = runY - ph * 0.43`, airport on the right (`right: 4%`, width `clamp(70px, 16vw, 130px)`), sun at the top right, hills in the bottom 50%.
- Moving elements (plane, clouds, trail) are positioned with `transform: translate` in the same pixel space; on resize the plane position is scaled by the new/old size ratio and an ongoing landing plan is rescaled.
- Cloud positions are screen fractions (`CF`) with a small sinusoidal drift (up to `min(W * 0.012, 10)` px horizontally and 4 px vertically) and are kept at least `R + 10` px from the top.
- Plane, cloud and runway sizes derive from `W` and `H`, so portrait and landscape work; no fixed viewBox is shared between layers (each SVG has its own viewBox).

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable. |
| Rapid taps on the plane | Each tap changes state (parked, flying, landing, go-around); no lock. |
| Tap during landing | Go-around: the plane resumes flying from its current velocity. |
| Cloud tapped while parked or landing | The cloud nudges aside (2.6 s); the plane is not affected. |
| Little room to land ahead | The plane turns around and lands the other way. |
| Resize/orientation change | State is rescaled (`layout`). |
| Tab hidden | The loop is cancelled; on return `last` is reset and `dt` is capped, so there is no jump. |
| Unsupported `matchMedia` | Not used. |
| Leaving mid-flight | Cleanup removes listeners, puffs and the scene. |
| Touch cancellation | Not relevant (taps act on `pointerdown`). |

## 17. Testing

**Automated tests:** none (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#102](https://github.com/BielinskiLukasz/child-page/pull/102) reports `node --check` and a stubbed-DOM simulation (take-off, 60 s loop, cloud orbit, landings at varied phases, relanding, cleanup) with no jumps and landings ending parked; PR [#151](https://github.com/BielinskiLukasz/child-page/pull/151) describes the random scenery. These are not re-verified here.

**Manual scenarios (not yet recorded as performed):**

- [ ] Normal: tap the parked plane to take off, watch a full loop, tap to land (about 4 s).
- [ ] Go-around: tap the plane while landing; it climbs again.
- [ ] Clouds: tap each cloud while flying (plane circles once and resumes) and while parked (cloud drifts aside); tap a second cloud mid-orbit.
- [ ] Pilot: tap the pilot while flying and parked; the paw waves for about 2.4 s and the plane state does not change.
- [ ] Incorrect interaction: tap the sky, the runway and the airport; nothing happens or breaks.
- [ ] Restart/randomization: re-open the activity about 10 times and check that plane colour, airport, weather and pilot vary and none repeats twice in a row.
- [ ] Progression/completion: confirm there is no end state or level.
- [ ] Portrait and landscape: 320 x 568, 568 x 320, tablet; rotate while flying and while landing; the plane stays on screen.
- [ ] Touch and mouse: finger, mouse, keyboard (Tab to the plane, Enter/Space; Tab to clouds and pilot).
- [ ] Weather: observe rain and snow scenes for a minute and confirm the particles stay behind clouds and plane.
- [ ] Background/foreground: hide the tab mid-flight and return.
- [ ] Reduced motion: confirm that the flight still runs and the rain/snow stops falling.
- [ ] Performance: leave the activity open for several minutes on a low-end device.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- The frame loop never idles while the tab is visible.
- Flight and propeller motion are not reduced under `prefers-reduced-motion` (only rain and snow stop).
- The plane overlaps and hides a cloud button when they coincide.
- The pilots are drawn locally and are not the shared animal family.

**Requires verification**

- Propeller oscillation rate against flashing guidance (section 7).
- Behaviour of the landing curve on extreme aspect ratios.

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Other vehicle activities: [Mały Pociąg](maly-pociag.md), [Balon](balon.md), [Latawiec](latawiec.md).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). It does not use `js/animals.js`.

## 21. Change history

- [#90](https://github.com/BielinskiLukasz/child-page/issues/90) / PR [#102](https://github.com/BielinskiLukasz/child-page/pull/102): activity added (bear pilot, fixed scenery).
- [#127](https://github.com/BielinskiLukasz/child-page/issues/127) / PR [#151](https://github.com/BielinskiLukasz/child-page/pull/151): random plane colour, airport, weather and pilot animal.

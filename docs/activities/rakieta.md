# Rakieta

## 1. Overview

| Property | Value |
|---|---|
| Display name | Rakieta |
| Internal ID | `rakieta` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A small rocket with an animal astronaut drifts through a starry night sky with three smiling planets; the child can start or slow it, send it to a planet, make a star twinkle or the astronaut wave. |
| Category | Open-ended play, cause and effect, observation |
| Interaction type | Tap / click |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Rakieta is the "night sky" member of the vehicle group. It differs from the road and water vehicles in having a free two-dimensional flight path (a smooth loop around the screen) and a "visit" interaction: touching a planet makes the rocket curve over to it, hover next to it while the planet glows softly, and then carry on. Every launch looks different (astronaut, planet colours and the star/planet arrangement are randomised), which gives the activity variety without any goals or scoring.

## 3. Activity flow

1. The child opens the activity (`#rakieta`); `mount` picks the variant, builds the scene and starts one `requestAnimationFrame` loop.
2. The scene is a deep-blue sky with 15 stars, 3 planets with smiling faces and the rocket (with an astronaut in the round window) hovering at about 16 % of the width and 82 % of the height.
3. The child can touch the rocket, the astronaut in the window, a planet or a star.
4. Touching the rocket makes it fly along a loop (ellipse around the screen) or, if flying, slow to a hover in about 2 s. Touching a planet makes the rocket curve to a spot beside it, wait about 3 s while the planet's halo glows, and then return to what it was doing before (flying or hovering). Touching a star makes it twinkle once (2.4 s). Touching the astronaut makes a paw wave (2.4 s).
5. There is no formal completion state.
6. The loop of flying, hovering and visiting repeats for as long as the child plays.
7. A new random variant is drawn every time the activity is launched.
8. The child leaves with Back (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Cruise speed | `sc = W / CROSS_S`, `CROSS_S = 15` s to cross the width |
| Hover slow-down | `HOVER_TAU = 0.5` s time constant (about 2 s to stop); speed snaps to 0 below 1 % of cruise speed |
| Bob while hovering | `BOB_AMP = 4` px, `BOB_W = 1.9` rad/s (about one bob every 3.3 s); fades out as speed rises |
| Time beside a planet | `STAY_S = 3` s |
| Visit spring | `K = 0.8`, `C = 1.8` (about critical damping); speed cap `1.1·sc`; the approach pull vector is rotated by up to `±0.6` rad (curved approach); the visit is abandoned into the "stay" phase after 25 s at the latest |
| Flame puffs | at most `MAX_PUFFS = 8`, one every `PUFF_EVERY = 0.6` s, each lasting `PUFF_S = 2.6` s |
| Astronaut wave / star twinkle | `WAVE_S = 2.4` s, `TW_S = 2.4` s |
| Frame step cap | `MAX_DT = 0.05` s |
| Stars / planets | 15 stars and 3 planets per arrangement |

Details:

- **States:** `hover`, `fly`, `visit`. `onRocket` toggles hover and fly; during a visit it ends the visit and toggles the state that was stored as `prev`.
- **Flying** (`updateFly`): speed eases toward `sc`; the heading is steered toward a point on an ellipse centred on the screen (radii `W/2 - m`, `H/2 - m`) a fixed angle (0.6 rad) ahead of the rocket, with turn rate limited to `Om = sc / Rt`, where `Rt = max(0.09·min(W, H), 36)`. The rocket is clamped inside the screen with a margin `m = pw/2 + 6`.
- **Visit** (`updateVisit`): target spot is beside the planet (on the side facing the screen centre). A new planet touch during a visit retargets (the latest planet wins). The planet halo glow eases toward 1 only in the "stay" phase.
- **Displayed angle:** the nose follows the travel direction when moving and returns upright when hovering; the rocket mirrors vertically (`scale(1, sy)`) when travelling leftwards so the astronaut stays upright.
- **Reduced motion:** all motion is JS-driven; see section 6. **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touching objects in the sky leads to visible responses.
- Calm observation of slow, smooth flight.
- Choosing between several targets.

**Directly observable behavior:**

- The rocket takes about 2 s to slow down and needs about 15 s to cross the width.
- Planets glow softly when visited; stars twinkle once; the astronaut waves.
- The sky layout, planet colours and astronaut vary between launches.

**Requires professional or research-based validation:** any effect on attention, curiosity or vocabulary. Not currently documented.

## 6. Accessibility and usability

- **Input.** `pointerdown` (touch, mouse, stylus) and `click` with `event.detail === 0` for keyboard activation. The rocket, the astronaut, the planets and the stars are all real `<button>` elements with Polish `aria-label`s, so they can be reached with Tab and activated with Enter or Space. The star and planet handlers stop propagation so they never trigger the rocket.
- **Touch handling.** `.rq` uses `touch-action: none`; no drag gesture.
- **Target sizes.** Stars: 56 x 56 px hit boxes with a 24 px visible star. Planets: `pr = clamp(0.2·min(W, H), 64, 140)` px (minimum 56 px). Rocket: `pw = clamp(min(0.3·W, 0.4·H), 150, 260)` px wide (height `pw/2`). The astronaut button is 24 % x 48 % of the rocket with a 56 px minimum.
- **Orientation.** Layout recomputed on `resize`/`orientationchange`; positions are scaled by the new size and clamped.
- **Colour.** Planets differ in colour set, but only the arrangement matters for interaction; nothing depends on colour alone. The rocket is white against a dark sky (good contrast); the focus ring is `#fff4cf` 4 px.
- **Reduced motion.** Rocket, puffs, halos, twinkles and the wave are updated by the rAF loop via inline styles and SVG attributes; the global CSS rule does not stop them. The `.rq-star svg` rule sets `transition: none`. The motion is slow, but it is not reduced for users who asked for reduced motion.
- **Sound:** none. **Reading:** not required.
- **Limitations:** 15 star hit boxes of 56 px could still touch each other in some arrangements on small screens (two stars were moved to avoid overlap, see section 21); the astronaut button sits on top of the rocket button.

## 7. Risks and limitations

- **Accidental interactions:** a touch on the rocket body always toggles fly/hover, a touch on the window area triggers the wave instead; both are harmless.
- **Visual stimulation:** many small stars and a pulsing flame; there is no flashing, but the flame scale oscillates continuously (about 0.75 ± 0.15 plus speed-dependent growth).
- **Unclear ending:** none; the activity never ends.
- **Performance:** one always-running rAF loop; up to 8 puff elements created and removed over time (DOM churn is small).
- **Privacy:** nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/rakieta.js`](../../js/rakieta.js).

| Name | Purpose | Type | Default |
|---|---|---|---|
| `CROSS_S` | Seconds to cross the width at cruise speed | number | 15 |
| `HOVER_TAU` | Slow-down time constant (s) | number | 0.5 |
| `BOB_AMP`, `BOB_W` | Hover bob amplitude (px) and angular speed | number | 4, 1.9 |
| `STAY_S` | Time beside a planet (s) | number | 3 |
| `MAX_DT` | Frame step cap (s) | number | 0.05 |
| `MAX_PUFFS`, `PUFF_S`, `PUFF_EVERY` | Flame puff pool, lifetime, interval | number | 8, 2.6, 0.6 |
| `WAVE_S`, `TW_S` | Wave and twinkle durations (s) | number | 2.4, 2.4 |
| `K`, `C` | Visit spring stiffness and damping | number | 0.8, 1.8 |
| `LAYOUTS` | Star and planet positions per arrangement (fractions of the sky) | array of 4 | 4 entries (15 stars + 3 planets) |
| `PCOLS` | Planet colour sets | array of 6 | 6 entries (3 body/crater colour pairs each) |
| `ASTROS` | Astronaut variants | array of 6 | 6 entries |

No fallback handling exists because there is no external input.

## 9. Assets

No external asset files. The rocket, astronaut, star and planets are inline SVG strings in the JS file (`rocketSvg`, `astroSvg`, `starSvg`, `planetSvg`); the sky, halo and puffs are CSS (`.rq-*` rules in [`css/style.css`](../../css/style.css)). The astronauts are drawn locally and do not use `js/animals.js`. No audio, fonts or data files. No unused assets found.

## 10. Randomization and variants

Three independent picks are made on every `mount`, each with `Rand.pickOne` and its own key (so the last-pick memory is separate for each):

| What | Pool | Key |
|---|---|---|
| Star and planet arrangement | 4 layouts (`LAYOUTS`) | `rakieta-layout` |
| Planet colour set | 6 sets (`PCOLS`) | `rakieta-colours` |
| Astronaut | 6 drawings (`ASTROS`: round-eared, long-eared, pointy-eared, floppy-eared, frog-like, panda-like) | `rakieta-astro` |

- `pickOne` never returns the same item as the previous call for the same key within the page session (pools of 2 or more), so consecutive launches always differ in each of the three picks.
- Nothing is persisted; the memory is lost on reload.
- All 6 x 4 x 6 combinations are possible; no combination is excluded.

## 11. Progression and difficulty

None. There are no levels or difficulty changes and nothing persists between sessions.

## 12. Completion and feedback

No formal completion state. Feedback is visual only: the flame grows with speed, the rocket bobs when hovering, the visited planet's halo fades in over about 1 s and out again, the touched star scales up to 1.7x and brightens, the astronaut's paw waves. No sound, no scoring, no automatic restart because nothing ends.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/rakieta.js`](../../js/rakieta.js), assigned to the `rakieta` registry entry; lazy-loaded via `src`/`deps` on its registry entry in js/activities.js. Uses `js/random.js` (`Rand.pickOne`) and the `.rq-*` CSS.
- **Rendering:** DOM + inline SVG. Stars, planets and rocket are absolutely positioned elements; the rocket is moved by an inline `transform` (translate, rotate, scale).
- **State:** closure variables: `st` (`hover`/`fly`/`visit`), `prev`, `x`, `y`, `hd` (heading), `spd`, `om` (turn rate), `ang`, `sy`, `face`, `vs` (visit state), `puffs`, `twT[]`, `glow[]`, `waveT`.
- **Animation:** one rAF loop `frame` with a capped dt; paused while the tab is hidden and resumed on `visibilitychange`.
- **Events:** `bindTap()` wires `pointerdown` and keyboard `click`; resize/orientation call `layout()`.
- **Cleanup:** cancels the rAF, removes listeners, puffs and the scene.
- **Persistence/config/analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; `W`/`H` come from `clientWidth`/`clientHeight`.
- **Units:** CSS pixels for the rocket (`x`, `y` are its centre); stars and planets are positioned as fractions of the sky (`STARS[k][0]·W`, `STARS[k][1]·H`). Both share the same pixel space.
- **Sizing:** rocket width `pw` 150 to 260 px, planet diameter `pr` 64 to 140 px, margin `m = pw/2 + 6` keeps the rocket fully visible.
- **Resize/rotation:** `layout()` scales `x`, `y` (and the visit velocity) by the new/old size ratios and clamps them, so the rocket is never lost.
- **Arrangement design:** the layouts were hand-checked to keep stars clear of planets; the arrangement is fractional, so star spacing in pixels varies with the viewport.
- Tested sizes: Not currently documented.

## 16. Error and edge-case handling

- **Backgrounding:** the loop pauses while hidden; `last` is reset on resume, so there is no jump.
- **Resize during a visit:** the visit state is kept and scaled.
- **Rapid input:** a new planet touch retargets the visit; a rocket touch ends the visit; repeated star or astronaut touches while an animation is running are ignored.
- **Visit that cannot finish:** after 25 s without arriving the rocket switches to the "stay" phase anyway.
- **Edge clamping:** the rocket is clamped to the visible area every frame.
- **Unhandled:** no fallback without `requestAnimationFrame` or `window.Rand`.

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#105](https://github.com/BielinskiLukasz/child-page/pull/105) reports `node --check` and a stub-DOM simulation in node (hover at start, 60 s of flight stays inside the visible box, planet visit with glow rise and fade, rocket tap mid-trip, puff pool bounded) and asks for a visual device check in portrait and landscape.

Manual checklist (not yet performed):

- [ ] Normal: open Rakieta; the rocket hovers and bobs; touch it and it starts flying along a loop; it crosses the width in about 15 s and never leaves the screen.
- [ ] Touch the flying rocket; it slows to a hover in about 2 s.
- [ ] Touch each of the three planets from hover and from flight; the rocket curves to a spot beside the planet, the halo glows for about 3 s and the rocket then resumes.
- [ ] Touch another planet during a visit; the rocket retargets. Touch the rocket during a visit; the visit ends.
- [ ] Touch several stars (one twinkle each) and the astronaut (a wave).
- [ ] Incorrect interaction: touch empty sky; nothing happens.
- [ ] Completion: confirm there is no completion state.
- [ ] Restart/randomization: leave and re-enter 10 times; astronaut, planet colours and arrangement change on every launch; none repeats twice in a row in the same pick.
- [ ] Progression: confirm nothing persists after reload.
- [ ] Portrait and landscape: rotate during flight and during a visit; the rocket and planets stay on screen and no star overlaps a planet.
- [ ] Touch, mouse and keyboard (Tab through the 15 stars, 3 planets, rocket and astronaut).
- [ ] Background the tab during flight; return with no jump.
- [ ] Reduced motion enabled: flight, glow and twinkles still run.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- The motion ignores the reduced-motion preference by design.
- The astronaut is not drawn from `js/animals.js` (a separate local set of 6), so there are two animal systems in the code base.

**Requires verification**

- Whether any two of the 15 stars (56 px hit boxes) or a star and a planet overlap on very small or very narrow screens (a layout fix was made in PR [#154](https://github.com/BielinskiLukasz/child-page/pull/154)).
- Frame rate on slow devices.

No open issue specifically concerns Rakieta; the metrics (#164), visual fixes (#167) and documentation (#168) issues are all merged or in review.

## 19. Planned improvements

None currently planned for this activity.

## 20. Related activities and reusable components

- Similar: [Traktor](traktor.md), [Autobusik](autobusik.md), [Mała Łódka](mala-lodka.md), [Łódź Podwodna](lodz-podwodna.md), [Kolejka Linowa](kolejka-linowa.md), [Balon](balon.md). The night-sky feel is close to the star activities (see the project README).
- Shared helper used: [`js/random.js`](../../js/random.js) (`Rand.pickOne`). `js/animals.js` is not used.
- Shared pattern: rAF loop with capped dt and a damped spring for smooth redirection.

## 21. Change history

- [#93](https://github.com/BielinskiLukasz/child-page/issues/93) / PR [#105](https://github.com/BielinskiLukasz/child-page/pull/105): Rakieta activity added.
- Commit `3fb06b0`: the rocket uses a real `<button>` instead of a nested `role="button"` (review suggestion on #105).
- PR [#154](https://github.com/BielinskiLukasz/child-page/pull/154): random astronaut, planet colours and sky arrangements (a follow-up commit nudged two stars so 56 px hit boxes no longer overlap).
- PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): animal-pool batch listed in the search results for this activity.

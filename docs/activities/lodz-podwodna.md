# Łódź Podwodna

## 1. Overview

| Property | Value |
|---|---|
| Display name | Łódź Podwodna |
| Internal ID | `podwodna` (entry in [`js/activities.js`](../../js/activities.js)); source file `js/podwodna.js`, CSS prefix `pd-` |
| Description | A yellow submarine with a bear in its round window hovers in a pastel sea among four slow fish, three clumps of seaweed and rising bubbles. |
| Category | Open-ended play, cause and effect, observation |
| Interaction type | Tap / click (real buttons; the sand also uses the touch position) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Łódź Podwodna is the underwater member of the vehicle group. Besides the usual "start / slow down" interaction it adds a vertical dimension (the submarine can settle on the sand and lift off again), fish that react to touch by circling the submarine, and bubbles the child can pop. The submarine starts hovering rather than moored, so the first touch is already a choice between swimming and resting. Nothing can go wrong: there is no score, and the submarine never swims backwards.

## 3. Activity flow

1. The child opens the activity (`#podwodna`); `mount` builds the scene and starts one `requestAnimationFrame` loop.
2. The scene shows a blue sea gradient, a sand strip at the bottom, three seaweed clumps, four fish swimming back and forth at different heights and the submarine **hovering** near the left (at 6 % of the width), bobbing gently. Bubbles start to rise from it.
3. The child can touch the submarine hull, the bear in the window, the sand, a fish or a bubble.
4. Touching the hull makes the submarine swim (2 s ramp) or slow to a hover. Touching the sand makes it glide down to rest on the sand at the touched horizontal position; touching it while resting lifts it back to cruising height (2.2 s). Touching a fish makes it swim once around the submarine (7 s). Touching a bubble pops it (0.5 s fade). Touching the bear makes it wave (2.6 s).
5. There is no formal completion state.
6. The cycle repeats for as long as the child plays.
7. The activity does not reset itself and nothing is randomised (section 10).
8. The child leaves with Back (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Loop time at cruise speed | `CROSS_S = 24` s (`V = 1/24` loop fractions per second); the visible width is crossed in about 14 to 18 s |
| Start / slow-down ramp | `RAMP_S = 2.0` s (smoothstep) |
| Bob | `BOB = 4` px each way (8 px peak-to-peak), period 3.6 s, tilt up to 1.2 deg; both fade to 0 as the submarine settles on the sand |
| Sand glide duration | `T = clamp(2.5 + |Δf|·L/W·3, 2.5, 6)` s, a cubic Hermite from the current speed |
| Lift-off | 2.2 s, no horizontal movement |
| Bear wave | `WAVE_S = 2.6` s |
| Fish circling | `CIRCLE_S = 7` s, blended in and out over 1.3 s each; ellipse radii `max(0.7·bw, FS)` by `max(0.8·bh, FS)` |
| Bubbles | pool `MAX_BUBBLES = 10`; one spawned every `BUBBLE_EVERY = 1.0` s; life `BUBBLE_LIFE = 4.5` s; rise 55 px/s; sideways wobble ±10 px; pop `POP_S = 0.5` s |
| Fish | 4, speeds 22, 28, 25 and 20 px/s, lanes at 12 %, 23 %, 68 % and 77 % of the water height; colours pink, blue, orange and green |
| Seaweed | 3 clumps at `SEAWEED_X = [0.1, 0.46, 0.86]` of the width |
| Frame step cap | `MAX_DT = 0.05` s |

Details:

- **Hull touch** (`onSub`): while resting it lifts off; while lifting it is ignored; otherwise a stopped or slowing submarine accelerates and a moving one slows to a hover.
- **Sand touch** (`onSand`): the target is the touched x (clamped so the submarine stays on screen); if the target lies behind the submarine it travels forward past the right edge and wraps (`fwd = 1`), so it never moves backwards (commit `ea2fe47`). A keyboard activation (no pointer coordinates) rests the submarine at the centre of the screen.
- **Resting submarine:** the horizontal position is kept on resize as a fraction of the free width.
- **Bubbles** are only created while the submarine is swimming or hovering, not while it rests or glides down; a bubble spawn is skipped if all ten are in use. A touched bubble fades and scales up 1.5x during `POP_S`.
- **Fish** move in a ping-pong between the screen edges with a slight vertical wave; touching an already circling fish is ignored; fish flip to face their direction of travel.
- **Reduced motion:** the submarine, fish, bubbles and wave are driven by the rAF loop; the seaweed sway is a CSS animation and stops; see section 6. **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touch to swim, rest, lift, pop, circle.
- Calm observation of slow underwater motion.
- Exploring several targets without failure.

**Directly observable behavior:**

- The submarine changes speed over 2 s and glides to the sand over 2.5 to 6 s.
- A fish circles the submarine once for 7 s after a touch.
- Bubbles are created once per second while the submarine is up and pop softly when touched.

**Requires professional or research-based validation:** any effect on attention, fine motor skills or understanding of cause and effect. Not currently documented.

## 6. Accessibility and usability

- **Input.** `pointerdown` (touch, mouse, stylus) and `click` with `event.detail === 0` for keyboard activation. The hull, the bear window, the sand and the fish are real `<button>` elements with Polish `aria-label`s and are reachable with Tab. The bubbles are buttons with `tabindex="-1"` and are therefore **not** keyboard reachable.
- **Touch handling.** `.pd` uses `touch-action: none`; no drag gesture. The submarine container has `pointer-events: none`; only the hull, window and (bubble buttons while a bubble is alive, class `pd-on`) capture touches.
- **Target sizes.** Sand strip height `max(56, 0.16·H)` px across the full width; window button `max(56, 0.24·bw)` px; fish `FS = clamp(0.11·min(W,H), 56, 84)` px; bubble hit box 56 x 56 px around a 24 px visible bubble; hull is 90 % x 70 % of the submarine.
- **Orientation.** Layout is recomputed on `resize`/`orientationchange`; a resting or hovering submarine keeps its relative horizontal position.
- **Colour.** Fish colours are decoration; nothing depends on colour alone.
- **Reduced motion.** The movement of the submarine, fish and bubbles is drawn from the rAF loop and keeps running under the global reduced-motion rule. The seaweed sway (`pd-sway`, a 6 s CSS keyframe animation) is purely decorative and is disabled by the global rule, so the seaweed stands still for such users; no state depends on it.
- **Sound:** none. **Reading:** not required.
- **Limitations:** bubbles cannot be popped by keyboard; a keyboard user cannot choose where the submarine rests.

## 7. Risks and limitations

- **Accidental interactions:** the sand strip spans the full width at the bottom; a touch near the sand always sends the submarine there.
- **Moving targets:** fish and bubbles move continuously, which may be harder to hit for a very young child (the hit boxes are at least 56 px).
- **Unclear ending:** the activity never ends.
- **Performance:** one always-running rAF loop updating the submarine, 4 fish and up to 10 bubbles per frame.
- **Privacy:** nothing is stored.

## 8. Configuration

No external configuration; constants in [`js/podwodna.js`](../../js/podwodna.js).

| Name | Purpose | Type | Default |
|---|---|---|---|
| `CROSS_S`, `V` | Loop time (s) and cruise speed | number | 24, `1/24` |
| `RAMP_S` | Start / slow-down ramp (s) | number | 2.0 |
| `BOB` | Bob amplitude (px) | number | 4 |
| `VB_W`, `VB_H` | Submarine viewBox size | number | 240, 130 |
| `WAVE_S`, `CIRCLE_S`, `POP_S` | Bear wave, fish circle, bubble pop durations (s) | number | 2.6, 7, 0.5 |
| `MAX_BUBBLES`, `BUBBLE_LIFE`, `BUBBLE_EVERY` | Bubble pool, life, spawn interval | number | 10, 4.5, 1.0 |
| `MAX_DT` | Frame step cap (s) | number | 0.05 |
| `SEAWEED_X` | Seaweed positions (fractions of the width) | array | `[0.1, 0.46, 0.86]` |
| `FISH` | Fish colours, lane, speed, phase | array of 4 objects | 4 entries |

There is no fallback because there is no external input.

## 9. Assets

No external asset files. The submarine, bear, fish and seaweed are inline SVG strings in the JS file (the bear is drawn locally by `bearSvg`); the sea gradient, sand (with pebble dots) and bubbles are CSS (`.pd-*` rules in [`css/style.css`](../../css/style.css)). No audio, fonts or data files. No unused assets found.

## 10. Randomization and variants

None. The scene, the four fish (colours, lanes, speeds, start phases), the seaweed and the starting position are fixed. The only variation is derived deterministically: bubble start position and sway phase cycle through a sequence (`bubSeq`), so no random function is used.

## 11. Progression and difficulty

None. No levels or difficulty, and nothing persists between sessions. The submarine starts hovering at cruise height on every launch.

## 12. Completion and feedback

No formal completion state. Feedback is visual only: swimming and hovering, a glide to and from the sand (the bob fades out when resting), a fish circling, a popping bubble, a waving bear. No sound, no celebration, no automatic restart.

## 13. Analytics and metrics

On `main` this activity emits **no analytics events** (see [Analytics status](README.md#analytics-status)); PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172) is open and not merged.

| Event | Emitted today |
|---|---|
| `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete` | No |

All metrics are **not supported**. Not implemented, for planning only: active time and `interaction` counts (hull, sand, fish, bubble, bear), with no completion rate. No identifying data should be collected.

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/podwodna.js`](../../js/podwodna.js), assigned to the `podwodna` registry entry; loaded before `js/app.js`. No shared helper is used.
- **Rendering:** DOM + inline SVG; the submarine, fish and bubbles are moved with inline `transform`; there are 10 pooled bubble buttons.
- **State:** closures: `f` (loop fraction), `v`, `yk` (0 = cruising, 1 = resting on the sand), `ramp`, `glide` (`{f0, v0, f1, pc1, fwd, cur, y0, y1, t, T}`), `waveT`, per-fish `ph`/`circ`/`th0`, per-bubble `t`/`pop`.
- **Animation:** one rAF loop `frame` with a capped dt; `glide` is a cubic Hermite in `f` (`fNew`) combined with an eased `yk`; fish ping-pong with phase `ph` in [0, 2); paused while hidden and restarted on `visibilitychange`.
- **Events:** `bind()` registers `pointerdown` and keyboard `click`; resize/orientation call `layout()`.
- **Cleanup:** cancels the rAF, removes listeners and the scene.
- **Persistence/config/analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; `W`/`H` come from `clientWidth`/`clientHeight`.
- **Units:** CSS pixels. The submarine's left edge is `f·L - bw` with `L = W + bw` and `bw = min(clamp(0.42·W, 200, 340), 0.55·H)`; its vertical position interpolates from `cruiseTop = 0.45·H - bh/2` to `restTop`, which seats the hull in the sand. The fish and bubbles share the same pixel space; fish lanes use fractions of the water height (`H - 0.8·sandH`).
- **Resting position** is stored as a fraction of the free width (`pc`) and restored after a resize.
- **Seaweed:** positioned by fractions of the width and anchored `0.5·sandH` above the bottom.
- Tested sizes: Not currently documented (PR [#156](https://github.com/BielinskiLukasz/child-page/pull/156) reports a stub simulation at four portrait and landscape viewports).

## 16. Error and edge-case handling

- **Backgrounding:** the loop pauses while hidden and resumes without a jump.
- **Resize:** a stationary submarine is re-placed from its stored fraction; an ongoing glide is retargeted (`glide.f1` is recomputed).
- **Rapid input:** a fish already circling ignores touches; a bubble that is not alive or already popping is ignored; a second hull touch during a lift-off is ignored.
- **Full bubble pool:** a spawn is skipped.
- **Sand touch behind the submarine:** it sails on and wraps (never backwards).
- **Touch cancel / missing assets / invalid config:** not applicable.
- **Unhandled:** no fallback without `requestAnimationFrame`.

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#156](https://github.com/BielinskiLukasz/child-page/pull/156) reports `node --check` and a stub-DOM simulation at 4 viewports (no backward steps, bob 8 px peak-to-peak, rest and lift positions, fish never off-screen, at most 5 bubbles alive, a pop removes the bubble, no bubbles at rest); a later commit (`ea2fe47`) changed the sand glide so it never travels backwards.

Manual checklist (not yet performed):

- [ ] Normal: open Łódź Podwodna; the submarine hovers near the left and bubbles rise; touch the hull; it swims forward and loops round.
- [ ] Touch the swimming submarine; it slows to a hover in about 2 s.
- [ ] Touch the sand to the right of and to the left of the submarine; it glides down at that position and never moves backwards.
- [ ] Touch the resting submarine; it lifts off in about 2.2 s and bubbles start again.
- [ ] Touch each fish; it circles the submarine once (about 7 s) and returns to its path; touch the same fish while circling; nothing extra happens.
- [ ] Pop several bubbles; rapid popping does not leave stuck bubbles.
- [ ] Touch the bear; it waves.
- [ ] Incorrect interaction: touch open water and seaweed; nothing happens.
- [ ] Completion: confirm there is no completion state.
- [ ] Restart: leave and re-enter; the submarine hovers at the left again.
- [ ] Randomization and progression: confirm that nothing varies and nothing persists.
- [ ] Portrait and landscape: rotate while swimming, resting and during a glide; the submarine and fish stay on screen and the resting submarine stays in the sand.
- [ ] Touch, mouse and keyboard (Tab to the hull, window, fish and sand; Enter/Space; confirm that bubbles are not reachable by keyboard).
- [ ] Background the tab while swimming; return without a jump.
- [ ] Reduced motion enabled: the submarine, fish and bubbles still move; the seaweed stands still.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no analytics on `main`.
- Bubbles are not reachable by keyboard (`tabindex="-1"`); a keyboard activation of the sand always rests the submarine at the screen centre.
- The seaweed animation is CSS-based and stops under reduced motion; the rest of the motion ignores that preference by design.
- The bear in the window is drawn locally, not with `js/animals.js`.

**Requires verification**

- Layout of the submarine, sand and fish on very short or very wide viewports.
- Frame rate on slow devices.

No open issue specifically concerns Łódź Podwodna (open: [#164](https://github.com/BielinskiLukasz/child-page/issues/164), [#167](https://github.com/BielinskiLukasz/child-page/issues/167), [#168](https://github.com/BielinskiLukasz/child-page/issues/168)).

## 19. Planned improvements

None currently planned for this activity.

## 20. Related activities and reusable components

- Similar: [Mała Łódka](mala-lodka.md) (loop-fraction model), [Autobusik](autobusik.md), [Traktor](traktor.md), [Rakieta](rakieta.md), [Kolejka Linowa](kolejka-linowa.md), [Balon](balon.md).
- Shared helpers: none used (`js/random.js` and `js/animals.js` are not referenced).
- Shared pattern: rAF loop with a capped dt.

## 21. Change history

- [#95](https://github.com/BielinskiLukasz/child-page/issues/95) / PR [#156](https://github.com/BielinskiLukasz/child-page/pull/156): Łódź Podwodna activity added.
- Commit `ea2fe47`: the sand glide never travels backwards (reviewer optional suggestion).

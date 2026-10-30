# Autobusik

## 1. Overview

| Property | Value |
|---|---|
| Display name | Autobusik |
| Internal ID | `autobusik` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A little bus loops slowly along a village road with three bus stops; each stop has a waiting random animal that hops aboard when the bus stops there. |
| Category | Open-ended play, cause and effect |
| Interaction type | Tap / click (also Enter and Space on the bus) |
| Status | Implemented; enabled by default in the menu (no `defaultOff`) |

## 2. Business purpose

Autobusik is one of the vehicle activities. Compared with [Traktor](traktor.md) it adds a "pick a destination" interaction: the child can ask the bus to stop at a particular stop, and the stop is then served by a gentle sequence (braking, doors opening, animal hopping in). It also lets the child take an animal out again. All reactions are slow and non-failing: the bus never reverses, there is no score and nothing can be done wrongly.

## 3. Activity flow

1. The child opens the activity (`#autobusik`); `mount` builds the scene and starts one `requestAnimationFrame` loop.
2. The scene shows a village (four houses, three trees, sun, clouds), a sidewalk with three bus stop signs at 20 %, 50 % and 80 % of the width, and a road. Three random animals wait, one at each stop. The bus starts **stopped at the first stop** with its doors opening; the first animal is marked "do not board" until the bus has driven off once (or the child touches that stop).
3. The child can touch the bus, a bus stop, a waiting animal or an animal sitting in a window.
4. Touching the bus: when standing at a stop it closes the doors and then drives off; when halted mid-road it starts; when moving it slows to a halt where it is. Touching a stop (or the animal waiting there) makes the bus drive to and brake into that stop (only the last touched stop counts). At a stop the doors open and the waiting animal hops into a window. Touching an animal in a window makes it step out at the stop (bus standing there with open doors) or wave (otherwise).
5. There is no formal completion state.
6. Nothing ends or resets; the bus keeps looping while the child plays.
7. A new random set of animals is drawn on every launch of the activity.
8. The child leaves with Back (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Loop time at cruise speed | `CROSS_S = 24` s (`V = 1/24` loop fractions per second); the front of the bus crosses the visible width in about 14 s or more |
| Start / slow-down ramp | `RAMP_S = 2.2` s (smoothstep) |
| Braking into a stop | `BRAKE_S = 3` (declared); the actual braking duration is `T = 2·D/v`, started when the remaining distance `D <= 1.5·v`, so it lasts about 3 s at cruise speed |
| Doors open/close | `DOOR_S = 1.8` s |
| Animal hop | `HOP_S = 1.8` s (arc height `0.7·AS`) |
| Animal wave | `WAVE_S = 2.2` s |
| Frame step cap | `MAX_DT = 0.05` s |
| Stops | `STOP_X = [0.2, 0.5, 0.8]` of the width |
| Windows | 3, centres at x = 58, 140, 222 in a 340 x 110 bus viewBox |
| Animals | exactly 3 (one per stop); animal `i` always rides in window `i` |

Details:

- **Position model.** The bus position is a loop fraction `f` in [0, 1) over a path of length `L = W + bus width`; it enters from beyond the left edge and leaves beyond the right edge, then wraps.
- **Never backwards.** Speed is clamped at 0 or above; braking and ramps only decelerate.
- **Stop request** (`onStop`): the target is set and the bus accelerates to cruise speed if it was slowing. If the stop is too close to brake gently (`D < 1.25·v`) the `skip` flag makes it wait until the bus has gone round (`D > 0.9`). Touching the stop where the bus already stands cancels a pending departure and allows the animals there to board.
- **Boarding:** only one animal at a time, only when the bus stands at the stop, doors are at least 95 % open, no animal is hopping and `go` is not set. Animals that stepped out are marked `noBoard` and do not re-board until the bus drives off.
- **Doors** open only while the bus stands at a stop (`parkedNow`); the door panel width shrinks by up to 92 %.
- **Departure** (`go`): the bus waits for the doors to close (`door1 <= 0.02`) and for hopping animals to finish.
- **Animal in a window, touched:** if the bus stands at a stop with the door more than half open the animal hops out to the waiting position of that stop; otherwise it waves.
- **Reduced motion:** all motion is driven by the rAF loop; see section 6.
- **Sound:** none.

## 5. Educational and developmental benefits

**Intended design benefits** (from the activity design, not measured):

- Cause and effect: touching a stop leads the bus there and the animal boards.
- Calm observation of slow vehicle motion.
- Choosing between three targets.

**Directly observable behavior:**

- Ramps and braking are slow (2.2 s and about 3 s); doors take 1.8 s.
- A child can place an animal in the bus and take it out again by touch.
- The three animals differ on every launch.

**Requires professional or research-based validation:** any effect on attention, planning or language development. Not currently documented.

## 6. Accessibility and usability

- **Input.** `pointerdown` (touch, mouse, stylus) plus `click` with `event.detail === 0` for keyboard activation. The bus has `role="button"`, `tabindex="0"` and handles Enter/Space; stops and animals are real `<button>` elements with Polish `aria-label`s (animal buttons carry the animal's Polish name from `js/animals.js`).
- **Touch handling.** `.ab` uses `touch-action: none` and disables text selection; no drag gesture.
- **Target sizes.** Animal buttons `AS = max(56, min(76, 0.24·bus width))` px with a 56 px minimum; stop buttons at least 56 px wide and about `max(0.45·sy, 96)` px tall; the bus is `min(max(0.64·W, 240), 0.8·W, 460, ...)` px wide.
- **Orientation.** Layout recomputed on `resize`/`orientationchange`; the stopped bus is always fully on screen (the bus centre is clamped to `[bw/2, W - bw/2]`).
- **Colour.** Animals are distinguished by shape and colour; nothing depends on colour alone.
- **Reduced motion.** Bus, doors, wheels and animals are moved by the rAF loop and JS-set attributes; the global reduced-motion rule does not stop them. The motion is slow. Decorations (sun, clouds, houses) are static.
- **Sound:** none. **Reading:** not required.
- **Limitations:** the three stop signs are quiet, small illustrations; touching the bus while doors are opening is accepted (it only closes them after boarding/hopping has finished). Stop and animal buttons overlap near each other on small screens (animals stand 0.9 to 1.8 `AS` from the stop centre).

## 7. Risks and limitations

- **Accidental interactions:** the stop sign, the waiting animal and the bus are close together at a stop; a stop touch while the bus is already there with a door closing re-allows boarding rather than doing nothing.
- **Hidden state:** a request for a stop that was just passed makes the bus drive a whole loop (up to about 24 s) before stopping, which a young child may read as "not working".
- **Unclear ending:** the activity never ends.
- **Performance:** one rAF loop is always running; per frame it updates the bus, door, wheels and three animals.
- **Privacy:** nothing is stored; animals are random but carry no personal data.

## 8. Configuration

No external configuration; constants at the top of [`js/autobusik.js`](../../js/autobusik.js).

| Name | Purpose | Type | Default |
|---|---|---|---|
| `CROSS_S` | Seconds per full loop at cruise speed | number | 24 |
| `V` | Cruise speed (loop fractions/s) | number | `1 / CROSS_S` |
| `RAMP_S` | Start / slow-down ramp (s) | number | 2.2 |
| `BRAKE_S` | Braking time (declared; not read by the brake calculation, which derives `T = 2·D/v`) | number | 3 |
| `DOOR_S` | Door open/close time (s) | number | 1.8 |
| `HOP_S`, `WAVE_S` | Animal hop and wave durations (s) | number | 1.8, 2.2 |
| `MAX_DT` | Frame step cap (s) | number | 0.05 |
| `VB_W`, `VB_H` | Bus viewBox size | number | 340, 110 |
| `WIN_X` | Window centres | array | `[58, 140, 222]` |
| `STOP_X` | Stop positions as fractions of the width | array | `[0.2, 0.5, 0.8]` |

There is no fallback because there is no external input. The number of animals (3) is also fixed in the code (`Animals.pick(3)`, three buttons, three stops).

## 9. Assets

No external asset files. The bus, stops, houses and trees are inline SVG strings in the JS file; the animals are SVG from [`js/animals.js`](../../js/animals.js) (`Animals.head`); the sky, sun, clouds, sidewalk and road are CSS (`.ab-*` rules in [`css/style.css`](../../css/style.css)). No audio, fonts or data files. No unused assets found.

## 10. Randomization and variants

- **What:** which 3 animals wait at the stops, chosen on every `mount` with `Animals.pick(3)`.
- **Pool:** the 13 animals of `js/animals.js` (Miś, Króliczek, Kotek, Piesek, Myszka, Świnka, Lisek, Lew, Słoń, Panda, Żabka, Sowa, Koala).
- **Uniqueness:** the three picks are unique within a launch (shuffle and slice). `opts.distinct` is not used, so similar silhouettes may appear together.
- **No cross-launch memory:** unlike `Rand.pickOne`, `Animals.pick` does not remember earlier launches, so the same animals can appear again on the next visit.
- Nothing is stored; the bus route and stop positions are fixed.

## 11. Progression and difficulty

No progression or difficulty. The state (which animals are aboard) is not persisted and is reset when the activity is re-entered.

## 12. Completion and feedback

No formal completion state. Feedback is purely visual: braking and ramps, door panel opening/closing, animals hopping in/out, waving animals and wheels turning with distance. No sound, no celebration, nothing automatically restarts because nothing ends.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/autobusik.js`](../../js/autobusik.js), assigned to the `autobusik` registry entry; lazy-loaded via `src`/`deps` on its registry entry in js/activities.js. Other sources: `js/animals.js` (`Animals.head`, `Animals.pick`), `.ab-*` in `css/style.css`.
- **Rendering:** DOM + inline SVG; bus and animals are moved with inline `transform` per frame; the door panel width is an SVG attribute.
- **State:** closures. Bus: `f`, `v`, `ramp`, `brake`, `target`, `skip`, `go`, `parkedAt`, `door1`. Per animal: `st` (`wait`, `hopin`, `in`, `hopout`), `t`, `p0`, `stop`, `noBoard`, `wave`.
- **Animation:** a single rAF loop `frame` with dt capped at 0.05 s, stopped when `document.hidden` and restarted on `visibilitychange`.
- **Events:** `bind()` registers `pointerdown` and keyboard `click`; resize/orientation call `layout()`, which re-plans an in-progress brake from the current speed (no snap).
- **Cleanup:** the returned function cancels the rAF, removes listeners and the scene.
- **Persistence/config/analytics:** none.

## 15. Responsive layout and coordinate system

- The scene is `position: fixed; inset: 0`; `W`/`H` come from `clientWidth`/`clientHeight`.
- **Units:** CSS pixels for placement; the bus position is the loop fraction `f` (0 = just off the left edge, 1 = just off the right edge), so speed and stop positions stay valid after a resize. Bus left = `f·L - bw` with `L = W + bw`; road base at `0.88·H`, sidewalk/stops at `0.6·H`, road top at `0.62·H`, road height `0.3·H`.
- **Stops:** the target `f` of a stop is `(clamp(stopX, bw/2, W - bw/2) + bw/2) / L`, so the bus centre stays on screen even for stops near an edge.
- **Windows:** window positions are computed from the bus viewBox (`WIN_X / 340`) so animals in windows follow the bus.
- Tested sizes: Not currently documented (PR [#104](https://github.com/BielinskiLukasz/child-page/pull/104) reports a stub simulation at 800x500 and 360x700).

## 16. Error and edge-case handling

- **Resize during braking:** the brake plan is dropped and the bus re-accelerates toward cruise speed; if it stood at a stop it is re-placed at that stop.
- **Backgrounding:** the loop pauses while hidden and resumes without a time jump.
- **Rapid input:** repeated touches change `target`/`go` state; only the last touched stop counts; wave and hop ignore touches while running (`a.st !== 'in'`; wave only starts when `wave < 0`).
- **Stop too close:** handled by `skip` (it stops on the next loop).
- **Touch cancel / missing assets / invalid config:** not applicable.
- **Unhandled:** no fallback without `requestAnimationFrame` or `window.Animals`.

## 17. Testing

No automated tests exist for this activity (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#104](https://github.com/BielinskiLukasz/child-page/pull/104) reports `node --check` and a hand-made DOM stub simulation (800x500 landscape and 360x700 portrait) confirming start position, braking into stops, door open/close, boarding, no backwards motion and no NaN; it says visuals and touch targets still needed a device check.

Manual checklist (not yet performed):

- [ ] Normal: open Autobusik; the bus stands at the first stop with doors open; touch it and it closes the doors, then drives off smoothly.
- [ ] Touch the moving bus; it slows to a halt where it is; touch again to restart.
- [ ] Touch each of the three stops and each waiting animal; the bus brakes into that stop in about 3 s, the doors open and the animal hops aboard.
- [ ] Touch two different stops quickly; only the last one is served.
- [ ] Touch a stop that was just passed; the bus continues round the loop and stops on the next pass.
- [ ] Incorrect interaction: touch the road, sky and houses; nothing happens.
- [ ] Touch an animal in a window at a stop (steps out) and while moving (waves).
- [ ] Completion: confirm there is no completion state and nothing resets after all three animals are aboard.
- [ ] Restart/randomization: leave and re-enter several times; the animals vary; observe whether animals repeat between visits.
- [ ] Progression: confirm nothing persists after a reload.
- [ ] Portrait and landscape: rotate while braking and while stopped; the bus stays fully visible at every stop and no animal is displaced.
- [ ] Touch, mouse and keyboard (Tab to the bus, stops and animals; Enter/Space on the bus).
- [ ] Background the tab while the bus moves; return without a jump.
- [ ] Reduced motion enabled: bus, doors and animals still move.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests. Analytics is covered in section 13.
- `BRAKE_S` is declared but not used in the brake calculation (the duration is derived from the remaining distance).
- `Animals.pick` does not prevent the same animals from appearing on consecutive launches, and `distinct` is not used.
- The motion ignores the reduced-motion preference by design.

**Requires verification**

- Overlap of waiting-animal and stop buttons on very narrow screens.
- Frame rate on slow devices.

No open issue specifically concerns Autobusik; the metrics (#164), visual fixes (#167) and documentation (#168) issues are all merged or in review.

## 19. Planned improvements

None currently planned for this activity.

## 20. Related activities and reusable components

- Similar: [Traktor](traktor.md), [Rakieta](rakieta.md), [Mała Łódka](mala-lodka.md), [Łódź Podwodna](lodz-podwodna.md), [Kolejka Linowa](kolejka-linowa.md), [Balon](balon.md).
- Shared: [`js/animals.js`](../../js/animals.js) (`Animals.head`, `Animals.pick`); `js/random.js` is used indirectly (`Animals.pick` shuffles with `Rand.shuffle` when available).
- Shared pattern: rAF loop with capped dt; position as a loop fraction.

## 21. Change history

- [#92](https://github.com/BielinskiLukasz/child-page/issues/92) / PR [#104](https://github.com/BielinskiLukasz/child-page/pull/104): Autobusik activity added.
- [#113](https://github.com/BielinskiLukasz/child-page/issues/113) / PR [#137](https://github.com/BielinskiLukasz/child-page/pull/137): random animals per stop from the shared pool.

# Akwarium Artura

## 1. Overview

| Property | Value |
|---|---|
| Display name | Akwarium Artura |
| Activity ID | `akwarium` (`js/activities.js`) |
| Description | A calm canvas aquarium. Touching the water drops fish food that the fish swim over to eat; touching a fish makes it blow a few soft bubbles. |
| Category | Open-ended play, observation, cause and effect |
| Interaction type | Tap (pointer down) on the canvas |
| Status | Implemented. Enabled by default in the menu (no `defaultOff` flag). |
| Source | [`js/akwarium.js`](../../js/akwarium.js), CSS class `.aquarium` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

The aquarium is a low-pressure "watch and nudge" activity: every touch has a visible, gentle consequence (food appears and is eaten, bubbles rise) and nothing can go wrong. It complements the more task-like activities (matching, counting, puzzles) by offering a purely exploratory scene, and it is one of the few activities whose characters move on their own and react to the child's touch.

Since issue #108 the scene differs on every launch (2-8 fish with unique shape and colour combinations), so repeated visits do not look identical.

## 3. Activity flow

1. The child opens the tile from the menu (hash `#akwarium`); `mount` creates one full-screen `<canvas>`.
2. The scene shows a pale blue water gradient, a sand strip, five seaweed plants and 2-8 fish already swimming.
3. The child can tap anywhere on the canvas.
4. Tapping empty water drops a food pellet at that point; it sinks slowly and the nearest fish swim towards it. Tapping a fish releases 3-5 bubbles and gives that fish a small random sideways bias for 3 seconds.
5. There is no completion state; the scene runs until the child leaves.
6. Nothing resets on its own; food and bubbles expire by themselves.
7. A new fish selection is made only on the next launch (leaving and reopening the activity).
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Input handled | `pointerdown` on the canvas (every pointer, so several fingers each add food or bubbles); default is prevented |
| Fish hit test | Nearest fish whose centre is within `size * 1.8` of the touch (about 47-61 px for sizes 26/30/34) |
| Food | Max 10 pellets (`MAX_FOOD`); an 11th touch removes the oldest. Pellet radius 5 px |
| Food sinking | `FOOD_FALL` = 28 px/s down to `H - 36` (above the sand) |
| Food expiry | Removed after resting on the bottom for `FOOD_REST_MS` = 6000 ms, or after `FOOD_MAX_MS` = 25000 ms of age, whichever comes first |
| Eating | A fish eats a pellet when the pellet is within `0.9 * size` of a point one body length ahead of the fish. Several fish may chase the same pellet; the first to arrive eats it |
| Target choice | Every frame each fish heads for the nearest uneaten pellet |
| Bubbles | 3-5 per fish touch; radius 3-7 px; rise 18-32 px/s with a gentle sideways wobble; max 30 on screen (`MAX_BUBBLES`, oldest dropped); removed above the top edge |
| Fish speed | `max(24, W / 14)` px/s, so crossing the full width takes at least about 14 s |
| Turning | Capped at 0.7 rad/s; pitch limited to about 26 deg when idle (`maxPitch` 0.45) and about 57 deg when chasing food (1.0), so direction never flips instantly |
| Wandering | New wander angle (+/-0.35 rad) every 3-7 s; fish start turning away from the side walls one turn radius early (margin `max(70, 1.6 * speed / turn)`) |
| Vertical limits | Fish centre clamped to y from 30 to `H - 50` |
| Fish size | 26, 30 or 34 px (body half-length); tail extends to 1.5x |
| Touch nudge | Touched fish gets a bias of +/-0.8 (half of it applied) for 3 s, still subject to the capped turn rate |
| Failure / scoring | None. Fish are never "full": any number of pellets can be eaten |

Reduced motion (`prefers-reduced-motion`) is read once on mount: all speeds, the turn rate, food sinking and bubble rise are multiplied by 0.6, and plant sway and tail wag are switched off. Because the motion runs in one `requestAnimationFrame` loop it is not disabled by the global CSS rule (see [shared behaviour](README.md#shared-platform-behaviour)). The media query is not re-evaluated while the activity is open.

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect (touch water, food appears, fish react).
- Calm observation of slow, smooth movement.
- Early hand-eye coordination through tapping a chosen spot or a moving fish.

**Directly observable behavior**

- Fish visibly change course towards food and eat it; touching a fish produces bubbles.
- Fish differ in shape (5 outlines) and colour (9 colours) within one launch.
- No text, no reading and no failure state are involved.

**Requires professional or research-based validation**

- Any effect on attention, calming or development. The code makes no such measurement and none is claimed.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus through pointer events. **No keyboard support**: the canvas is not focusable and has no key handlers.
- **Screen readers:** the canvas has `role="img"` and `aria-label="Akwarium z rybkami"`; individual fish, food and bubbles are not exposed.
- **Orientation:** the canvas fills the viewport (`position: fixed; inset: 0`) in portrait and landscape; fish and plants are positioned relative to the current width and height.
- **Targets:** there are no fixed buttons. A touch near a fish (47-61 px radius) counts as a fish touch; anything else drops food. A tap on a fish therefore never drops food.
- **Colour:** colour carries no meaning (the shape/colour combination only makes fish distinguishable); no contrast requirement applies to information.
- **Sound:** none. **Reading:** not required. A young child can use it independently.
- **Motion intensity:** slow movement, no flashing. Reduced-motion setting slows it further (see section 4).
- **Limitation:** no keyboard alternative and no accessible description of the fish.

## 7. Risks and limitations

- Fish are drawn in a fixed order and can overlap each other; there is no collision avoidance.
- Many quick taps create up to 10 pellets and up to 30 bubbles; the oldest are silently dropped, which is not visible to the child.
- The activity has no ending, so it relies on the parent playtime limit (see [shared behaviour](README.md#shared-platform-behaviour)).
- A tap close to (but not on) a fish within the hit radius produces bubbles rather than food, which may surprise a child aiming at the water.
- Rendering is a 2D canvas redrawn every frame at device pixel ratio (not capped, unlike [Malowanie Światłem](malowanie-swiatlem.md)); performance on very slow devices is not documented.
- No personal data is involved.

## 8. Configuration

There is no external configuration. All values are constants inside [`js/akwarium.js`](../../js/akwarium.js); changing them requires editing the source.

| Name | Purpose | Type | Value | Location |
|---|---|---|---|---|
| `MAX_FOOD` | Food pellets on screen | number | 10 | top of IIFE |
| `MAX_BUBBLES` | Bubbles on screen | number | 30 | top of IIFE |
| `FOOD_FALL` | Sinking speed (px/s) | number | 28 | top of IIFE |
| `FOOD_REST_MS` | Time a pellet may rest on the bottom | number | 6000 | top of IIFE |
| `FOOD_MAX_MS` | Maximum pellet age | number | 25000 | top of IIFE |
| `COLORS` | Fish body colours | array of hex strings | 9 | top of IIFE |
| `SHAPES` | Fish outlines (`oval`, `round`, `slim`, `diamond`, `flat`) | array | 5 | top of IIFE |
| `MIN_FISH` / `MAX_FISH` | Fish count range | numbers | 2 / 8 | top of IIFE |

There is no fallback handling for invalid values because nothing is read from outside.

## 9. Assets

No external asset files. Everything is drawn on the canvas with 2D context calls (gradient background, sand strip, five seaweed strokes, fish bodies and tails, food circles, bubble outlines). The menu icon is inline SVG in [`js/activities.js`](../../js/activities.js). No fonts, audio or images are loaded.

## 10. Randomization and variants

| What | When | Pool | Rule |
|---|---|---|---|
| Fish count | Each mount (`makeFish`) | 2-8 (7 values, uniform) | Not stored; may repeat between launches |
| Shape + colour per fish | Each mount | 5 shapes x 9 colours = 45 combinations | `Rand.pick(combos, n)` returns `n` unique combinations, so no two fish on screen share both shape and colour (a colour or a shape alone may repeat) |
| Start position | Each mount | x 10-90 % of width, y 15-70 % of height | Uniform |
| Start direction | Each mount | left or right | 50 / 50 |
| Fish size | Each mount | 26, 30, 34 px | Uniform |
| Wander angle and timing, bubble properties, touch nudge sign | Continuously | Ranges in section 4 | `Math.random()` |

The result lasts for the session of that mount. There is no memory across launches, so the same fish set can appear twice in a row. [`js/random.js`](../../js/random.js) is a hard dependency (`window.Rand.pick`); there is no fallback if it is missing. The pool is always larger than the maximum of 8, so an empty or insufficient pool cannot happen.

## 11. Progression and difficulty

No progression, levels or difficulty. Nothing is persisted between sessions.

## 12. Completion and feedback

There is no formal completion state. Feedback is purely visual: a pellet appears under the finger, nearby fish turn towards it, the pellet disappears when eaten, and bubbles rise from a touched fish. No sound, no celebration, no automatic next round.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/akwarium.js`](../../js/akwarium.js), assigned to the registry entry with id `akwarium`; lazy-loaded via `src`/`deps` on that entry (`js/random.js` is declared in `deps`).
- **Rendering:** one `<canvas class="aquarium">`; background, plants, food, fish and bubbles are redrawn each frame in `draw()`. No DOM nodes are created per particle.
- **State:** closure variables `fish`, `food`, `bubbles`, `W`, `H`, `time`; no persistence.
- **Loop:** a single `requestAnimationFrame` loop (`frame`) with `dt` clamped to 0.05 s; on `visibilitychange` to hidden the loop is cancelled and restarted with `last = 0` on return, so no jump occurs.
- **Events:** `pointerdown` on the canvas, `resize` and `visibilitychange` on window/document.
- **Randomization:** `makeFish` with `Rand.pick`.
- **Resize:** `resize()` sets the canvas to `clientWidth/Height` times `devicePixelRatio` and clamps fish positions.
- **Cleanup:** the returned function cancels the frame and removes the three listeners; the canvas itself is removed when `app.js` empties the stage.
- **Dependencies:** `js/random.js`. No analytics integration.

## 15. Responsive layout and coordinate system

The canvas is fixed to the full viewport. Logical drawing units are CSS pixels (`ctx.setTransform(dpr, ...)`), with `W` and `H` read from the canvas client size. Fish, food and bubbles are in the same pixel space as pointer positions (`clientX - rect.left`). Seaweed is placed at fixed fractions of the width (0.10, 0.14, 0.55, 0.88, 0.92) with fixed pixel heights (90-150 px); the sand strip is 22 px tall. Fish speed scales with width (`W / 14`) but fish size does not, so on narrow phones fish are relatively large and on wide screens relatively small. After a resize or orientation change the fish are clamped inside the new bounds; food and bubbles keep their old pixel positions.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable (no assets) |
| Missing `Rand` | `makeFish` throws; the activity would not start (no fallback) |
| Resize / orientation change | Canvas resized, fish clamped; food and bubbles not rescaled |
| Backgrounding | Loop is cancelled and resumed with `dt = 0`; nothing jumps |
| Rapid repeated taps | Limited by `MAX_FOOD` and `MAX_BUBBLES`; oldest items are dropped |
| Multi-touch | Each pointer is handled independently |
| Touch cancellation | Only `pointerdown` is used, so cancellation has no effect |
| Leaving during animation | Cleanup cancels the frame |
| Reduced-motion change at runtime | Not detected until the next mount |
| Fish exactly at a wall | Clamped to the edges; the early-turn margin normally prevents wall pinning (fixed in commit 878598a) |

## 17. Testing

No automated tests exist (see [shared behaviour](README.md#shared-platform-behaviour)). PR [#134](https://github.com/BielinskiLukasz/child-page/pull/134) reports `node --check` plus a node simulation of `makeFish` over 500 runs (counts 2-8, no duplicate shape+colour) and states that the shapes were not checked visually.

Manual scenarios (all unchecked):

- [ ] Normal: open the activity; 2-8 fish are swimming, none stuck at a wall after 60 s.
- [ ] Tap empty water: a pellet appears, sinks and the nearest fish swim to it and eat it.
- [ ] Tap a fish: 3-5 bubbles rise; the fish does not turn abruptly.
- [ ] Incorrect interaction: tap 15 times quickly; no more than 10 pellets and 30 bubbles are visible and nothing freezes.
- [ ] Pellet never eaten (cover a corner far from fish): it disappears after resting about 6 s.
- [ ] Restart: leave with Back and reopen several times; fish count, shapes and colours vary and no two fish look identical in one launch.
- [ ] Progression: confirm nothing changes with time (none is expected).
- [ ] Portrait and landscape: rotate while fish swim; fish stay on screen and seaweed stays at the bottom.
- [ ] Touch: finger and, on a touch laptop, multi-finger taps work.
- [ ] Mouse: clicks work; no text selection or context menu interferes.
- [ ] Background/foreground: switch tabs for 30 s and return; no jump or speed burst.
- [ ] Reduced motion: enable the OS setting, reopen; movement is slower, plants and tails do not move, fish still react.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No keyboard operation (canvas is not focusable).
- Fish can overlap one another.
- `window.Rand` is required with no fallback.
- Reduced-motion is only read at mount.
- Relative size of fish depends on screen width (fish size is fixed in pixels).

**Requires verification**

- Frame rate on low-end devices at devicePixelRatio 3.
- Visual quality of the five fish outlines on device (PR #134 notes they were not visually checked).

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar calm, touch-reactive scenes: [Ogród Motyli](ogrod-motyli.md), [Magiczny Ogród](magiczny-ogrod.md), [Łódź Podwodna](lodz-podwodna.md).
- Shared helper: [`js/random.js`](../../js/random.js) (`Rand.pick`). It does not use `js/animals.js`.
- A canvas-and-one-loop reference with the same pattern: [Malowanie Światłem](malowanie-swiatlem.md).

## 21. Change history

- Issue [#3](https://github.com/BielinskiLukasz/child-page/issues/3) / PR [#10](https://github.com/BielinskiLukasz/child-page/pull/10): initial activity (plus a follow-up fix to wall-avoidance margins).
- Issue [#21](https://github.com/BielinskiLukasz/child-page/issues/21): app review polish (UX and behaviour improvements).
- Issue [#108](https://github.com/BielinskiLukasz/child-page/issues/108) / PR [#134](https://github.com/BielinskiLukasz/child-page/pull/134): random fish count, shapes and colours.

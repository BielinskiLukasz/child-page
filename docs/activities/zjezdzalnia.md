# Zjeżdżalnia

## 1. Overview

| Item | Value |
|---|---|
| Display name | Zjeżdżalnia |
| Activity ID | `zjezdzalnia` (`js/activities.js`) |
| Description | A pastel playground with a ladder, a slide, a soft mat, a bench and three different animals. Touching an animal sends it up the ladder and down the slide. |
| Category | Open-ended play, cause and effect, calm observation |
| Interaction type | Tap (animals, mat) |
| Status | Implemented; enabled in the menu by default (no `defaultOff`) |

Source: [`js/zjezdzalnia.js`](../../js/zjezdzalnia.js), CSS prefix `zj-` in [`css/style.css`](../../css/style.css), registry entry in [`js/activities.js`](../../js/activities.js), script tag in [`index.html`](../../index.html). Introduced by issue #97 / PR [#160](https://github.com/BielinskiLukasz/child-page/pull/160).

## 2. Business purpose

- Gives the child a small, predictable story that they trigger themselves: an animal queues, climbs, slides and returns.
- Several animals can be sent at once and take turns, so the child sees a queue form and drain without any possibility of failure.
- Complements [Karuzela](karuzela.md) and [Huśtawka](hustawka.md) as a playground scene whose motion is a one-shot sequence per touch rather than a continuous ride.

## 3. Activity flow

1. The child opens the tile; `mount(container)` builds the scene.
2. Three different animals stand at their "home" spots at the right of the ladder; the slide and mat are empty.
3. The child can touch an animal, or the mat.
4. A touched ready animal joins the queue and walks to the ladder foot; when the slide is free it climbs (3 s), pauses at the top (1 s), slides (4 s), lands on the mat with a squash (0.9 s), walks home and rests (3 s).
5. There is no completion state; after resting the animal is ready again.
6. The child can send the same or other animals again without limit.
7. A new scene with a new animal selection is created each time the activity is opened.
8. The child leaves with the Back button (see [shared platform behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Animal states | `ready`, `queued`, `climb`, `top`, `slide`, `land`, `walk`, `rest`, then back to `ready`. |
| Touch a `ready` animal | Becomes `queued` and is appended to the queue. |
| Touch an animal in any other state | It waves for `WAVE_T` = 1.6 s (raised paw); its path and state are not changed. |
| One on the slide | Only one animal is in climb/top/slide/land at a time (`active`). The queue head starts climbing only once it has reached the ladder foot (`FOOT_X`) and `active` is empty. |
| Durations | Climb 3 s (`CLIMB_T`), top pause 1 s (`TOP_T`), slide 4 s (`SLIDE_T`), land squash 0.9 s (`LAND_T`), rest 3 s (`REST_T`). |
| Walking | `WALK` = 55 board units per second, straight line to the target at ground height `GY` = 262, with a small tilt wobble (3 degrees). |
| Queue spots | While the slide is busy: first waiting animal at x = 116, others at x = 176 (`QS`); when idle the head goes to the foot x = 56. Homes: x = 149, 209, 269 (`HOME`). Spots are 60 units apart. |
| Climb easing | `p = 0.6u + 0.4 smoothstep(u)` along the ladder line from (56, 262) to (96, 96). |
| Slide path | Quadratic Bezier P0 (96, 96), P1 (235, 175), P2 (335, 252), parameter `q = 0.65u + 0.35 smoothstep(u)` (never stalls); tilt follows the tangent at half strength. The drawn slide band covers the curve up to 0.9 (`SLIDE_END`). |
| Landing | Horizontal squash up to +12%, vertical -18%; the mat dips by about 3 px while the animal lands. |
| Touch the mat | The mat bounces up to `MAT_BOUNCE_PX` = 6 px over `BOUNCE_T` = 0.7 s. This does not affect animals. |

- No sound, scoring or failure state.
- The active animal is drawn above the others (z-index 6 vs 4).
- The animals are not blocked from overlapping while walking to queue spots; spacing of 60 units keeps overlap small.

## 5. Educational and developmental benefits

**Intended design benefits**

- Cause and effect: a touch triggers a visible sequence.
- Calm observation of a slow routine (climb, slide, return).
- Informal turn-taking: animals wait in a queue.

**Directly observable behavior**

- Animals queue in touch order and only one uses the slide at a time.
- Touching a busy animal only waves; it never interrupts the path.

**Requires professional or research-based validation**

- Any effect on patience, social understanding or development is not established by the code and is not claimed.

## 6. Accessibility and usability

- **Input:** the animals and the mat are `<button>` elements that react to `click`, so touch, mouse, stylus and keyboard (Tab, Enter/Space) all work. No drag or multi-touch is needed.
- **Targets:** animal buttons are at least 56 px (`max(56, 60 * k)` wide, `max(56, 80 * k)` high); the mat button is at least 56 x 56 px (`max(56, 76 * k)` x `max(56, 40 * k)`).
- **Labels:** animal buttons have `aria-label` "<name> – wejdź na zjeżdżalnię"; the mat button "Mata – podskocz". Decorative SVG is `aria-hidden`.
- **Focus:** `:focus-visible` outline 4px `#8f7fd1`.
- **Orientation:** the board keeps its 440:300 aspect ratio and is sized `min(100%, (100dvh - safe areas - 64px) * 440/300)`; works in portrait and landscape (in portrait the scene is simply smaller).
- **Colour:** no meaning is carried by colour alone; animals differ by shape and name.
- **Reduced motion:** all movement is driven by a `requestAnimationFrame` loop, so it is not disabled by the global rule; the activity does not offer a calmer variant for users who prefer reduced motion (speeds are already slow).
- **Reading:** none required; a young child can use it independently.
- **Limitation:** the animal buttons have no hint to a screen reader of their current state (queued, climbing, etc.).

## 7. Risks and limitations

- On a narrow portrait screen the sprites are clamped to 56 px while the 60-unit spacing scales down, so neighbouring animals can overlap slightly (noted in PR [#160](https://github.com/BielinskiLukasz/child-page/pull/160)). Not verified on real devices.
- A queued animal may walk through other animals' spots; there is no collision avoidance.
- An animal that is resting cannot be queued again until its 3 s rest ends (touching it only waves).
- Visual check in a real browser is not documented.

## 8. Configuration

No external configuration; constants live in [`js/zjezdzalnia.js`](../../js/zjezdzalnia.js) and need a code change. Nothing is stored; no fallback logic.

| Constant | Value | Purpose |
|---|---|---|
| `BW` x `BH` | 440 x 300 | Board units |
| `GY`, `FOOT_X`, `TOP_X`, `TOP_Y` | 262, 56, 96, 96 | Ground line, ladder foot x, ladder top |
| `QS`, `HOME` | [116, 176], [149, 209, 269] | Queue spots and home spots |
| `P0`, `P1`, `P2` | (96, 96), (235, 175), (335, 252) | Slide Bezier |
| `CLIMB_T`, `TOP_T`, `SLIDE_T`, `LAND_T`, `REST_T` | 3, 1, 4, 0.9, 3 s | Phase durations |
| `WAVE_T`, `BOUNCE_T` | 1.6 s, 0.7 s | Wave and mat bounce |
| `WALK` | 55 units/s | Walking speed |
| `MAT_BOUNCE_PX` | 6 px | Mat bounce height |
| `SLIDE_END` | 0.9 | Share of the curve drawn as the slide band |
| `MAX_DT` | 0.05 s | Frame time cap |

## 9. Assets

No external asset files. The scene (sky gradient, clouds, hills, bench, posts, ladder, deck, slide band, mat) is generated as inline SVG by `scene()`; the animals are inline SVG built from `Animals.head(id, { body: true })` plus feet and a paw circle in `figure()`. The menu icon is inline SVG in `js/activities.js`. No fonts, audio or images.

## 10. Randomization and variants

- `Animals.pick(3, { distinct: true })` on every `mount`: three unique animals, preferring different silhouette groups (see [`js/animals.js`](../../js/animals.js), [`js/random.js`](../../js/random.js)). The pool has 13 animals.
- Not persisted; the same animals can reappear on a later visit.
- Home positions are assigned in the picked order. Nothing else is random.

## 11. Progression and difficulty

No progression or difficulty. Nothing persists between sessions.

## 12. Completion and feedback

- No completion state; open-ended.
- Feedback is visual only: movement, squash on landing, mat dip and bounce, waving paw.
- No failure or retry. No sound. Nothing starts automatically; each cycle needs a touch.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` assigned to the registry entry `zjezdzalnia`; returns a cleanup function.
- **Rendering:** a fixed DOM: `.zj-board` containing one background SVG (`viewBox 0 0 440 300`, `preserveAspectRatio="none"`), the mat button and three animal buttons. Animals are moved with CSS `transform` set from JS each frame (`paint()`).
- **State:** closure variables: `animals[]` (each with `state`, `x`, `y`, `t`, wave timer `wv`, tilt/squash), `queue[]`, `active`, `matT`.
- **Animation:** a `requestAnimationFrame` loop (`frame`) with capped dt that stops itself when nothing is busy (`busy` false) and restarts via `start()` on a touch. Paused while `document.hidden`; resumed by `visibilitychange`.
- **Events:** `click` on animals and the mat; `resize`/`orientationchange` call `layout()` (scale `k = board width / 440`, sprite and mat sizes).
- **Cleanup:** cancels the frame, removes the window/document listeners and removes the root node.
- **Dependencies:** `window.Animals`. No persistence or analytics integration. See [shared platform behaviour](README.md#shared-platform-behaviour).

## 15. Responsive layout and coordinate system

- Board: 440 x 300 units, aspect ratio fixed by CSS, scale `k = board.clientWidth / 440`.
- Animals are feet-anchored: position (x, y) in board units times `k`, with the transform origin at the feet; the sprite box is `max(56, 60k)` x `max(56, 80k)` px.
- The background SVG and the mat button share the same board space (mat button centred at (335, 258) units).
- On resize or orientation change `layout()` recomputes `k` and repaints; an animal mid-slide is just redrawn at its board position.

## 16. Error and edge-case handling

- Resize/orientation change: handled as above; animations continue.
- Backgrounding: loop is cancelled while hidden and resumed with a fresh `last`; dt is capped at 0.05 s.
- Rapid repeated touches: a second touch on a non-ready animal only waves; a queued animal cannot be queued twice.
- Interrupted animation: not applicable; paths are never altered once started.
- Mid-queue recompute: queue slots are recomputed every frame, so changes when the slide frees up are smooth.
- Missing assets / empty pools: not applicable (inline SVG, 13 animals).
- Unused code: in the landing branch `matT = Math.max(matT, -2)` has no effect (matT is -1 or higher), and the header comment says the mat bounces at most 8 px while the constant is 6 px.

## 17. Testing

No automated tests exist (see [shared platform behaviour](README.md#shared-platform-behaviour)). PR [#160](https://github.com/BielinskiLukasz/child-page/pull/160) reports `node --check` and a stub-DOM simulation (single-animal timeline of climb 3 s, 1 s on top, 4 s slide, return home; three queued animals with a repeated touch; mat dy minimum -6) and states that no browser was available.

Manual scenarios (all unchecked):

- [ ] Normal: touch one animal; it walks to the ladder foot, climbs in about 3 s, pauses 1 s, slides in about 4 s, squashes on the mat, walks home and rests about 3 s.
- [ ] Queue: touch all three animals quickly; they take turns, only one is on the ladder or slide at a time.
- [ ] Incorrect interaction: touch an animal that is climbing, sliding, queued or walking; it waves and its path is unchanged.
- [ ] Touch the mat; it bounces once by a few pixels without affecting animals.
- [ ] Completion: confirm there is no end state; an animal can be sent again after its rest.
- [ ] Restart: leave with Back and re-enter; fresh scene, usually different animals.
- [ ] Randomization: enter several times; three different animals each time.
- [ ] Progression: confirm there is none.
- [ ] Portrait and landscape on phone and tablet; rotate during a slide; the animal stays on the slide path.
- [ ] Narrow portrait (about 320 px wide): check overlap of animals and the 56 px targets.
- [ ] Touch and mouse; keyboard Tab and Enter/Space on animals and mat.
- [ ] Background the tab mid-slide and return; the animation continues without a jump.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.
- [ ] Reduced motion enabled in the OS: animals still move.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests; no documented real-device verification.
- The `matT = Math.max(matT, -2)` statement and the "max 8 px" header comment are inconsistent with the code (6 px).
- No collision avoidance between walking animals.

**Requires verification**

- Overlap of sprites on very narrow portrait screens (PR #160 notes this as a review focus).

## 19. Planned improvements

None currently planned (no open issue targets this activity).

## 20. Related activities and reusable components

- Similar scenes: [Karuzela](karuzela.md), [Huśtawka](hustawka.md), [Latawiec](latawiec.md).
- Shared helpers: [`js/animals.js`](../../js/animals.js) (`Animals.pick`, `Animals.head`), which uses [`js/random.js`](../../js/random.js).

## 21. Change history

- Issue #97, PR [#160](https://github.com/BielinskiLukasz/child-page/pull/160): activity added (commit a83baf2) and a follow-up fix to 60-unit queue spacing and homes clear of the mat (commit 326f441, review suggestions).

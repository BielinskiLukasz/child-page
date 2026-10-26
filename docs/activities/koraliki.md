# Koraliki

## 1. Overview

| Item | Value |
|---|---|
| Display name | Koraliki |
| Internal ID | `koraliki` (entry in [`js/activities.js`](../../js/activities.js)) |
| Description | Eight big pastel beads in different shapes wait in a bowl; the child drags them onto a string to make a necklace. |
| Category | Coordination / open-ended play with a soft completion |
| Interaction type | Drag (pointer events); keyboard alternative (select a bead, then activate the string) |
| Status | Implemented; enabled by default in the menu |
| Source | [`js/koraliki.js`](../../js/koraliki.js), CSS block `/* Koraliki */` in [`css/style.css`](../../css/style.css) (prefix `kr`) |

## 2. Business purpose

A simple threading game with no wrong answers: any bead can go on the string in any order. It gives a drag-and-drop activity with a tangible goal ("all eight on the string") and a gentle reward, without sorting rules. It sits between the single-tap activities (for example [Zabawa w chowanego](zabawa-w-chowanego.md)) and the sorting activities with correct targets ([Duże i Małe](duze-i-male.md), [Kolorowe Kubeczki](kolorowe-kubeczki.md)): the only decision is where the bead is dropped, and a bead released away from the string simply returns.

## 3. Activity flow

1. The child opens the activity (`#koraliki`); the scene is laid out and drawn immediately.
2. Eight beads rest in a bowl at the bottom (shuffled spots); a string with a knot on the left and an open end with a hook on the right is shown above.
3. The child drags a bead (touch, mouse or stylus). While dragging it follows the pointer and is kept within the visible screen.
4. On release within about 0.9 bead sizes of the string the bead glides to the next free place on the string; otherwise it glides back to its bowl spot.
5. A bead on the string can be dragged off again; the remaining beads close the gap.
6. When all eight beads are on the string (and nothing is moving) the necklace glows for 3 s; 4 s after completion started (1 s after the glow has faded) the beads leave the string, glide back to the bowl in a new order, and the activity is ready again.
7. Taking a bead off during this wait cancels the sequence.
8. The child leaves with the Back button (see [README.md](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value (from `js/koraliki.js`) |
|---|---|
| Beads | `N = 8`: pink circle, blue square, green hexagon, purple diamond, yellow star, red heart, orange oval, mint flower |
| Drop test | Bead centre within `0.9 * S` of the string polyline (`nearString`, segment distance) |
| Slot on the string | Order of threading; slot `i` = i-th bead on the string; no choice of position |
| Glide duration (drop/return) | `min(1300, 600 + distance * 0.9)` ms; 300 ms when reduced motion is requested; 200 ms for re-layout glides |
| Completion glow | `GLOW_MS = 3000` ms, then `WAIT_MS = 4000` ms total before beads return |
| Bead size `S` | 56 to 84 px (see section 15) |
| Dragging limits | Bead centre clamped to keep the whole bead on the screen |
| Failure | None: a missed drop returns the bead; nothing is counted |

- A new bead is only accepted on the string when fewer than 8 are threaded (`string.length < N`), otherwise it returns home.
- Keyboard: Enter/Space (a `click` with `detail === 0`) on a bead in the bowl selects it (`aria-pressed`, visible outline); activating the "Nitka" button threads the selected bead; Enter on a threaded bead sends it home.
- Sound: none ([shared behaviour](README.md#shared-platform-behaviour)).

## 5. Educational and developmental benefits

**Intended design benefits** (design intent, not measured):
- Hand-eye coordination by dragging beads to a target line.
- Shape and colour recognition (eight distinct shapes in distinct colours).
- Cause and effect and a calm sense of accomplishment from the glow.

**Directly observable behavior:**
- Beads follow the finger, snap smoothly onto the string, and return when missed.
- The completed necklace glows softly and the beads are redistributed.
- No scores, timers or failure messages exist.

**Requires professional or research-based validation:** any claim about motor skill, concentration or developmental benefit; the repository contains no such evidence.

## 6. Accessibility and usability

- **Input:** pointer events (touch, mouse, stylus) with per-bead pointer capture, `touch-action: none`; keyboard alternative described in section 4 using native `<button>` elements and a 4 px `:focus-visible` outline (`#8f7fd1`).
- **Screen readers:** beads have Polish `aria-label`s such as "Koralik: różowe kółko (Enter lub spacja, potem wybierz nitkę)" that change when the bead is on the string; `aria-pressed` marks the selected bead; the string button is labelled "Nitka (wybierz koralik, potem nitkę)". The glow is not announced.
- **Target size:** beads are 56 to 84 px (`min-width/min-height: 56px`); the string drop zone is the whole row height.
- **Orientation:** works in portrait and landscape; narrow screens use two string rows and a 4x2 bowl (section 15). Layout is recomputed on resize/orientation change; an active drag is cancelled and the bead returns home.
- **Colour:** each bead has a different shape as well as colour, so colour is not the only cue. No decision depends on colour.
- **Reduced motion:** the global rule does not affect it because all movement and glow come from a `requestAnimationFrame` loop with inline styles; glides shorten to 300 ms with `prefers-reduced-motion`. The glow is still shown (opacity/drop-shadow changes).
- **Reading:** none required. Independent use by a young child is the design aim.
- **Limitations:** the glow overlay and bead drop-shadows are not accessible to screen readers; the bead position on the string cannot be chosen.

## 7. Risks and limitations

- Very short two-row screens (about 568x320 landscape or narrow phones) can make the bowl and the second string row touch because beads stay at least 56 px; PR [#72](https://github.com/BielinskiLukasz/child-page/pull/72) flagged this for a manual check on a small phone.
- The 3 s glow and 4 s wait are fixed; a child who is still playing is not affected because touching a bead cancels the sequence.
- No colour-only reliance. No privacy concerns: nothing stored or sent.

## 8. Configuration

No external configuration; constants are inside [`js/koraliki.js`](../../js/koraliki.js).

| Name | Purpose | Type | Default | Location |
|---|---|---|---|---|
| `N` | Number of beads / string slots | number | 8 | top of IIFE (the shapes list `DEFS` has 8 entries; changing `N` alone is not supported) |
| `GLOW_MS` | Glow duration | ms | 3000 | top of IIFE |
| `WAIT_MS` | Time after completion before beads return | ms | 4000 | top of IIFE |
| `DEFS` | Label, colour, glow colour and SVG path per bead | array | 8 entries | top of IIFE |
| Layout numbers | margin `m = 12`, `extra = 78`, pitch `1.04 * S`, S range 56-84, drop radius `0.9 * S` | numbers | see `layout()` and `nearString()` | functions |

No fallback for invalid values because nothing is read from outside.

## 9. Assets

No external files. Beads are inline SVG built by `beadSvg(def)` (shape path plus a white centre dot and a highlight). The bowl, string, knot and hook are SVG drawn into `.kr-deco` by `drawDeco()` (bowl `#fbe7c8`, string `#c9a0c0`). The background is a CSS gradient (`#fdf0d5` to `#e6e0f7`) and the glow is a CSS radial gradient on `.kr-glow`. The menu icon is inline SVG in `js/activities.js`. No fonts, images or audio.

## 10. Randomization and variants

- Bowl spot per bead: `shuffled(N)` at mount (Fisher-Yates over 8 indices).
- After each completed necklace: a new shuffle that must differ from the previous order (up to 20 attempts, `shuffled(N, avoid)`; after 20 failures the same order could in principle be kept, which has probability near zero).
- A bead sent home (dropped away from the string or taken off) returns to its own bowl spot; spots change only after a completed necklace.
- The shuffle uses its own `Math.random` code, not `window.Rand`. Nothing is stored; a new random order is created each time the activity is opened.
- There are no value pools beyond the fixed eight beads.

## 11. Progression and difficulty

None. Every round has eight beads and the same rules; nothing persists between sessions.

## 12. Completion and feedback

- Completion: eight beads on the string with all beads idle.
- Feedback: soft warm glow behind the string (`.kr-glow` radial gradient) and a coloured drop-shadow on each bead, easing in over about 450 ms; glow lasts 3 s.
- After 4 s in total the beads glide back to the bowl in a new order and the activity continues automatically.
- Failure: none; a missed drop returns the bead. No sound.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`) through the app shell only: `js/app.js` records the activity start and end, and the module counts touches inside the stage. The activity file itself calls no `Analytics` function. Recorded for it: starts, active time, replays (re-opening in the same session), quick exits (within 10 s) and touches. It is open-ended, so no completion, level or exit-before-completion is defined for it. Data stays on the device as anonymous daily aggregates; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/koraliki.js`](../../js/koraliki.js), replacing `mount` of the `koraliki` registry entry; returns `cleanup`.
- **Rendering:** DOM: `div.kr > div.kr-glow + div.kr-field`; the field holds an SVG `.kr-deco` (bowl, string, knot, hook), 8 `button.kr-bead` and one transparent `button.kr-string` that covers the string rows (used for keyboard threading).
- **State:** per bead `{ def, el, home, onString, mode ('idle' | 'drag' | 'glide'), pid, x, y, glide fields }`; global `string` (ordered beads on the string), `slots`, `homes`, `pts` (string polyline), `selected`, `doneT`, `doneGlow`.
- **Events:** `pointerdown/move/up/cancel` and `lostpointercapture` per bead; `click` for keyboard; `resize`, `orientationchange`, `visibilitychange`.
- **Animation:** one `frame()` loop (dt capped at 50 ms) using smoothstep glides; it keeps running only while something is moving or glowing and is restarted by `start()`. It is paused when the tab is hidden.
- **Completion logic:** `string.length === N` and all beads idle starts `doneT`; at `GLOW_MS + WAIT_MS` the beads are released with a new order.
- **Dependencies:** none (no `Rand`, no `Animals`). **Persistence:** none. **Analytics:** none from the activity itself (reported by `js/app.js`).
- **Cleanup:** cancels the frame, removes the three window/document listeners, removes the board.

## 15. Responsive layout and coordinate system

- `.kr` is fixed full-screen; `.kr-field` is inset by the safe-area variables, 64 px at the top and 12 px on the other sides. All coordinates are CSS pixels relative to the field's top-left (`fw` x `fh` from `getBoundingClientRect`).
- `layout()` chooses one string row if `(fw - 2*12 - 78) / (8 * 1.04) >= 56`, otherwise two rows of four. Bead size `S = max(56, min(84, row size, height-based size))`.
- The bowl is one row of eight if the width allows (`fw - 24 >= 9 * clamp(sw, 56, 84)`), otherwise 4x2. It sits at the bottom of the field.
- The string polyline `pts` is knot, each slot, open end; on two rows an extra cubic curve joins slot 4 to slot 5 in the drawing. The drop test uses the straight segments of `pts`.
- Beads, string, bowl and decoration share the field's coordinate space (SVG `width/height/viewBox` set to `fw x fh`). The `.stage .kr-deco` rule keeps the SVG from being shrunk by the global `.stage svg` rule (issue [#130](https://github.com/BielinskiLukasz/child-page/issues/130)).
- On resize every bead is re-placed at its target; active drags are cancelled and the bead returns home.

## 16. Error and edge-case handling

| Case | Handling |
|---|---|
| Missing assets | N/A (inline SVG) |
| Resize / rotation | `layout()` and `start()`; dragged bead returns home, glides continue to the new target |
| Backgrounding | Loop paused when hidden; restarted on return; completion timers only advance while visible |
| Rapid or multi-touch input | A bead ignores a second pointer while it already has one (`pid`); each bead captures its own pointer, so several beads can be dragged at once |
| Pointer cancel / lost capture | Handled as release (`up`): the bead is threaded if near the string, otherwise returns |
| Release while string full | Bead returns home (the 8-slot string cannot take a ninth) |
| Dragging out of the screen | Bead centre clamped to the visible window |
| Right mouse button | Ignored (`e.button > 0`) |
| Leaving mid-animation | `cleanup` cancels the frame; state is local |
| Synthetic pointers | `setPointerCapture` wrapped in `try/catch` |

## 17. Testing

No automated tests exist ([README.md](README.md#shared-platform-behaviour)). PR [#72](https://github.com/BielinskiLukasz/child-page/pull/72) reports a stub-DOM run in Node at four viewport sizes (threading 8 beads in order, glow then return in a new order, far drop returns home, simultaneous pointers/cancel leave no stuck bead, node count constant) and lists manual tests as pending; PR [#155](https://github.com/BielinskiLukasz/child-page/pull/155) reports `node --check` only and asks for a visual check. The script is not in the repository. Manual checklist (not yet performed):

- [ ] Normal: drag a bead onto the string; it glides to the next free place.
- [ ] Drag a bead and release far from the string; it glides back to its bowl spot.
- [ ] Drag a threaded bead off; the others close the gap.
- [ ] Completion: thread all eight; the glow shows for about 3 s and the beads return in a different order after about 4 s.
- [ ] Take a bead off during the wait; the sequence is cancelled.
- [ ] Restart: leave and reopen; the bowl order is different.
- [ ] Randomization: order differs after each completed necklace.
- [ ] Progression: confirm that nothing changes between rounds.
- [ ] Portrait (about 360x640): two string rows, beads at least 56 px, bowl not overlapping the second row.
- [ ] Landscape (about 640x360 and 568x320): one or two rows; check the bowl and string do not collide.
- [ ] Touch: two fingers dragging two beads at once; no bead gets stuck.
- [ ] Mouse: drag with the left button; right button does nothing.
- [ ] Keyboard: Tab to a bead, Enter selects it, Enter on "Nitka" threads it, Enter on a threaded bead removes it.
- [ ] Reduced motion on: glides are short (about 300 ms) and the glow still appears.
- [ ] Background the tab during the glow and return; the sequence resumes.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed (from code reading):**
- No automated tests.
- The bead's position on the string cannot be chosen; beads always go to the next free slot in drop order.
- Bead shuffle does not use the shared `Rand.shuffle`.

**Requires verification:**
- Overlap of bowl and second string row on very short screens (flagged in PR #72).
- Behaviour of the transparent string button for assistive technology (it covers the whole string area and has a label asking the user to select a bead first).

No open GitHub issue concerns this activity.

## 19. Planned improvements

None currently planned (no open issue).

## 20. Related activities and reusable components

- Other drag-to-target activities with a soft glow on completion: [Duże i Małe](duze-i-male.md), [Kolorowe Kubeczki](kolorowe-kubeczki.md), [Wieża z Klocków](wieza-z-klockow.md), [Puzzle](puzzle.md).
- The "select then activate target" keyboard pattern is shared in spirit with those activities (see their documents).
- Shared helpers (`js/random.js`, `js/animals.js`) are **not** used by this activity.

## 21. Change history

- [#62](https://github.com/BielinskiLukasz/child-page/issues/62) / [PR #72](https://github.com/BielinskiLukasz/child-page/pull/72): activity introduced; moved to the end of the activity list after review (commit `a1024e0`).
- [#130](https://github.com/BielinskiLukasz/child-page/issues/130) / [PR #155](https://github.com/BielinskiLukasz/child-page/pull/155): layout fix so the string and bowl SVG fill the field.

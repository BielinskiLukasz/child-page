# Malowanie Światłem

## 1. Overview

| Property | Value |
|---|---|
| Display name | Malowanie Światłem |
| Activity ID | `malowanie` (`js/activities.js`) |
| Description | A dark canvas. Touching and dragging paints soft glowing coloured marks that drift and fade away after a few seconds. |
| Category | Drawing, open-ended play, cause and effect |
| Interaction type | Touch, drag, mouse drag; keyboard (arrows and Enter/Space) |
| Status | Implemented. Enabled by default in the menu (no `defaultOff` flag). |
| Source | [`js/malowanie.js`](../../js/malowanie.js), `.paint-canvas` focus style in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

A free-drawing activity with no permanent result: whatever the child paints disappears by itself, so there is nothing to keep, clean or get wrong, and the screen returns to calm darkness. It gives the child direct control (the mark appears exactly under the finger) and is the only fully free "draw anything" activity, in contrast with [Rysuj Kształty](rysuj-ksztalty.md) which asks the child to trace given shapes.

## 3. Activity flow

1. The child opens the tile (hash `#malowanie`); `mount` creates one full-screen canvas.
2. A dark purple canvas (`#2b2748`) is shown; nothing else.
3. The child can touch, drag or (with a keyboard) use the arrow keys, Enter and Space.
4. Each touch point and each 22 px of drag leaves a soft glowing disc in the next colour of a cycle; discs drift slowly in a random direction and fade out in 3-5 s.
5. There is no completion state; the canvas goes dark again when nothing is touched.
6. There is no "clear" button; marks vanish by themselves.
7. Reopening the activity starts with a blank canvas.
8. The child leaves with the Back button (see [shared behaviour](README.md#shared-platform-behaviour)).

## 4. Rules and behavior

| Rule | Value |
|---|---|
| Mark spacing while dragging | `SPACING` = 22 px of pointer travel between marks |
| Marks per move event | At most 3 (`Math.min(floor(d / 22), 3)`), spread evenly along the segment since the last painted point |
| Maximum marks | `MAX` = 150; adding more removes the oldest |
| Mark radius | 40-75 px (random per mark) |
| Mark life | 3000-5000 ms (random) |
| Mark drift | Random direction, 6-14 px/s |
| Opacity | `0.5 * sin(min(t * 8, 1) * pi / 2) * (1 - t)^2` where `t` = age / life: fades in over the first 12.5 % of life, then fades out quadratically |
| Blending | Additive (`globalCompositeOperation = 'lighter'`) with a radial gradient from the mark colour to transparent |
| Colours | 6 (`#f7a8c9` pink, `#c9b8f2` lilac, `#a8d8f0` light blue, `#ffd98a` yellow, `#a9dcb4` green, `#ffb7a5` coral), used in a fixed rotating order (`colorIdx++ % 6`), starting with pink on every launch |
| Multi-touch | Each pointer is tracked separately (`pointers` map); pointer capture is requested on the canvas |
| Mouse hover | Does not paint; only while a button or finger is down |
| Keyboard | The canvas is focusable (`tabindex="0"`); arrows move a light spot by 30 px (starting at the centre, clamped to the canvas) and paint a mark at each press; Enter or Space paints at the current spot |
| Frame step | Capped at 50 ms |
| Failure / scoring | None |

The animation runs in one `requestAnimationFrame` loop that stops when no marks are left and restarts when a new mark is added, so it is not affected by the global reduced-motion CSS rule (see [shared behaviour](README.md#shared-platform-behaviour)). There is no slower variant for reduced motion; marks still drift and fade at the same speed.

## 5. Educational and developmental benefits

**Intended design benefits**

- Free expression and cause and effect (finger movement leaves a visible trail).
- Fine-motor and hand-eye coordination through dragging.
- Calm, forgiving play without a result to protect.

**Directly observable behavior**

- Marks appear where touched, in colours that change one after another, and drift away.
- Drag speed does not change the spacing of marks much: marks are placed every 22 px or more.

**Requires professional or research-based validation**

- Any effect on creativity, motor skills or calm. None is measured or claimed.

## 6. Accessibility and usability

- **Input:** touch, mouse and stylus via pointer events; **keyboard** support (see section 4) with a visible focus outline (`.paint-canvas:focus-visible`).
- **Screen readers:** the canvas has `role="img"` and a Polish `aria-label` describing the keyboard controls; painted marks are not exposed.
- **Orientation:** full viewport (`position: absolute; inset: 0` inside a relative container); resized on `resize` and `orientationchange`.
- **Targets:** there are no buttons; the whole canvas is the target.
- **Colour:** colour carries no meaning. The marks are bright additive lights on a dark background.
- **Sound:** none. **Reading:** not required. Independent use by a young child is possible.
- **Visual intensity:** soft glows that fade; overlapping additive marks can look bright when many are close together (see section 7). No flashing.
- **Limitations:** a keyboard user has no visible cursor except the marks themselves; there is no way to choose a colour.

## 7. Risks and limitations

- Overlapping additive marks add up and can approach white in busy areas.
- A fast scribble is limited to 3 marks per move event, so very fast strokes look dotted rather than continuous.
- Up to 150 radial gradients are created and drawn every frame, which may be slow on low-end devices (requires verification).
- The result cannot be saved or cleared on demand; it always fades (by design).
- On resize the existing marks keep their pixel positions (they are not rescaled).
- No personal data is involved and nothing is stored.

## 8. Configuration

No external configuration. Constants in [`js/malowanie.js`](../../js/malowanie.js).

| Name | Purpose | Value |
|---|---|---|
| `MAX` | Maximum marks on screen | 150 |
| `SPACING` | Pointer travel between marks | 22 px |
| `COLORS` | Colour cycle | 6 hex colours |
| `STEP` (inside the keyboard handler) | Keyboard movement | 30 px |
| Radius, life, speed ranges and the 0.5 alpha | Mark appearance | literals in `addMark` and `draw` |
| Canvas background | Dark purple | `#2b2748` (inline style) |

There is no fallback or validation; values are not read from outside.

## 9. Assets

No external assets. Everything is drawn on one `<canvas>` with radial gradients; the background colour is set inline. The menu icon is inline SVG in [`js/activities.js`](../../js/activities.js). No fonts, audio or images.

## 10. Randomization and variants

| What | Rule |
|---|---|
| Mark radius (40-75 px), life (3-5 s), drift direction and speed (6-14 px/s) | `Math.random()` per mark |
| Colour | Not random; fixed cycle through 6 colours, starting with pink every launch |

[`js/random.js`](../../js/random.js) is not used and nothing is stored. There are no pools that can be empty.

## 11. Progression and difficulty

None. Nothing is persisted between sessions.

## 12. Completion and feedback

No formal completion state. Feedback is immediate: the mark appears under the finger (or at the keyboard light spot) and fades after 3-5 s. No sound, no celebration.

## 13. Analytics and metrics

Nothing is emitted on `main` for this activity (see [Analytics status](README.md#analytics-status)); `js/malowanie.js` has no analytics calls. `activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start` and `level_complete` are **not emitted** and no metric is supported.

Not implemented (planning note only): active time per visit and a coarse interaction count (for example one count per stroke, not per mark) would be the meaningful signals; completion and levels do not apply. The painted content must never be recorded. Any implementation must stay on-device with no personal data ([#164](https://github.com/BielinskiLukasz/child-page/issues/164), PR [#172](https://github.com/BielinskiLukasz/child-page/pull/172) open).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/malowanie.js`](../../js/malowanie.js).
- **Rendering:** a single `<canvas class="paint-canvas">` styled inline (absolute, `touch-action: none`); the container is set to `position: relative; display: block` and restored on cleanup. Device pixel ratio capped at 2.
- **State:** `marks` (plain objects with position, velocity, radius, life, age, colour), `pointers`, `colorIdx`, keyboard spot `kx, ky`.
- **Loop:** `frame` ages and moves marks and calls `draw`; it re-arms itself only while marks exist (`start()` is called from `addMark`); it is cancelled when the tab is hidden and restarted when it becomes visible again and marks remain.
- **Events:** `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `lostpointercapture`, `keydown` on the canvas; `resize`, `orientationchange`, `visibilitychange`.
- **Cleanup:** stops the loop, clears marks, removes window/document listeners, restores container styles and empties the container.
- **Dependencies:** none.

## 15. Responsive layout and coordinate system

The canvas fills its container (the stage). Logical drawing units are CSS pixels: `w` and `h` come from the canvas client size and the context is scaled by `min(devicePixelRatio, 2)`. Pointer positions are converted with `getBoundingClientRect`, so touch positions and drawn marks share one pixel space. Marks do not scale with the screen size (radius 40-75 px on every device), so on a small phone they are relatively large. After a resize the canvas is redrawn at the new size; existing marks are not moved.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Missing assets | Not applicable |
| `setPointerCapture` failing | Wrapped in `try/catch` and ignored |
| Resize / orientation change | Canvas resized and redrawn; marks keep their positions |
| Backgrounding | Loop is cancelled; on return it restarts and marks continue (no age jump because `last` is reset) |
| Rapid or very fast input | At most 3 marks per move event; total capped at 150 |
| Touch cancellation | `pointercancel` and `lostpointercapture` remove the pointer |
| Keyboard key repeat | Each repeat adds a mark; the cap of 150 applies |
| Leaving during animation | Cleanup stops the loop and empties the container |

## 17. Testing

No automated tests exist (see [shared behaviour](README.md#shared-platform-behaviour)). No test report was found in the activity's PRs ([#15](https://github.com/BielinskiLukasz/child-page/pull/15) and the keyboard commit).

Manual scenarios (all unchecked):

- [ ] Normal: tap once; a soft disc appears under the finger, drifts and fades within about 5 s.
- [ ] Drag slowly and quickly; a trail of marks follows the finger; very fast strokes look dotted but nothing freezes.
- [ ] Colours: successive marks cycle through the 6 colours starting with pink.
- [ ] Incorrect interaction: none possible; confirm hovering a mouse without pressing does not paint.
- [ ] Multi-touch: draw with two or three fingers at once.
- [ ] Limit: scribble for 10 s; the app stays responsive and marks fade out afterwards; the screen returns to plain dark.
- [ ] Restart: leave with Back and reopen; the canvas is empty and the cycle starts with pink.
- [ ] Progression: none expected.
- [ ] Portrait and landscape: rotate during painting; the canvas fills the screen and touches line up with marks.
- [ ] Touch, mouse and stylus input.
- [ ] Keyboard: Tab to the canvas (visible outline); arrows move the spot by 30 px and paint; Enter and Space paint in place; the spot stays inside the canvas.
- [ ] Background/foreground: switch tabs mid-fade; marks resume without jumping.
- [ ] Reduced motion: confirm marks still drift and fade (JavaScript-driven).
- [ ] Performance: on a low-end device draw continuously and watch for stutter.
- [ ] Browsers: Chrome desktop, Chrome Android, Safari iPhone/iPad.

## 18. Known limitations and open issues

**Confirmed**

- No colour choice and no clear button (by design).
- Motion is not reduced for `prefers-reduced-motion`.
- Mark size is fixed in pixels and not scaled to the screen.
- Fast strokes are limited to 3 marks per event.
- The keyboard light spot has no visible cursor of its own.

**Requires verification**

- Rendering performance with 150 simultaneous gradients on low-end devices.
- Brightness build-up of overlapping additive marks on very bright screens.

No open GitHub issue is specific to this activity.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- Similar: [Rysuj Kształty](rysuj-ksztalty.md) (tracing), [Bańki Mydlane](banki-mydlane.md) (touch-created soft visuals), [Akwarium Artura](akwarium-artura.md) (canvas with one rAF loop).
- Does not use [`js/random.js`](../../js/random.js) or [`js/animals.js`](../../js/animals.js).

## 21. Change history

- Issue [#8](https://github.com/BielinskiLukasz/child-page/issues/8) / PR [#15](https://github.com/BielinskiLukasz/child-page/pull/15): initial activity.
- Commit `72b4d31`: keyboard operability (arrows move and paint, Enter/Space paint) and a focus outline.

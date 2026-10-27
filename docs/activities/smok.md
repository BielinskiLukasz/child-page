# Lot na Smoku

Platform-wide behaviour (no sound, reduced motion, menu configuration, playtime limit, absence of automated tests, privacy) is described in [README.md](README.md#shared-platform-behaviour) and is not repeated here.

## 1. Overview

| Item | Value |
|---|---|
| Display name | Lot na Smoku |
| Activity ID | `smok` (registry entry in [`js/activities.js`](../../js/activities.js)) |
| Description | A friendly dragon with a small rider flies over a scrolling land. A finger steers it and a tap makes it breathe a little fire to light lanterns. |
| Category | Control skill; cause and effect; open-ended play; calming |
| Interaction type | Finger/mouse drag anywhere, tap on the dragon or a lantern, keyboard alternative |
| Status | Implemented; enabled in the menu by default (appended last, no `defaultOff`) |
| Source | [`js/smok.js`](../../js/smok.js), styles with prefix `sm-` in [`css/style.css`](../../css/style.css) |

## 2. Business purpose

- A free-flight activity with a scrolling world and gentle things to do; issue [#186](https://github.com/BielinskiLukasz/child-page/issues/186).
- Differs from [Latawiec](latawiec.md) (a kite on a string above a fixed board) and [Balon](balon.md) (vertical control only) by free two-axis steering over a scrolling landscape with changing biomes.

## 3. Activity flow

1. The child opens the tile; a green dragon with a rider flies to the right over hills, a castle and clouds; lanterns drift past.
2. Touching or dragging anywhere steers the dragon; it follows the finger smoothly and stays on screen.
3. Tapping a lantern or the dragon makes it breathe a short puff of fire (0.8 s); the flame reaches the tapped lantern (or the nearest unlit one ahead) after 0.45 s and the lantern glows warm.
4. Every 36 s the scenery blends (over 5 s) into the next biome: meadow, snow, sea, meadow, ... The landscape pattern repeats seamlessly every 60 s. There is no end. Exit: Back button or browser Back.

## 4. Rules and behavior

| Rule | Detail |
|---|---|
| Flight | The dragon never flies by itself; the world scrolls left at 0.12 screen widths per second (so the dragon moves right at constant speed). |
| Steering | Damped spring (stiffness 7, damping 5.4) toward the finger; speed capped at 0.6 screen widths per second. |
| Bounds | The target and the dragon are clamped so the whole dragon, wings and tail included, stays on screen; a resize re-clamps it. |
| Lanterns | A pool of 14 buttons (56 px) spaced screen width / 8 apart on three height levels, so at least 6 are fully visible at any time; they drift left at the scroll speed and are recycled (unlit) on the right. |
| Fire | A puff has a 0.35 s cooldown. Tapped lantern: it is lit; tap on/near the dragon (within about 90 design units) or Enter/Space: the nearest unlit lantern ahead of the mouth is lit (any nearest lantern when none is unlit). |
| Lit lanterns | Stay lit until they leave the screen. |
| Biomes | 36 s each, blended over 5 s: meadow (trees, flowers), snow (pines, snowy castle roofs), sea (waves, boats). |
| Failure, score | None; no obstacles, nothing hurts the dragon; nothing is scored or stored. |
| Faces, text, sound | The dragon always smiles (open mouth while breathing); no text, no sound. |

## 5. Educational and developmental benefits

**Intended design benefits**

- Smooth control of a following object in two directions; cause and effect (fire lights a lantern).

**Directly observable behavior**

- The dragon follows the finger smoothly and cannot leave the screen; lanterns light up after a puff.

**Requires professional or research-based validation**

- Any claim about learning or developmental benefits; nothing in the code can establish it.

## 6. Accessibility and usability

- **Input:** pointer events on the whole screen (touch, mouse, stylus); the child does not have to grab the dragon. Lantern buttons are 56 px; the dragon button is at least 56 px.
- **Keyboard:** Tab to the dragon (visible 4 px focus ring); arrow keys move the target by 10% of the screen width per press; Enter or Space breathes fire. Lanterns are also buttons (Tab, Enter).
- **Labels (Polish):** "Smok. Strzałki sterują lotem, Enter lub spacja zieje ogniem."; lanterns "Lampion"; scenery is decorative.
- **Non-colour cues:** a lit lantern also gains a glow and a brighter body.
- **Reduced motion:** everything moves from one JavaScript loop (wings, scenery, fire), so it behaves the same under `prefers-reduced-motion`; no end state exists only in a CSS keyframe.
- **Text:** none.

## 7. Risks and limitations

- Visual quality (dragon proportions, wing flap, scenery colours, biome blend) has not been checked on a device (sections 17 and 18).
- The activity never goes idle (the world always scrolls), so the loop runs until the child leaves or the tab is hidden.

## 8. Configuration

No external configuration. Constants at the top of [`js/smok.js`](../../js/smok.js): `LOOP_S` (60), `BIOME_S` (36), `BLEND_S` (5), `SPEED_W` (0.12), `VMAX` (0.6), `SK`, `SD`, `NL` (14), `LT_DIV` (8), `FIRE_S`, `HIT_S`, `COOLDOWN_S` and the `BIOMES` colour table.

## 9. Assets

No external asset files. The canvas scenery, the dragon (inline SVG) and the lanterns (inline SVG) are created by `js/smok.js`; the menu icon is inline SVG in `js/activities.js`.

## 10. Randomization and variants

None; the biome order and the lantern heights follow a fixed pattern.

## 11. Progression and difficulty

None; there are no levels and nothing persists.

## 12. Completion and feedback

Feedback: a flame stream and a glowing lantern. No failure state and no completion; the activity is open-ended.

## 13. Analytics and metrics

This activity reports to the shared on-device module `js/analytics.js` (`window.Analytics`). `js/app.js` records start and end and the module counts touches in the stage; `js/smok.js` additionally calls `Analytics.track('interaction', { variant })` with `steer` (a steering touch starts), `fire` (a puff) and `lantern` (a lantern newly lit). It never calls `complete()`; the activity is not in the module's `COMPLETABLE` list. All calls are wrapped so nothing changes if `window.Analytics` is missing. Data stays on the device; see [README.md](README.md#analytics-status).

## 14. Technical implementation

- **Entry point:** `mount(container)` in [`js/smok.js`](../../js/smok.js) overrides `mount` of the `smok` entry; returns a cleanup function.
- **Rendering:** `div.sm > canvas (scenery) + 14 button.sm-lt + svg.sm-svg (dragon) + button.sm-kb`. Layers (clouds, far hills, castle, near ground) scroll with a shared loop phase and have a whole number of pattern periods per loop, so the loop is seamless.
- **State:** dragon position and velocity, target, pitch, wing phase, lantern pool (x, level, lit, glow), current puff, time.
- **Loop:** one `requestAnimationFrame` loop with `dt` capped at 0.05 s, guarded by `!raf`, cancelled while the tab is hidden and restarted on `visibilitychange`; cleanup cancels it and removes listeners and DOM.
- **Persistence:** none. **Analytics:** section 13.

## 15. Responsive layout and coordinate system

- `.sm` is fixed full-screen; the canvas is resized to the screen times the device pixel ratio (at most 2). The dragon width is `clamp(0.36 x min(width, 1.5 x height), 110, 260)` px. Lantern x positions are rescaled when the width changes; their heights come from a band between the top and 78% of the height.
- Works from 320 x 568 to 1920 x 1080, portrait and landscape.

## 16. Error and edge-case handling

| Case | Behaviour |
|---|---|
| Finger near an edge | The target is clamped so the whole dragon stays visible. |
| Very fast finger | Dragon speed is capped at 0.6 screen widths per second. |
| Resize / orientation | Layout recomputed; the dragon is re-clamped; the scenery keeps scrolling without a jump of the loop phase. |
| Rapid taps | The 0.35 s cooldown limits puffs. |
| No lantern on screen | The puff goes forward and fades. |
| Several fingers | Only the first pointer steers. |
| Leaving mid-flight | Cleanup cancels the frame, removes listeners and the DOM. |
| Tab hidden | Loop cancelled and restarted on return; the `dt` cap prevents a jump. |
| `window.Analytics` missing | Calls are skipped. |

## 17. Testing

No automated tests exist. Manual scenarios (none are claimed as done):

- [ ] Drag to all four corners; the whole dragon stays on screen.
- [ ] Tap a lantern; a flame reaches it and it stays lit until it leaves the screen.
- [ ] Tap the dragon; the nearest lantern ahead lights.
- [ ] Watch 40 s; the scenery changes smoothly from meadow to snow, then to sea.
- [ ] Watch past 60 s; no jump in the scenery.
- [ ] Keyboard: Tab to the dragon, arrows, Enter/Space.
- [ ] Rotate the device mid-flight.
- [ ] Leave and reopen ten times quickly.
- [ ] Small screens (320 x 568, 568 x 320) and 1920 x 1080; reduced motion.

The PR for issue [#186](https://github.com/BielinskiLukasz/child-page/issues/186) reports a Node simulation with a stub DOM (bounds at the corners, speed cap, number of visible lanterns, cleanup); no visual check was possible.

## 18. Known limitations and open issues

**Confirmed**

- No automated tests.

**Requires verification**

- Look and feel of the dragon, scenery and biome blend on real devices.

## 19. Planned improvements

None currently planned.

## 20. Related activities and reusable components

- [Latawiec](latawiec.md), [Balon](balon.md), [Mały Samolot](maly-samolot.md).
- No shared component is used besides `window.Analytics`.

## 21. Change history

- Issue [#186](https://github.com/BielinskiLukasz/child-page/issues/186): initial activity.

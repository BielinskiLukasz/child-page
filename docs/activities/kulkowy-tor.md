# Kulkowy Tor

Status: implemented

- Issue: [#217](https://github.com/BielinskiLukasz/child-page/issues/217)
- Planned activity id: `kulkowy`
- Planned CSS prefix: `mt-`

## 1. Overview

Kulkowy Tor (`kulkowy`, module `js/kulkowy.js`, CSS prefix `mt-`): a soft red ball is dropped from the top and rolls down four ramps; the child turns the ramps to change where it goes. The ball ends in a basket with a friendly bear or on a cushion at the bottom edge.

## 2. Business purpose

Gentle cause and effect with simple, scripted physics where the child changes the path; unlike Ścieżka (follows a drawn line) the child shapes the route. No failure: the ball always finds a safe way down and starts again.

## 3. Activity flow

1. Four ramps are shown with a small arrangement chosen at random on every start. 2. The child touches a ramp to turn it (left, flat, right, left, ...) and touches the big ball button to drop a ball. 3. The ball falls from the hatch, follows the ramps it meets and reaches the basket or the cushion in about 4.5-5.7 s. 4. In the basket the bear catches it and waves; on the cushion the ball squashes, fades and reappears at the top after 1 s and falls again. 5. After three balls in the basket the track glows for 3 s and the ramps move to a new arrangement.

## 4. Rules and behavior

| Item | Value |
|---|---|
| Board | 400x360 units scaled to the screen; ramps at (200,72), (95,152), (305,152), (200,232); half length 65 units (130 long), tilt 22 degrees |
| Turn | Each touch cycles left, flat, right, left; the turn takes 0.4 s (smoothstep) and can be restarted at any time |
| Drop | Big button (72 px) releases a ball at x=190 above ramp 1; ignored while a ball is in play (at most one ball) |
| Speed | One constant speed of 80 units/s for falling and sliding (22% of the board height per second, cap is 40%); every one of the 81 arrangements arrives in 4.5-5.7 s |
| Sliding | The ball follows the ramp's current target: left or right slides to that end; flat slides to the nearer end (x below the ramp centre = left). Turning a ramp under the ball sends it the other way, so it never gets stuck |
| Landing | A falling ball lands on the first ramp whose span contains its x; leaving an end it falls on and meets the next ramp or the floor |
| Basket | Opening x 250-342; the ball dropping in counts as one caught ball; the bear raises both paws and waves for 1.6 s |
| Cushion | Anywhere else on the bottom edge; squash 0.3 s, fade-out from 0.7 s, back at the top at 1 s (0.3 s fade-in), then it falls again by itself |
| Round | Three balls in the basket light the three picture pips; the track glows (static drop-shadow) for 3 s and the ramps turn to a new random arrangement, different from the one they were left in and from the previous starting arrangement |

No score, no failure, no stored data, no text on screen.

## 5. Educational and developmental benefits

Cause and effect, planning a path in advance, comparing three positions of an object, patience while watching a motion.

## 6. Accessibility and usability

Ramps are focusable buttons (width = ramp length, at least 56 px high, ramps at least 80 px long down to 568x320); Tab goes through ramps 1-4 and then the drop button, Enter/Space activates. The tilt of the ramp is the non-colour cue; aria labels give the ramp number and position in Polish. The drop button is 72 px and shows a ball. Ramps and button are click-based, so two fingers cannot break the state.

## 7. Risks and limitations

Only checked with a node stub DOM and XML-style review of the markup; no real browser or device test was possible, so visual proportions (bear, basket) still need a manual look. Constant speed makes falling look floaty.

## 8. Configuration

None; there is no setting. The activity is enabled by default and appended at the end of the menu list.

## 9. Assets

Inline SVG scene (sky, hatch, ramps, cushion, basket, bear, pips) built in `scene()`; menu icon in `js/activities.js`. No sound, no external files.

## 10. Randomization and variants

The starting arrangement of the ramps is random on every mount and after every third basket ball (never equal to the arrangement just left nor to the previous starting arrangement).

## 11. Progression and difficulty

None: the same rules throughout.

## 12. Completion and feedback

A ball in the basket: bear waves 1.6 s, one more pip fills. Third ball: glow for 3 s and new arrangement. Cushion: soft squash and the ball returns to the top.

## 13. Analytics and metrics

Each ramp turn: `track('interaction', {variant: 'ramp1'..'ramp4'})`; each drop: `track('interaction', {variant: 'ball'})`; each ball in the basket: `complete()`. Automatic re-drops from the cushion and arrangement changes after a round are not reported.

## 14. Technical implementation

`mount` builds the DOM, attaches the root with `container.appendChild(root)`, and returns a cleanup that cancels the rAF loop and removes the resize, orientation and visibility listeners and the root. One rAF loop (dt capped at 0.05 s, stopped when idle or hidden, restarted on `visibilitychange`) advances the ramp angles, the ball state machine (`enter`, `fall`, `slide`, `cushion`, `basket`), the glow timer and the bear's wave. All final states are drawn by the loop, so reduced motion does not disable them.

## 15. Responsive layout and coordinate system

Board aspect 400/360 sized by CSS (`.mt-board`); portrait stacks board over the drop button, landscape puts the button to its right. `layout()` only repositions the transparent ramp buttons from the board width, so rotation or resize keeps every state. SVG sizing uses `.stage .mt-svg` and `.stage .mt-dropsvg`.

## 16. Error and edge-case handling

Rotation and resize during any state: only button positions are recomputed. Tab hidden: loop pauses, dt cap prevents a jump. Fast repeated touches on a ramp: each touch restarts the 0.4 s turn from the current angle. Second drop while a ball is in play: ignored. Ramp turned under the ball: the ball reverses; a falling ball landing in the swept band of a rising ramp lands on it.

## 17. Testing

Manual scenarios: (1) Open the activity: four ramps in a random arrangement, drop button visible below (portrait) or at the right (landscape). (2) Touch ramp 1: it turns in 0.4 s through left, flat, right. (3) Touch drop: one ball falls; touching again meanwhile does nothing. (4) Set ramp 1 right, ramp 3 left, ramp 4 right and drop three times: bear catches, pips fill, then the track glows 3 s and the ramps move. (5) Leave ramps on a cushion route: ball returns to the top after 1 s. (6) Tab through ramps and the drop button, use Enter/Space. (7) Rotate the device in the middle of a fall. (8) Enable reduced motion and repeat 2-4. Automated check used in development: a node stub-DOM harness ran all 81 arrangements (arrival 4.5-5.7 s) and a three-ball round.

## 18. Known limitations and open issues

Interpretation: after the cushion the ball is dropped again automatically (the issue says it 'starts again'). A flat ramp always sends a ball entering left of the centre to the left, so ramp 1 flat always leads left. No real-device verification.

## 19. Planned improvements

None planned.

## 20. Related activities and reusable components

Ścieżka (a different mechanic: follows a line), Wiatraczki (same single-rAF-loop pattern).

## 21. Change history

Initial implementation (issue #217).

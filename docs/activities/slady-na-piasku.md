# Ślady na Piasku

Status: implemented

- Issue: [#216](https://github.com/BielinskiLukasz/child-page/issues/216)
- Planned activity id: `slady`
- Planned CSS prefix: `sp-`

## 1. Overview

Ślady na Piasku (`slady`, module `js/slady.js`, CSS prefix `sp-`): a sand beach or a snowy field hides a picture (shell, starfish, snowman or tree). The child drags a finger and leaves paw prints, footprints or a wavy line that dig through the surface and slowly uncover the picture.

## 2. Business purpose

Fills the gap of an activity whose marks stay and uncover something (Malowanie Światłem fades away). Cause and effect with a small, calm reward.

## 3. Activity flow

1. A scene (sand or snow, alternating, the first random) and one of its two pictures are shown with three 56 px buttons (paws, footprints, wavy line; the first type is random). 2. Dragging leaves tracks of the chosen type that dig holes through the surface. 3. At about 70% of the picture uncovered the rest of the surface fades over 1 s, the picture glows for 3 s and a tiny animal (crab on sand, penguin on snow) appears. 4. After those 4 s a new surface and picture start.

## 4. Rules and behavior

| Item | Value |
|---|---|
| Scenes | sand (shell, starfish) and snow (snowman, tree); alternate every round, never the same twice in a row; a picture never repeats twice in a row |
| Paw prints | one every 40 px of path length, drawn along the heading |
| Footprints | one every 48 px, alternating 9 px left and right of the path |
| Wavy line | 16 px wide, round caps, a 9 px sine wiggle (period 56 px) around the finger path, a point every 6 px |
| Buttons | three 56 px buttons with distinct pictures (paw, sole, wave); the chosen one has a thick ring and `aria-pressed` |
| Goal | 40x40 grid of the cells inside the picture; a cell counts when a track centre lies within the track radius (paw 17 px, foot 15 px, line 8 px); at 70% the round ends |
| Pointers | only the first pointer draws; input is ignored during the fade and glow |

No score, no failure, no stored data, no text on screen.

## 5. Educational and developmental benefits

Cause and effect, fine motor control, patience (the picture appears slowly), imitation of animal and human tracks.

## 6. Accessibility and usability

The board is focusable: arrows move a 56 px ring (3% of the board per press); Enter or Space leaves a track under it, and holding it while pressing arrows draws along (the wavy line needs this). The three type buttons are reachable by Tab. The shape of each button and the different scene textures are the non-colour cues. All targets are at least 56 px; aria labels are in Polish.

## 7. Risks and limitations

Checked only with a node stub DOM (stroke flow, goal, scene alternation, metrics) and syntax checks; no browser or device run was possible, so the real look of the sand, the snow and the pictures still needs a manual look. Track sizes are fixed in px, so after rotation they keep their size while positions scale.

## 8. Configuration

None; enabled by default and appended at the end of the menu list.

## 9. Assets

Inline SVG pictures and animals as strings in `PICTURES` and `ANIMALS`, a canvas for the surface, menu icon in `js/activities.js`. No sound, no external files.

## 10. Randomization and variants

Starting scene and starting track type are random on every mount; the picture is random within the scene (never the same one twice in a row).

## 11. Progression and difficulty

None: the same rules throughout.

## 12. Completion and feedback

At 70%: 1 s fade of the remaining surface, 3 s glow of the picture with the animal, then a new scene.

## 13. Analytics and metrics

Each stroke start (touch or Enter/Space): `track('interaction', {variant: 'paw' | 'foot' | 'line'})`; each uncovered picture: `complete()`. Button changes are not reported.

## 14. Technical implementation

`mount` builds the DOM, attaches the root with `container.appendChild(root)` before `layout()` and returns a cleanup that cancels the rAF loop and removes the window and document listeners and the root. Tracks are stored as items (paw/foot: relative position, heading, side; line: relative points). The surface canvas is painted, then each item is dug with `destination-out`; a replay on resize redraws all items. The hit grid is built with `Path2D` + `isPointInPath`. One capped-dt rAF loop (only during fade and glow) drives opacity, so reduced motion changes nothing.

## 15. Responsive layout and coordinate system

Portrait: board over the three buttons in a row; landscape: board left, buttons in a column on the right, 72 px left padding keeps the Back button uncovered. The board size is pure CSS (`min(width, height minus reserved)`); SVG sizing uses `.stage .sp-svg` and `.stage .sp-btnsvg`.

## 16. Error and edge-case handling

Rotation or resize: canvas redrawn from relative data. Tab hidden: loop stops, strokes end, resumes on return. Second finger: ignored. Fast drags: the path is walked in steps so spacing and the grid have no holes. At most 5000 items per round.

## 17. Testing

Manual scenarios:
1. Open the activity: a scene and three buttons appear, one selected.
2. Drag with each type: spacing about 40 px (paws), 48 px alternating (feet), a smooth 16 px wavy line.
3. Uncover about 70% of the picture: the rest fades in 1 s, the picture glows, an animal appears; after 4 s a new scene of the other kind starts.
4. Rotate the device mid-round: tracks and uncovered area stay.
5. Keyboard: Tab to the board, arrows move the ring, Enter leaves a track, hold Enter with arrows to draw.
6. Touch with two fingers: the second is ignored.

Node stub-DOM simulation (all three types, four rounds each) checks alternation of scenes, one `interaction` per stroke and one `complete()` per round.

## 18. Known limitations and open issues

Look and proportions of the pictures not yet checked on a device.

## 19. Planned improvements

Optionally more pictures per scene.

## 20. Related activities and reusable components

Related: Malowanie Światłem (fading marks), Lustro (painting that stays), Latarka (revealing hidden items). No shared components.

## 21. Change history

- Implemented from issue #216.

# [Activity display name]

> Template for activity documentation. Copy this file to `docs/activities/<kebab-case-name>.md` (lowercase, no Polish characters), replace the title and fill in every section. Delete the italic instruction lines once a section is written.
>
> Rules: document the **current implementation in the repository** only. Use exact values from the code. Do not invent values, tests, configuration or benefits. Mark missing information as `Not currently documented` or `Not implemented`. Keep planned work only in sections 18-19. Link source files with relative paths (from `docs/activities/`, e.g. `../../js/akwarium.js`) and related activities with relative links (e.g. `[Dzień i Noc](dzien-i-noc.md)`). No personal data about children, ever. No medical, therapeutic or developmental guarantees.
>
> Shared platform behaviour (no sound, global reduced-motion rule, menu configuration, analytics status, absence of automated tests) is described once in [README.md](README.md#shared-platform-behaviour); link to it instead of repeating it, and only note activity-specific deviations.

## 1. Overview

*Include: display name, internal activity ID (`id` in `js/activities.js`), short description, activity category (calming, exploratory, matching, sorting, memory, counting, drawing, observation, coordination, cause and effect, open-ended play), target interaction type (tap, drag, trace, ...), current implementation status (e.g. Implemented; default state in the menu).*

## 2. Business purpose

*What the activity provides, why it is in the application, which user need it addresses, how it contributes to the whole application, and how it differs from or complements other activities. Be specific to this activity; avoid generic statements.*

## 3. Activity flow

*Numbered flow: 1. how it starts, 2. what is initially displayed, 3. what the child can interact with, 4. how the application responds, 5. whether there is a completion state, 6. what happens after completion, 7. how it restarts or generates another variant, 8. how the child exits. For open-ended activities state that there is no formal completion state and describe the interaction cycle.*

## 4. Rules and behavior

*Interaction rules, valid and invalid actions, randomization and selection rules, progression, success conditions, retry behaviour, animation, sound, timing, limits and thresholds, prevention of immediate repetition, weights. Give exact values (counts, grid sizes, durations, speeds, weights) taken from the code.*

## 5. Educational and developmental benefits

*Split into three labelled groups: **Intended design benefits** (e.g. attention, visual perception, counting, hand-eye coordination, cause and effect, calm observation, independent play; only those that apply), **Directly observable behavior** (what the code visibly does that relates to those intentions), **Requires professional or research-based validation** (claims that cannot be established from the code). No medical, therapeutic or developmental guarantees.*

## 6. Accessibility and usability

*Supported input (touch, mouse, stylus, keyboard if supported), portrait and landscape behaviour, responsive layout, target sizes and spacing, colour dependence and non-colour cues, contrast, sound dependence, animation intensity, reduced-motion behaviour, whether reading is required, whether a young child can use it independently. List accessibility limitations found in the current implementation.*

## 7. Risks and limitations

*Activity-specific risks: visual stimulation, rapid or flashing animation, reliance on colour, unclear or small targets, accidental interactions, repetitive content, scaling problems, performance on slow devices, activities without a clear ending, undesirable random combinations. Child-safety and privacy considerations where relevant.*

## 8. Configuration

*Table of configurable properties: name, purpose, type, default, allowed values/range, location (file and constant/function), changeable without modifying logic?, fallback when missing or invalid. If the activity has no external configuration (constants only inside its JS file), say so explicitly and list the tunable constants.*

## 9. Assets

*Activity-specific images, icons, backgrounds, illustrations, audio, animations, fonts, data files: repository path, format, purpose, naming, dimensions/aspect ratio, variants, fallback, licence/source if known. State explicitly when the activity has no external asset files (e.g. everything is inline SVG/CSS/canvas). Mention unused, duplicated or missing assets if found.*

## 10. Randomization and variants

*What is randomized, when, value pools (with sizes), whether repetition is allowed, how immediate repetition is prevented, weighted selection, whether the result persists during a session, how empty or invalid pools are handled. If nothing is randomized, say so.*

## 11. Progression and difficulty

*Initial difficulty, trigger, levels, changes between levels, maximum, reset behaviour, persistence between sessions. If there is no progression, state it explicitly.*

## 12. Completion and feedback

*Whether there is a completion state, success criteria, failure/retry behaviour, visual feedback, sound feedback (none, if silent), celebration, what happens afterwards, whether another round starts automatically. Open-ended activities: state that there is no formal completion state.*

## 13. Analytics and metrics

*Describe analytics status for this activity on the default branch, following [README.md](README.md#analytics-status). For each event type (`activity_start`, `activity_end`, `activity_complete`, `activity_restart`, `interaction`, `level_start`, `level_complete`) state whether it is emitted for this activity today, when, with which properties, whether it counts toward active time, and privacy notes. List supported metrics (starts, active time, average active time per start, completions, completion rate, replays, exit-before-completion, highest level, interactions) as supported / not supported. For open-ended activities prefer active time and interactions over a completion rate. No personally identifiable information; do not recommend collecting data that could identify a child.*

## 14. Technical implementation

*Main module and entry point, source files, state management, rendering approach (DOM/SVG/canvas), event handling, animation implementation, randomization implementation, progression implementation, configuration source, asset loading, analytics integration, shared components and utilities, dependencies, persistence, cleanup on leaving. Use file paths, function names and concise explanations; do not paste large code blocks.*

## 15. Responsive layout and coordinate system

*Supported sizes and orientations, layout rules, scaling strategy, coordinate system of static and moving elements (px, board units, percentages, viewBox, canvas logical size), handling of aspect-ratio differences, and how backgrounds, target areas and moving elements share one coordinate space.*

## 16. Error and edge-case handling

*How the activity handles: missing assets, invalid configuration, empty pools, insufficient unique items, interrupted animations, resize/orientation change, backgrounding, rapid repeated input, touch cancellation, restarting during an animation, unsupported browser features. List unhandled cases as known limitations.*

## 17. Testing

*Existing automated tests (the repository currently has none unless found), plus manual test scenarios specific to this activity: normal interaction, completion, incorrect interaction, restart/replay, randomization, progression, portrait, landscape, mobile touch, desktop mouse, background/foreground, supported browsers. Present scenarios as a checklist to be performed; do not claim a scenario was tested unless evidence exists in the repository or its PRs.*

## 18. Known limitations and open issues

*Confirmed defects, visual inconsistencies, technical debt, missing tests, missing assets, incomplete configuration, unsupported behaviour, related GitHub issues. Clearly separate **Confirmed** from **Requires verification**.*

## 19. Planned improvements

*Agreed but not yet implemented improvements, each linked to a GitHub issue where possible. `None currently planned` if there are none.*

## 20. Related activities and reusable components

*Similar activities (relative links), shared behaviour, shared components and assets (e.g. `js/animals.js`, `js/random.js`), reusable utilities, reference implementations.*

## 21. Change history

*Short activity-specific list of relevant issues and pull requests (`#NN` links to https://github.com/BielinskiLukasz/child-page). Do not duplicate the full Git history.*

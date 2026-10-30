# Changelog

All notable changes to *Spokojny Świat Artura* are recorded here, in the style of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The version is defined once, in [`js/version.js`](js/version.js); every release updates this file and that version.

## [Unreleased]

## [1.0.0] - YYYY-MM-DD
The date placeholder `YYYY-MM-DD` is replaced with the release date when the tag is created.

### Added
- 68 calm, silent, touch-driven activities for a three-year-old, each with a Back button, large touch targets, keyboard support and reduced-motion support (see [docs/activities/](docs/activities/README.md)).
- Parent-gated Settings (simple-sum gate, reached from a quiet gear icon on the main menu): enable, disable and reorder activities, and mark favourites shown in an "Ulubione" section.
- Daily playtime limit with a timer reset, an hourglass without numbers and a gentle time-up screen.
- On-device usage statistics (anonymous daily aggregates, no network) with JSON export and reset.
- Settings backup: save, copy and load the menu configuration and the limit as JSON.
- Installable PWA with offline support (network-first service worker with cache fallback).
- Proprietary "all rights reserved" [LICENSE](LICENSE), this changelog, a version line in the README and Settings, and a [release checklist](docs/RELEASE_CHECKLIST.md).

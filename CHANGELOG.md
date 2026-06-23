# Changelog

All notable user-facing changes to Hubble. Entries are written as work lands
(see the `changelog` skill), then harvested into the desktop release notes.

Format loosely follows [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added
- Windows desktop app: installer (NSIS) and portable `.exe` builds, produced automatically by CI
- Start Claude in your open folder straight from the toolbar (or File menu) so your agent gets instant access to your notes
- Settings are now reachable from the File menu on Windows and Linux
- New slash commands: code block, plus inline bold, italic, and inline code
- Selection toolbar: a floating bubble appears when you select text, with one-click bold, italic, inline code, strikethrough, and link
- Tables: insert and edit GFM tables (with `/table`), including resizable columns and column alignment that round-trips through Markdown

### Changed
- Windows and Linux use the native window frame so the minimize/maximize/close controls are always available

### Fixed

## [0.1.12] - 2026-06-23

### Changed
- New app icon
- Lowercase hubble wordmark on the welcome screen

### Fixed
- Pressing Enter at the end of a link no longer carries the link onto the next line

## [0.1.11] - 2026-06-21

### Added
- HTML Apps: view and run interactive HTML apps directly in the editor
- File APIs so HTML apps can read and write workspace files
- First-run onboarding with an HTML Apps callout
- Hubble now remembers your window size and position between launches
- Web homepage at hubble.md

### Changed
- Refreshed the desktop app icon
- Larger default window size on first launch
- Restyled task list checkboxes

### Fixed
- Slash menu no longer hides behind surrounding UI

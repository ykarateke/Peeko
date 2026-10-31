# Changelog

All notable changes to Peeko are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project documentation set (product, architecture, engineering, operations, planning).
- Product name finalized as **Peeko** (previously the working name "PageLens").
- **MIT** `LICENSE` (ADR-009).
- **M1 skeleton:** WXT + React + TypeScript project; side panel (Chrome `side_panel` / Firefox `sidebar_action`), background relay with inject-and-retry + `RestrictedTabError`, minimal content script. Both targets build green.
- **Styles panel UI** (first panel, mock data): toolbar, tabs (Styles/Assets/Inspect/Design), COLORS swatch grid with Pick Color / Export Palette, TYPOGRAPHY font cards with one-click CSS/TW copy and weight chips, footer.

### Planned
See [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md) for the milestone plan (M1–M6) toward v1.

<!--
Release template:

## [x.y.z] - YYYY-MM-DD
### Added
### Changed
### Fixed
### Removed
### Security
-->

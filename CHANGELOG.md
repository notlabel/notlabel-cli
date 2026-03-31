# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-03-30

### Added

- Inquiry highlight command group:
  - `notlabel inquiry highlight get <id>`
  - `notlabel inquiry highlight set <id>`
  - `notlabel inquiry highlight preview-activate <id>`
  - `notlabel inquiry highlight versions list <id>`
  - `notlabel inquiry highlight versions show <id> <version>`
  - `notlabel inquiry highlight versions revert <id> <version>`
- Public discovery command group:
  - `notlabel public list`
  - `notlabel public get <id>`
  - `notlabel public list-blocks <inquiryId>`
  - `notlabel public get-block <blockId>`
  - `notlabel public user-profile <username>`
- Social/tag commands:
  - `notlabel social inquiries stats <id>`
  - `notlabel social inquiries related <id>`
  - `notlabel social inquiries add-tags <id> --tags "..."`
  - `notlabel social inquiries remove-tag <id> <slug>`
  - `notlabel social tags popular`
  - `notlabel social tags search --q "..."`
- Research workflow enhancements:
  - `notlabel inquiry research add-blocks <id>`
  - `notlabel inquiry research annotations ...`
  - `notlabel inquiry research summary <id>`
- Agent helper entrypoints:
  - `notlabel skill`
  - `notlabel protocol`
  - `notlabel start`
- New docs and reference files:
  - `README.md`
  - `docs/COMANDOS.md`

### Changed

- Default CLI version bumped to `0.2.0`.
- Inquiry command tree now includes `highlight` and expanded research tooling.
- Added write-request provenance headers:
  - `x-notlabel-actor-label` (default `notlabel-cli`)
  - `x-request-id`
- `.env.example` documents optional `NOTLABEL_ACTOR_LABEL`.
- `docs/CLI_COMMANDS.md` expanded with highlight and workflow updates.
- Agent skill/protocol docs updated for public discovery, social tags, and highlights.

### Fixed

- HTTP client now safely handles empty successful responses (e.g. `204 No Content`) without JSON parse failures.
- Validation and UX improvements for block creation/update flows and command help coverage.


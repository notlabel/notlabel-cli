# Changelog

All notable changes to this project are documented in this file.

## [0.4.0] - 2026-04-01

### Added

- Block taxonomy extended to match the blocks API: `base_type` values **`dataset`**, **`correction`**, and **`agent_finding`** (validated on `--base-type` for add/update/list and public list-blocks).
- Optional CLI hygiene warnings in `block-data-hints` for those types (e.g. `target_block_id`, `confidence_score`, `format` / `columns`).
- Agent onboarding: `notlabel start` and `notlabel help` mention **`NOTLABEL_ACTOR_LABEL`** for write attribution (details in `notlabel skill`).
- Agent **SKILL.md**: richer block taxonomy guidance, document size limits, JSON field reference, and a **recommended fields** table (including **`--title`** on new blocks).

### Changed

- Single source of truth: **`BLOCK_BASE_TYPES`** in `src/commands/inquiry/types.ts` drives validation, help text, and `notlabel protocol` output (no duplicated allowlists).
- `notlabel inquiry research summarize` (`by_base_type`) includes the new base types.
- Documentation updates: `docs/CLI_COMMANDS.md`, `docs/COMANDOS.md`, `README.md`, `.env.example`; protocol copy aligned with taxonomy and agent payload hints.

## [0.3.0] - 2026-03-31

### Added

- Block lifecycle commands:
  - `notlabel inquiry research get-block <blockId>`
  - `notlabel inquiry research update-block <blockId>`
  - `notlabel inquiry research delete-block <blockId>`
- Topic-scoped block creation: `notlabel inquiry research add-block-on-topic <topicId>` (`POST /topics/:topicId/blocks`).
- Client-side validation helpers for linked blocks; optional warning when `source`/`reference` omits `url` in `--data`.
- Richer `add-block` / `add-block-on-topic` help text and `--data` / `--linked-blocks` examples.
- Shared lab hints after login: `src/commands/auth/lab-hints.ts`.

### Changed

- `notlabel auth whoami` (human mode) now prints the same **Next steps** and **API provenance** blocks as after `login`, plus wallet status.
- `Inquiry`, `Block`, and annotation TypeScript types aligned with backend schemas and serializers (e.g. `seed_topic_ids`, `topics`, `collaborators`, `my_role`, block actor/contribution fields).
- `notlabel inquiry get` human output shows topic/collaborator summary fields when present.
- `docs/CLI_COMMANDS.md`: block command docs, **Backend resource shapes** section; `README` / `COMANDOS` pointers; skill and protocol text updated (`items` vs `blocks`, CRUD workflow).

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


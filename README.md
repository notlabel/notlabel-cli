# notlabel-cli

Official CLI for [notlabel.org](https://notlabel.org).

Use it to authenticate, create/manage inquiries, append research blocks, publish inquiry highlights, discover public investigations, and query social/tag metadata.

## Install

### Via install script (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/notlabel/notlabel-cli/main/install.sh | bash
```

### Local development

```bash
bun install
bun run src/index.ts --help
```

## Configuration

Create `.env` (or copy from `.env.example`):

```env
NOTLABEL_API_URL=https://notlabel-services.notlabel.org/api/v1
NOTLABEL_FRONTEND_URL=https://notlabel.org
# Optional provenance label for write requests:
# NOTLABEL_ACTOR_LABEL=bench-agent
```

- `NOTLABEL_API_URL`: Backend API base URL.
- `NOTLABEL_FRONTEND_URL`: Frontend URL used during browser login.
- `NOTLABEL_ACTOR_LABEL` (optional): Sent in `x-notlabel-actor-label` for write operations.

## Quick Start

```bash
# 1) Login
notlabel auth login

# 2) Create an inquiry
notlabel inquiry create --raw-input "How does climate affect crop yields?" --type question --json

# 3) Add a research block
notlabel inquiry research add-block <inquiry-id> \
  --content "Initial hypothesis and baseline assumptions" \
  --base-type note \
  --kind note \
  --json

# 4) Publish a highlight (summary + full markdown report)
notlabel inquiry highlight set <inquiry-id> \
  --title "Climate impact on crop yields" \
  --abstract "Initial evidence suggests temperature and precipitation variance affect yields by region..." \
  --key-findings '["Heat stress lowers maize yields","Rain variability increases uncertainty"]' \
  --body-md "# Full report\n\nWorking draft..." \
  --json
```

## Main Command Groups

- `notlabel auth` - login/logout/whoami.
- `notlabel inquiry` - create/get/update/list/activate plus `highlight` and `research`.
- `notlabel public` - read-only discovery of public inquiries and blocks.
- `notlabel social` - inquiry stats/related and tag operations.
- `notlabel notifications` - poll and acknowledge updates.
- `notlabel skill`, `notlabel protocol`, `notlabel start` - agent-oriented helpers.

Run `notlabel help` and `notlabel <command> --help` for details.

## Documentation

- Full command reference: `docs/CLI_COMMANDS.md`
- Short command list: `docs/COMANDOS.md`
- Release history: `CHANGELOG.md`

## What's New in v0.2.0

- Inquiry highlight workflows:
  - `inquiry highlight get`
  - `inquiry highlight set`
  - `inquiry highlight preview-activate`
  - `inquiry highlight versions list/show/revert`
- Public discovery commands:
  - `public list`, `public get`
  - `public list-blocks`, `public get-block`, `public user-profile`
- Social/tag commands:
  - `social inquiries stats`, `related`, `add-tags`, `remove-tag`
  - `social tags popular`, `search`
- Research workflow improvements:
  - batch block creation: `inquiry research add-blocks`
  - inquiry annotations (comments)
  - research summary command
- HTTP provenance on writes with optional `NOTLABEL_ACTOR_LABEL`.
- Expanded docs and agent helper commands (`skill`, `protocol`, `start`).

## Development

```bash
# Type check
bun run typecheck

# Build standalone binary
bun run build
```

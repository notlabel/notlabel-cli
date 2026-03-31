---
name: notlabel-cli
description: >-
  Operate the notlabel research platform via CLI. Create and manage Inquiries
  (Orbit central topics), append research blocks (notes, sources, insights,
  experiments, code), poll notifications for delta updates, and activate orbit
  graphs. Use when the user mentions notlabel, inquiries, research blocks,
  orbit graphs, seed topics, or asks to log research, create an inquiry,
  add a research note, check notifications, or activate an orbit.
---

# notlabel CLI

The `notlabel` CLI is the primary interface for agents to interact with the notlabel research platform. It manages **Inquiries** (central research topics) and their **Blocks** (research canvas entries), plus a notification inbox for delta polling.

## Prerequisites

1. Install: `curl -fsSL https://raw.githubusercontent.com/notlabel/notlabel-cli/main/install.sh | bash`
2. Authenticate: `notlabel auth login` (opens browser OAuth flow)
3. Verify: `notlabel auth whoami --json`

The CLI calls `NOTLABEL_API_URL` (default `https://notlabel-services.notlabel.org/api/v1`). Override via `.env` or env var.

**HTTP provenance:** On writes (POST/PATCH/PUT/DELETE), the CLI sends `x-notlabel-actor-label` (default `notlabel-cli`) and `x-request-id` per run. Set **`NOTLABEL_ACTOR_LABEL`** to a stable name for your agent (e.g. `bench-agent`). If you call the API with `fetch`/curl instead of this CLI, send **`x-notlabel-actor-label`** the same way so the backend can distinguish agent vs manual UI.

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Inquiry** | Central research topic. Has `raw_input`, `refined_statement`, `type`, `status`, `preferred_language` (BCP-47; default `en`), `confidence`, `seed_topics`. Lifecycle: `drafting` → `active` → `archived`. |
| **Block** | Research entry under an Inquiry. Has `base_type` (taxonomy) and `kind` (free-form label). |
| **Block annotation** | Comment on a block (social layer): `body`, optional `parent_annotation_id` for replies on the **same block**. Anyone with inquiry read access can add; lists include author, block preview, and actor provenance when the client sent it. |
| **Orbit Graph** | Generated on activation from `seed_topics`. Nodes = topics, edges = connections. |
| **Notification** | Delta feed for new research updates. |

### Block Taxonomy

| `base_type` | `kind` examples | `data` conventions |
|-------------|----------------|-------------------|
| `source` | `reference` | `{ url, title, authors[], year? }` |
| `note` | `note`, `goal`, `question` | goals: `{ priority?: "high"\|"medium"\|"low" }` |
| `insight` | `insight` | Use `--linked-blocks` to connect to source blocks |
| `experiment` | `experiment` | Experimental observations |
| `code` | `code`, `snippet` | Code artifacts |
| `custom` | any label | Free-form |

## Agent Research Workflow

### Step 1: Create or select an Inquiry

```bash
# Create new
notlabel inquiry create --raw-input "<user research question>" --type exploration --json

# Or list existing
notlabel inquiry list --status active --json

# Inspect one
notlabel inquiry get <id> --json
```

Capture `inquiry.id` from the response.

### Step 2: Refine the Inquiry (recommended)

```bash
notlabel inquiry update <id> \
  --refined-statement "Clearer version of the question" \
  --seed-topics "topic1,topic2,topic3" \
  --confidence 0.85 \
  --json
```

If the inquiry already has a **ready** orbit graph, new `seed_topics` are automatically added as nodes with edges to existing nodes.

### Step 3: Append research blocks

Prefer many small blocks over one large block.

```bash
notlabel inquiry research add-block <id> \
  --content "Finding or observation text" \
  --base-type note \
  --kind note \
  --title "Short title" \
  --json
```

Add a source reference:

```bash
notlabel inquiry research add-block <id> \
  --content "Key findings from paper" \
  --base-type source \
  --kind reference \
  --data '{"url":"https://...","title":"Paper Title","authors":["Author"],"year":2025}' \
  --json
```

Add an insight linking other blocks:

```bash
notlabel inquiry research add-block <id> \
  --content "Synthesis connecting findings" \
  --base-type insight \
  --kind insight \
  --linked-blocks blockId1,blockId2 \
  --json
```

### Step 3a: Discover public inquiries (optional)

Browse others’ public work with the same login (JWT). No API key needed in the CLI.

```bash
notlabel public list --page 0 --limit 20 --json
notlabel public get <public-inquiry-id> --json
notlabel public list-blocks <public-inquiry-id> --page 0 --limit 20 --json
```

To collaborate beyond read-only discovery, use invitations or fork flows in the product; then use `inquiry` / `inquiry research` on inquiries you can access.

### Step 3b: Comments on blocks (optional)

Use annotations when the user or agent should discuss a specific block (questions, review, threading).

```bash
notlabel inquiry research annotations list-block <inquiry-id> <block-id> --json
notlabel inquiry research annotations add <inquiry-id> <block-id> --body "…" --json
# Reply (parent must be an annotation on the same block):
notlabel inquiry research annotations add <inquiry-id> <block-id> --body "…" --parent <annotation-id> --json
```

### Step 3c: Inquiry highlight / summary (optional)

Publish a structured preview (`title`, `abstract`, `key_findings`, …) and an optional long **markdown** report (`body_md`). **PUT is owner-only**; collaborators can **GET**.

```bash
notlabel inquiry highlight get <inquiry-id> --json
# Inline or --file JSON; see `notlabel inquiry highlight set --help`
notlabel inquiry highlight set <inquiry-id> --title "…" --abstract "…" --key-findings '["…","…"]' --json
# AI draft + activate inquiry:
notlabel inquiry highlight preview-activate <inquiry-id> --json
```

### Step 3d: Tags (optional social metadata)

Tags are managed via the social API and are persisted in `InquiryStats` (not on the inquiry document).

```bash
# Add tag labels (backend normalizes to slug)
notlabel social inquiries add-tags <inquiry-id> --tags "machine learning,open science"

# Remove by slug
notlabel social inquiries remove-tag <inquiry-id> machine-learning

# Read current tags via stats
notlabel social inquiries stats <inquiry-id> --json
```

### Step 4: Read back the canvas

```bash
# All blocks (paginated)
notlabel inquiry research list-blocks <id> --page 0 --limit 20 --json

# Only insights
notlabel inquiry research list-blocks <id> --kind insight --page 0 --limit 20 --json

# Only sources
notlabel inquiry research list-blocks <id> --kind reference --json
```

Response: `{ items: Block[], pagination: { total, limit, page, has_next } }`.

### Step 5: Poll notifications (delta feed)

Instead of re-reading all blocks every cycle, poll for deltas:

```bash
# Check for new updates
notlabel notifications list --unread-only --json

# After processing, acknowledge
notlabel notifications read <notification-id> --json
```

### Step 6: Activate the Inquiry

Only after the user confirms the refined statement:

```bash
notlabel inquiry activate <id> --json
```

Returns `{ inquiry, orbit_graph_id? }`. Activation triggers orbit graph generation from current `seed_topics`. Blocks can be added before and after activation.

## Typical Agent Loop

1. Start from an Inquiry (create or select).
2. Poll `notlabel notifications list --unread-only --json` for fresh updates.
3. For each investigation step, append a block with appropriate `base_type`/`kind`.
4. Periodically read `--kind insight --page 0 --limit 20 --json` for incremental insight review.
5. Activate when the user confirms the refined statement.

## Key Rules

- Always use `--json` for machine-readable output.
- `raw_input` is **immutable** after inquiry creation; use `--refined-statement` to iterate.
- `seed_topics` is a comma-separated list on `inquiry update`.
- The CLI does not expose orbit graph mutation commands; those are backend/frontend only.
- Run `notlabel help` for the command overview; `notlabel protocol` for the canvas protocol text; `notlabel skill` prints this document.

## Discovery Commands (short)

| Command | Purpose |
|---------|---------|
| `notlabel skill` | Print this SKILL.md (agent onboarding, same as Cursor skill body). |
| `notlabel protocol` | Print the research canvas protocol (block conventions, delta loop). |
| `notlabel start` | Minimal quick-start sequence for the lab. |
| `notlabel help` | Command overview. |
| `notlabel config --json` | Show backend URL. |

For every flag and subcommand, use `notlabel <command> --help` or see `docs/CLI_COMMANDS.md` in the notlabel-cli repository.

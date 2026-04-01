---
name: notlabel-cli
description: >-
  Operate the notlabel research platform via CLI. Create and manage Inquiries,
  append research blocks (notes, sources, insights, experiments, code), add
  block annotations for human–agent collaboration, browse public inquiries,
  poll notifications for delta updates, and optionally refine inquiries or
  trigger activation when needed. Use when the user mentions notlabel,
  inquiries, research blocks, annotations, public discovery, seed topics,
  notifications, or asks to log research or add a research note.
---

# notlabel CLI

The `notlabel` CLI is the primary interface for agents to interact with the notlabel research platform. It manages **Inquiries** (central research topics), **Blocks** (research canvas entries), **Annotations** (threaded comments on blocks), and a **notification** inbox for delta polling—the same API semantics the web app uses.

**Collaboration:** Humans and agents share the inquiry canvas; use **annotations** to discuss a specific block without rewriting its body. **Public** inquiries and blocks are discoverable with the same JWT after `auth login`.

## Prerequisites

1. Install: `curl -fsSL https://raw.githubusercontent.com/notlabel/notlabel-cli/main/install.sh | bash`
2. Authenticate: `notlabel auth login` (opens browser OAuth flow); alias: `notlabel login`
3. Verify: `notlabel auth whoami --json`

The CLI calls `NOTLABEL_API_URL` (default `https://notlabel-services.notlabel.org/api/v1`). Override via `.env` or env var.

**HTTP provenance:** On writes (POST/PATCH/PUT/DELETE), the CLI sends `x-notlabel-actor-label` (default `notlabel-cli`) and `x-request-id` per run. Set **`NOTLABEL_ACTOR_LABEL`** to a stable name for your agent (e.g. `my-research-agent`). If you call the API with `fetch`/curl instead of this CLI, send **`x-notlabel-actor-label`** the same way so the backend can distinguish agent vs manual UI.

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Inquiry** | Central research topic. Fields include: `raw_input`, `refined_statement`, `type`, `status`, `confidence` (0–1), `privacy` (`private` \| `public`), `preferred_language` (API defaults to `en`; schema allows at least `en` and `es`), `seed_topics` (string labels), `seed_topic_ids`, `root_topic_id` / `root_topic`, `orbit_graph_id`, `activated_at`, `collaborators` as `{ user_id, role: viewer\|editor\|maintainer }` (owner is the inquiry `user_id`). On **GET /inquiries/:id** with JWT, the API also returns `topics` (de-duplicated: `id`, `label`, `slug`, `description`) and `my_role` (`owner` \| collaborator role). Lifecycle: `drafting` → `active` → `archived`. **New inquiries are often created `active` by default**—always use `notlabel inquiry get <id> --json` to confirm `status` in your environment. |
| **Block** | Research entry. Scoped by **`inquiry_id`** (primary inquiry canvas) and/or **`topic_id`** (topic-scoped / pre-promotion canvas). Has `base_type`, `kind`, optional `title` / `content`, `data` (mixed JSON), `linked_block_ids`, `privacy`, `is_pinned`. Responses may include **actor provenance** (`actor_kind`: `user_manual` \| `agent`, `actor_label`, `correlation_id`) when the write carried HTTP provenance headers. Collaborator **contributions** may include `contribution_kind`, `contribution_review_status` (`pending` \| `approved` \| `rejected`), review timestamps, and rejection reason. New blocks typically **inherit inquiry privacy** unless you set `--privacy`. |
| **Block annotation** | Comment on a block: `body`, optional `parent_annotation_id` (must be on the **same block**). Schema stores `hidden` and `deleted_at`; **lists omit** soft-deleted rows. Non-moderators typically do not see others’ `hidden: true` annotations in list results (unless they are the author). List/create payloads include `user` (`id`, `username`, `display_name`) and `block` preview (`id`, `title`, `kind`) plus optional actor fields. |
| **Orbit Graph** | Optional: generated when an inquiry is **activated** from seed topics (nodes = topics, edges = connections). Not required for everyday block capture. |
| **Notification** | Delta feed for new research updates. |

**Tip:** Always use `notlabel inquiry get <id> --json` when agents need exact collaborator roles, full `topics` arrays, `seed_topic_ids`, or current **`status`**.

### Block Taxonomy

**`base_type`** is the **stable, queryable taxonomy** (enforced by the API). Prefer a **first-class** `base_type` for recurring scientific shapes so filters, analytics, and UIs stay consistent. **`kind`** is a free-form sub-label within that type—keep it consistent per project.

**`custom`** exists as a **general escape hatch**: use it **sparingly** when a one-off payload does not fit any named type. If a pattern repeats (new instrument, new artifact class), add a dedicated `base_type` in the backend rather than overloading `custom`.

Put structured payloads in **`data`** (JSON). Link evidence with **`--linked-blocks`** (stored as `linked_block_ids`).

| `base_type` | `kind` examples | `data` conventions (suggested) |
|-------------|----------------|----------------------------------|
| `source` | `reference`, `paper`, `url` | `{ url, title, authors[], year?, publisher? }` |
| `note` | `note`, `goal`, `question` | Goals: `{ priority: "high"|"medium"|"low", status?: "todo"|"done" }`; plain notes often omit `data` or use a short `{ summary }`. |
| `insight` | `insight`, `synthesis`, `finding` | Use **`--linked-blocks`** to point to source or note blocks used as evidence. Optional `{ key_claim }` in `data` if helpful. |
| `experiment` | `experiment`, `ablation`, `lab_run` | `{ method, hypothesis?, results?, metrics?: Record<string, unknown> }` |
| `dataset` | `csv`, `json`, `raw` | `{ size, rows?, format, columns[], license? }` |
| `correction` | `erratum`, `fix` | `{ target_block_id, reason, previous_value? }` |
| `agent_finding` | `pattern`, `prediction` | `{ confidence_score: 0.0–1.0, model_id, logic_path? }` |
| `code` | `snippet`, `script` | `{ language, environment?, version?, repo_url? }` |
| `custom` | any label | **Free-form JSON object:** `kind` is unconstrained (e.g. `lab_note`, `instrument_readout`, `vendor_metadata`); `data` is any JSON object the inquiry needs for a **one-off** artifact—e.g. `{ "instrument": "spectrometer-A", "readings": [0.12, 0.15], "unit": "nm" }` or `{ "vendor": "…", "sku": "…", "lot": "…" }`. No fixed schema; use **only** when nothing in the rows above fits. If the same structure appears often, add a dedicated `base_type` instead of encoding it repeatedly under `custom`. |

**Note:** Each block response may include **`actor_kind`** (`user_manual` \| `agent`) and **`actor_label`** when the client sent HTTP provenance on write—the CLI sets **`NOTLABEL_ACTOR_LABEL`** / `x-notlabel-actor-label` so you can tell manual UI edits from agent writes. **`user_id`** on the block remains authoritative for ownership.

### Block size and file references

- **Maximum stored size:** Each block is one **MongoDB document** (BSON). The server limit is **16 MB per document** for the **entire** block—`content`, `title`, `kind`, serialized **`data`**, and other fields count together. The API does not define smaller per-field caps today; keep payloads well under **16 MB** total.
- **Files and binaries:** Do **not** embed raw file bytes inside `content` or `data`. For PDFs, datasets, images, or other uploads, store them in **external storage** (S3, IPFS, etc.) and reference them with **URLs** in structured `data` (e.g. `url`, `artifact_url`, `download_url`) or use the backend **block resources** API (`uri` + `resource_type`) when building against **notlabel-services** directly. The **notlabel-cli** does not expose block-resource management commands yet—agents should pass **`--data`** with **URL strings** (and metadata) so the canvas stays link-based, not blob-based.

### Recommended fields when creating blocks

Use these on every `add-block` / `add-block-on-topic` when it makes sense so lists, notifications, and UIs stay scannable.

| Field | Guidance |
|-------|----------|
| **`--title`** | **Strongly recommended:** 3–12 words summarizing the block. Many surfaces show title + kind before `content`; blocks without a title are harder to skim. |
| **`--content`** | Main body (finding, observation, quote context). Still required for most block types even when `data` carries structured fields. |
| **`--data`** | Match the **Block Taxonomy** table for your `base_type` / `kind` (sources, goals, experiments, datasets, corrections, agent findings, code, etc.). |
| **`--linked-blocks`** | **Insights** and structured syntheses: comma-separated ids of evidence blocks in the same inquiry (maps to `linked_block_ids`). |

Optional: `--privacy`, and `--pinned` via `update-block` when the canvas should highlight a block.

## JSON field reference (`--json` output and writes)

Use this to know which fields appear in API responses and what matters for parsing. **Authoritative detail** and edge cases: `docs/CLI_COMMANDS.md` in this repository (**Backend resource shapes**), aligned with **notlabel-services** serializers.

### Inquiry (authenticated `GET /inquiries/:id`)

Core: `raw_input`, `refined_statement`, `type`, `status`, `confidence`, `privacy`, `preferred_language`, `orbit_graph_id`, `activated_at`, timestamps.

| Field | Meaning |
|--------|---------|
| `seed_topics` | String labels. |
| `seed_topic_ids` | Topic document ids. |
| `root_topic_id`, `root_topic` | Root topic id and optional `{ id, label, slug, description }`. |
| `topics` | De-duplicated topic summaries (`id`, `label`, `slug`, `description`). |
| `collaborators` | `{ user_id, role: viewer\|editor\|maintainer, user?: { … } }[]`. Owner is `user_id` on the inquiry. |
| `my_role` | `owner` \| `viewer` \| `editor` \| `maintainer` for the current user. |

Public discovery responses omit collaborator-rich shapes.

### Block (create / get / list `items[]`)

| Area | Fields / notes |
|------|----------------|
| Scope | `inquiry_id` and/or `topic_id`. |
| Taxonomy | `base_type`, `kind`, `title`, `content`, `data` (object), `linked_block_ids`, `privacy`, `is_pinned`. |
| Size | Whole document must fit MongoDB’s **16 MB** BSON limit (all fields combined). |
| Files | Prefer **URLs in `data`** (or block resources via API)—not binary payloads in the block. |
| Actor (when present) | `actor_kind` (`user_manual` \| `agent`), `actor_label`, `correlation_id`. |
| Contributions (when present) | `contribution_kind`, `contribution_review_status`, review metadata. |

**Create body** (via CLI flags): `content` (required on add), `base_type`, `kind`, `title`, `data`, `linked_block_ids`, `privacy`.

### Block annotation (list / create)

| Area | Notes |
|------|--------|
| Create | `{ body: string (1–8000), parent_annotation_id?: string }` — parent must be on the **same block**. |
| List items | `body`, `parent_annotation_id`, `hidden`, `user`, `block` preview, optional `actor_*`, timestamps. |

## Agent Research Workflow

### Step 1: Create or select an Inquiry

```bash
# Create new (backend often returns status active by default—confirm with get)
notlabel inquiry create --raw-input "<user research question>" --type exploration --json

# Or list existing
notlabel inquiry list --status active --json

# Inspect one—read status, collaborators, topics
notlabel inquiry get <id> --json
```

Capture `inquiry.id` from the response. **Do not assume `drafting`** unless `get` shows it.

### Step 2: Refine the Inquiry (optional)

```bash
notlabel inquiry update <id> \
  --refined-statement "Clearer version of the question" \
  --seed-topics "topic1,topic2,topic3" \
  --confidence 0.85 \
  --json
```

If the inquiry already has a **ready** orbit graph, new `seed_topics` are automatically added as nodes with edges to existing nodes.

### Step 3: Append research blocks

Prefer many small blocks over one large block. **Set `--title`** on each new block when possible (see **Recommended fields when creating blocks** above).

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
  --data '{"url":"https://...","title":"Paper Title","authors":["Author"],"year":2026}' \
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

Edit, inspect, or remove a block:

```bash
notlabel inquiry research get-block <block-id> --json
notlabel inquiry research update-block <block-id> --content "Corrected text" --json
notlabel inquiry research delete-block <block-id> --json
```

Block scoped to a **Topic** (pre-inquiry canvas; API `POST /topics/:topicId/blocks`):

```bash
notlabel inquiry research add-block-on-topic <topic-id> \
  --content "Note tied to this topic" --base-type note --kind note --json
```

Batch import (same payload shape as `add-block`, JSON array file):

```bash
notlabel inquiry research add-blocks <id> --file ./blocks.json [--on-error continue|stop] --json
```

Canvas snapshot without paging every block:

```bash
notlabel inquiry research summary <id> --json
```

Run `notlabel inquiry research add-block --help` for `--data` examples and `--linked-blocks` usage.

### Step 4: Discover public inquiries (optional)

Browse others’ public work with the same login (JWT). No API key needed in the CLI.

```bash
notlabel public list --page 0 --limit 20 --json
notlabel public get <public-inquiry-id> --json
notlabel public list-blocks <public-inquiry-id> --page 0 --limit 20 --json
notlabel public get-block <block-id> --json
notlabel public user-profile <username> --json
```

To collaborate beyond read-only discovery, use invitations or fork flows in the product; then use `inquiry` / `inquiry research` on inquiries you can access.

### Step 5: Comments on blocks (optional)

Use annotations when the user or agent should discuss a specific block (questions, review, threading).

```bash
notlabel inquiry research annotations list-block <inquiry-id> <block-id> --json
notlabel inquiry research annotations list-inquiry <inquiry-id> --json
notlabel inquiry research annotations add <inquiry-id> <block-id> --body "…" --json
# Reply (parent must be an annotation on the same block):
notlabel inquiry research annotations add <inquiry-id> <block-id> --body "…" --parent <annotation-id> --json
notlabel inquiry research annotations delete <inquiry-id> <block-id> <annotation-id> --json
notlabel inquiry research annotations set-hidden <inquiry-id> <block-id> <annotation-id> --hidden true|false --json
```

### Step 6: Inquiry highlight / summary (optional)

Publish a structured preview (`title`, `abstract`, `key_findings`, …) and an optional long **markdown** report (`body_md`). **PUT is owner-only**; collaborators can **GET**.

```bash
notlabel inquiry highlight get <inquiry-id> --json
# Inline or --file JSON; see `notlabel inquiry highlight set --help`
notlabel inquiry highlight set <inquiry-id> --title "…" --abstract "…" --key-findings '["…","…"]' --json
# AI-generated highlight + optional activation side effects—see --help
notlabel inquiry highlight preview-activate <inquiry-id> [--evidence-block-ids id1,id2] --json
# Revision history (owner revert):
notlabel inquiry highlight versions list <inquiry-id> --json
notlabel inquiry highlight versions show <inquiry-id> <version> --json
notlabel inquiry highlight versions revert <inquiry-id> <version> --json
```

### Step 7: Tags and related inquiries (optional social metadata)

Tags are managed via the social API and are persisted in `InquiryStats` (not on the inquiry document).

```bash
notlabel social inquiries add-tags <inquiry-id> --tags "machine learning,open science"
notlabel social inquiries remove-tag <inquiry-id> machine-learning
notlabel social inquiries stats <inquiry-id> --json
notlabel social inquiries related <inquiry-id> [--limit 20] --json
notlabel social tags popular [--limit 50] --json
notlabel social tags search --q "<text>" [--limit 50] --json
```

### Step 8: Read back the canvas

```bash
# All blocks (paginated)
notlabel inquiry research list-blocks <id> --page 0 --limit 20 --json

# Filters: --base-type, --kind, --pinned true|false, --sort updatedAt:desc|createdAt:desc
notlabel inquiry research list-blocks <id> --kind insight --page 0 --limit 20 --json

# Only sources (by kind label)
notlabel inquiry research list-blocks <id> --kind reference --json
```

JSON shape: `{ "items": Block[], "pagination": { "total", "limit", "page", "has_next" } }`. The array field is **`items`**, not `blocks`. Use `notlabel inquiry research get-block <block-id> --json` to fetch one block without scanning pages.

### Step 9: Poll notifications (delta feed)

Instead of re-reading all blocks every cycle, poll for deltas:

```bash
notlabel notifications list --unread-only --json
notlabel notifications read <notification-id> --json
# When a tracked link provides a source token:
notlabel notifications read-by-source <source> --json
```

### Step 10: Activate the Inquiry (optional)

**Not required** for normal research capture: new inquiries are often **`active` already**. Use **`inquiry activate`** only when the product flow or user explicitly needs the transition (e.g. orbit graph generation from `seed_topics`, or a legacy drafting workflow).

```bash
notlabel inquiry activate <id> --json
```

Returns `{ inquiry, orbit_graph_id? }`. Activation can trigger orbit graph generation from current `seed_topics`. Blocks can be added before and after activation.

## Typical Agent Loop

1. Start from an Inquiry (create or select); confirm **`status`** with `inquiry get` if your logic depends on it.
2. Poll `notlabel notifications list --unread-only --json` for fresh updates.
3. Append blocks with appropriate `base_type`/`kind`; use **annotations** when collaborating on a specific finding.
4. Use **`public list` / `public get`** when the task involves community or read-only discovery.
5. Periodically read `list-blocks` with filters (`--kind`, `--base-type`, `--sort`) or `research summary` for a compact overview.
6. Call **`inquiry activate`** only when activation is explicitly required—do not assume a separate “activation gate” for every inquiry.

## Key Rules

- Always use `--json` for machine-readable output.
- `raw_input` is **immutable** after inquiry creation; use `--refined-statement` to iterate.
- `seed_topics` is a comma-separated list on `inquiry update`.
- **Privacy:** set `--privacy` on blocks deliberately when publishing; defaults usually follow the inquiry.
- The CLI does **not** expose orbit graph **mutation** endpoints (`/orbit-graphs/...`); those are backend/frontend only.
- Do **not** assume CLI commands that are not in this document exist (e.g. `lab`, `mcp`, `repo` upload)—verify with `notlabel help` and this repo’s `docs/CLI_COMMANDS.md`.
- Run `notlabel help` for the command overview; `notlabel protocol` for the canvas protocol text; `notlabel skill` prints this document.

## Discovery Commands (short)

| Command | Purpose |
|---------|---------|
| `notlabel skill` | Print this SKILL.md (agent onboarding, same as Cursor skill body). |
| `notlabel protocol` | Print the research canvas protocol (block conventions, delta loop). |
| `notlabel start` | Minimal quick-start sequence for the lab. |
| `notlabel help` | Command overview. |
| `notlabel login` | Alias for `notlabel auth login`. |
| `notlabel config --json` | Show backend URL. |
| `notlabel --version` / `-V` | CLI version. |

For every flag and subcommand, use `notlabel <command> --help` or see `docs/CLI_COMMANDS.md` in the notlabel-cli repository (section **Backend resource shapes** for inquiry/block/annotation JSON aligned with `notlabel-services`).

# NotLabel CLI — Command Reference (for agents)

This document describes the **notlabel** CLI commands. Use `--json` on any inquiry command to get machine-readable output.

**Prerequisites:** User must be logged in (`notlabel auth login`). Commands call `NOTLABEL_API_URL` (default: `https://notlabel-services.notlabel.org/api/v1`). Set it in `.env` to point to your backend (e.g. `NOTLABEL_API_URL=http://localhost:3001/api/v1`). On request errors, the CLI logs the full backend URL used.

---

## Help (human + agents)

| Command | Description |
|--------|-------------|
| `notlabel help` | Show high-level help (like `npm help`), including the main command tree and the recommended agent entrypoint. |

Use this as the **standard discovery point** for new agents: they can call `notlabel help` to learn which families of commands exist, and then `notlabel <command> --help` for details.

---

## Lab / agents (flat commands)

Short top-level commands for agents working in the notlabel lab (no nested `commands agent …` tree):

| Command | Description |
|--------|-------------|
| `notlabel skill` | Print the agent **SKILL.md** (same body as the Cursor skill; full onboarding + workflow). |
| `notlabel protocol` | Print the research **canvas protocol** (block conventions, notifications, typical agent loop). |
| `notlabel start` | Print the **quick-start** sequence (login → inquiry → blocks → activate). |

---

## Config

| Command | Description |
|--------|-------------|
| `notlabel config` | Show backend URL (`NOTLABEL_API_URL`). Use `--json` for machine output. |

---

## Auth

| Command | Description |
|--------|-------------|
| `notlabel auth login` | Sign in via browser (saves credentials locally). |
| `notlabel auth logout` | Remove local credentials. |
| `notlabel auth whoami` | Show current user (email, name). |

---

## Social (tags / stats)

These endpoints are JWT-protected and back the social layer around inquiries. Tags are stored in `InquiryStats` (not in the inquiry document itself).

| Command | Description |
|--------|-------------|
| `notlabel social inquiries stats <id>` | Social stats for one inquiry (`fork_count`, `watch_count`, `related_count`, `visit_count`, `unique_researcher_count`, `tags`). |
| `notlabel social inquiries related <id>` | Related inquiry ids computed from tag overlap (`--limit 1..20`). |
| `notlabel social inquiries add-tags <id> --tags "a,b,c"` | Add tags by label (backend normalizes to slug, upserts tag catalog, links ids in stats). |
| `notlabel social inquiries remove-tag <id> <slug>` | Remove one tag by **slug** (e.g. `machine-learning`). |
| `notlabel social tags popular` | Popular tags (`--limit 1..50`). |
| `notlabel social tags search --q "<text>"` | Search tags by slug text (`--limit 1..50`). |

**Backend behavior for add-tags:** `POST /social/inquiries/:id/tags` accepts `{ "tags": string[] }` and returns `204 No Content`. The CLI handles this no-body response correctly.

---

## Public investigations (discovery)

Read-only feed of **public** inquiries and their **public** blocks. On the web, this surface may also accept an API key; **the CLI only needs your normal JWT** after `notlabel auth login`.

| Command | Description |
|--------|-------------|
| `notlabel public list` | Paginated discovery list. Options: `--status`, `--all-statuses`, `--type`, `--q`, `--user-id`, `--page`, `--limit`, `--sort`, `--json`. |
| `notlabel public get <id>` | Public inquiry detail + optional research `highlight`. |
| `notlabel public list-blocks <inquiryId>` | Blocks visible on the public surface (public privacy only). Same filter style as `inquiry research list-blocks` (`--base-type`, `--kind`, pagination, `--json`). |
| `notlabel public get-block <blockId>` | One block by id if it is public. |
| `notlabel public user-profile <username>` | Public profile card (counts; no email). |

**Collaborating:** discovery is read-only. To comment or edit, the user/agent must join or own a private copy; use **`inquiry research annotations`** when you already have access to the inquiry.

---

## Notifications

Notifications are the fastest way to ingest **new research updates** without re-reading the entire canvas every time.

| Command | Description |
|--------|-------------|
| `notlabel notifications list` | List user notifications. Use `--unread-only` for delta polling. |
| `notlabel notifications read <id>` | Mark one notification as read by id. |
| `notlabel notifications read-by-source <source>` | Mark notification as read using source token (for tracked links). |

Agent usage pattern:
- Poll: `notlabel notifications list --unread-only --json`
- Process updates and fetch relevant inquiry blocks
- Ack: `notlabel notifications read <id> --json`

---

## Inquiry (Orbit central topic)

The **Inquiry** is the central topic of an Orbit. Many backends now default new inquiries to **active** on create. Use `inquiry get` to confirm the current status in your environment.

### create

Create a new inquiry. `raw_input` is immutable after creation.

```bash
notlabel inquiry create --raw-input "<user text>" [--type hypothesis|exploration|question] [--status drafting|active|archived] [--preferred-language <code>] [--json]
```

| Option | Required | Description |
|--------|----------|-------------|
| `--raw-input <text>` | Yes | User's raw input (idea, question, hypothesis). |
| `--type <type>` | No | `hypothesis`, `exploration`, or `question`. Default: `exploration`. |
| `--status <status>` | No | Optional initial status (`drafting`, `active`, `archived`). Backend may also set a default when omitted. |
| `--preferred-language <code>` | No | BCP-47 locale (e.g. `en`, `es`). **Default:** `en` (sent on every create). |
| `--json` | No | Output only the created inquiry as JSON (for agents). |

**Example (agent):**
```bash
notlabel inquiry create --raw-input "How does climate affect crop yields?" --type question --json
```

---

### get

Fetch one inquiry by id.

```bash
notlabel inquiry get <id> [--json]
```

| Argument/Option | Description |
|----------------|-------------|
| `<id>` | Inquiry id. |
| `--json` | Output inquiry object as JSON. |

**Example:**
```bash
notlabel inquiry get abc123 --json
```

**Authenticated detail shape (backend `serializeInquiryDetail`):** includes `seed_topic_ids`, `topics` (topic summaries with `id`, `label`, `slug`, `description`), `root_topic` / `root_topic_id`, `collaborators` (`user_id`, `role`, optional nested `user` profile fields), and `my_role` (`owner` \| `viewer` \| `editor` \| `maintainer`). Use `--json` so agents parse these reliably.

---

### update

Update inquiry fields. **Does not allow changing `raw_input`.** Used by the Inquiry Agent to set refined statement and seed topics.

```bash
notlabel inquiry update <id> [--refined-statement <text>] [--confidence <0-1>] [--seed-topics <a,b,c>] [--type <type>] [--preferred-language <code>] [--json]
```

| Option | Description |
|--------|-------------|
| `--refined-statement <text>` | Refined statement from the agent. |
| `--confidence <number>` | Confidence score 0–1. |
| `--seed-topics <items>` | Comma-separated list of seed topic labels (e.g. `topic1,topic2,topic3`). If the inquiry already has a **ready** orbit graph, the backend automatically adds new topics as nodes and edges in the graph. |
| `--type <type>` | `hypothesis`, `exploration`, or `question`. |
| `--preferred-language <code>` | BCP-47 locale (e.g. `en`, `es`). |
| `--json` | Output updated inquiry as JSON. |

At least one of the above options must be provided.

**Example (agent):**
```bash
notlabel inquiry update abc123 --refined-statement "Impact of climate on crop yields" --seed-topics "climate,crops,yield,agriculture" --confidence 0.85 --json
```

---

### activate

Confirm the inquiry and trigger orbit graph generation. Idempotent if the inquiry is already active (returns current state). After activation, the backend creates the orbit graph (nodes/edges); the frontend can poll until status is `ready`.

```bash
notlabel inquiry activate <id> [--json]
```

| Argument/Option | Description |
|----------------|-------------|
| `<id>` | Inquiry id. |
| `--json` | Output `{ inquiry, orbit_graph_id? }` as JSON. |

**Example:**
```bash
notlabel inquiry activate abc123 --json
```

---

### list

List inquiries for the current user, optionally filtered by status.

```bash
notlabel inquiry list [--status drafting|active|archived] [--json]
```

| Option | Description |
|--------|-------------|
| `--status <status>` | Filter: `drafting`, `active`, or `archived`. |
| `--json` | Output array of inquiries as JSON. |

**Example:**
```bash
notlabel inquiry list --status active --json
```

---

### highlight (summary + full report)

Structured **preview** (`title`, `abstract`, `key_findings`, optional `open_questions`, `next_steps`, `evidence_block_ids`) plus optional long-form **`body_md`** (markdown). Matches the shape returned on public inquiry detail.

- **GET** is allowed for anyone who can read the inquiry (owner, collaborator, etc.).
- **PUT** (`highlight set`) is **owner-only** on the backend.

```bash
# Read current highlight
notlabel inquiry highlight get <id> [--json]

# Save / replace highlight (inline: required title, abstract, key-findings JSON array)
notlabel inquiry highlight set <id> \
  --title "Short title" \
  --abstract "Summary text (min 50 characters in practice for API validation) ..." \
  --key-findings '["Finding one","Finding two"]' \
  [--open-questions '["…"]'] [--next-steps '["…"]'] \
  [--evidence-block-ids id1,id2] [--body-md "<markdown>"] [--body-md-file ./report.md] \
  [--json]

# Or full body from JSON file (same fields as PUT body; server ignores client version)
notlabel inquiry highlight set <id> --file ./highlight.json [--json]

# AI-generated highlight + activate inquiry (orbit)
notlabel inquiry highlight preview-activate <id> [--evidence-block-ids id1,id2] [--json]

# Revision history (list/read/revert)
notlabel inquiry highlight versions list <id> [--json]
notlabel inquiry highlight versions show <id> <version> [--json]
notlabel inquiry highlight versions revert <id> <version> [--json]
```

Backend validation (use `notlabel inquiry highlight set --help` for CLI options): e.g. title 3–160 chars, abstract 50–3000 chars, 1–12 key findings, optional lists capped (see API DTO).

---

## Inquiry blocks (research canvas)

Research content lives in **blocks** under each inquiry (`POST/GET /inquiries/:id/blocks`). Each block has a required taxonomy **`base_type`** (`note`, `experiment`, `source`, `code`, `insight`, `custom`) plus a free-form **`kind`** label (e.g. `reference`, `goal`, `question`). The API returns the created **block** JSON, not the full inquiry.

### research add-block

Create a block on an inquiry.

```bash
notlabel inquiry research add-block <id> \
  --content "<text>" \
  [--base-type note|experiment|source|code|insight|custom] \
  [--kind <label>] \
  [--title "<text>"] \
  [--data '{"key":"value",...}'] \
  [--linked-blocks id1,id2] \
  [--privacy private|public] \
  [--json]
```

| Argument/Option | Required | Description |
|----------------|----------|-------------|
| `<id>` | Yes | Inquiry id. |
| `--content <text>` | Yes | Block body text. |
| `--base-type` | No | Taxonomy (default: `note`). |
| `--kind <label>` | No | Free-form label (default: `note`). |
| `--title <text>` | No | Short title. |
| `--data <json>` | No | Structured metadata as JSON. **Source / `kind` reference:** `{"url":"https://...","title":"...","authors":["A"],"year":2024}`. **Goal note:** `{"priority":"high"|"medium"|"low"}`. Run `notlabel inquiry research add-block --help` for more examples. |
| `--linked-blocks` | No | Comma-separated ids of other blocks in the **same inquiry** (knowledge-graph links). Example: `id1,id2`. |
| `--privacy` | No | `private` or `public`. |
| `--json` | No | Output the created **block** as JSON. |

**Notes:**
- List blocks with `inquiry research list-blocks` (JSON field is **`items`**, not `blocks`). Fetch one block: `inquiry research get-block <blockId>`.
- For `base_type` **source** and `kind` **reference**, the CLI prints a **warning** if `--data` is missing a `url` (optional hygiene; the server may still accept the block).
- The backend stores blocks in a dedicated collection; they are not embedded on `GET /inquiries/:id`.

**Orbit graph (backend):** When you add or update `seed_topics` on an inquiry that already has a **ready** orbit graph, the backend automatically adds the new topics as nodes (orbit 1) and creates edges between them and all existing nodes. The frontend graph updates accordingly. The CLI does not expose graph mutation commands; the front (or direct API) can use the orbit-graph endpoints below for manual edges/nodes.

### research add-block-on-topic

Create a block under a **Topic** (`POST /topics/:topicId/blocks`). Useful for pre-inquiry / topic-scoped canvases; linked blocks must belong to the **same topic**.

```bash
notlabel inquiry research add-block-on-topic <topicId> \
  --content "<text>" \
  [--base-type note|experiment|source|code|insight|custom] \
  [--kind <label>] \
  [--title "<text>"] \
  [--data '<json>'] \
  [--linked-blocks id1,id2] \
  [--privacy private|public] \
  [--json]
```

### research get-block

```bash
notlabel inquiry research get-block <blockId> [--json]
```

Resolves to `GET /blocks/:blockId`.

### research update-block

Partial update (`PATCH /blocks/:blockId`). When setting non-empty `--linked-blocks`, pass `--inquiry-id` or `--topic-id` so the CLI can validate ids exist in that scope.

```bash
notlabel inquiry research update-block <blockId> \
  [--kind <label>] [--base-type ...] [--title "<text>"] [--content "<text>"] \
  [--data '<json>'] \
  [--linked-blocks id1,id2 --inquiry-id <inquiryId>] \
  [--privacy private|public] [--pinned true|false] \
  [--json]
```

### research delete-block

Soft-delete on the server (`DELETE /blocks/:blockId`).

```bash
notlabel inquiry research delete-block <blockId> [--json]
```

### research list-blocks

List blocks for an inquiry (supports filters + pagination; ideal for focused fetches like only `kind=insight`).

```bash
notlabel inquiry research list-blocks <id> \
  [--base-type ...] [--kind ...] [--page <n>] [--limit <n>] [--pinned true|false] \
  [--sort updatedAt:desc|createdAt:desc] \
  [--json]
```

| Argument/Option | Description |
|----------------|-------------|
| `<id>` | Inquiry id. |
| `--page <n>` | Page index, min `0` (default backend `0`). |
| `--limit <n>` | Page size, `1..100` (default backend `20`). |
| `--json` | Output object: `{ items: Block[], pagination: { total, limit, page, has_next } }`. |

Example (latest insights only):
```bash
notlabel inquiry research list-blocks <id> --kind insight --page 0 --limit 20 --json
```

### research add-blocks

Create many blocks in one run from a JSON array file.

```bash
notlabel inquiry research add-blocks <id> --file ./blocks.json [--on-error continue|stop] [--json]
```

`blocks.json` must be an array of objects using the same payload fields as `add-block`
(`content`, `base_type`, `kind`, `title`, `data`, `linked_block_ids`, `privacy`).

### research summary

Get a compact snapshot of the inquiry canvas without downloading everything manually.

```bash
notlabel inquiry research summary <id> [--json]
```

Returns totals by `base_type`, totals by `kind`, and `total_blocks`.

### research annotations (comments / collaboration)

Block **annotations** are thread-style comments on a block. Any collaborator who can **read** the inquiry may add annotations; list items include populated `user` and `block`, plus optional **actor provenance** (`actor_kind`, `actor_label`, `correlation_id`) when the client sent the HTTP provenance headers. Creating an annotation emits a notification to other participants (see backend `annotation.created`).

```bash
# List thread for one block (oldest first)
notlabel inquiry research annotations list-block <inquiryId> <blockId> [--json]

# All annotations in the inquiry (newest first)
notlabel inquiry research annotations list-inquiry <inquiryId> [--json]

# Add comment (optional reply: --parent <annotationId> on same block)
notlabel inquiry research annotations add <inquiryId> <blockId> \
  --body "<text>" [--parent <annotationId>] [--json]

# Soft-delete (author, or owner/maintainer)
notlabel inquiry research annotations delete <inquiryId> <blockId> <annotationId> [--json]

# Hide from default lists for others (author, or owner/maintainer)
notlabel inquiry research annotations set-hidden <inquiryId> <blockId> <annotationId> \
  --hidden true|false [--json]
```

| Backend rule | Detail |
|--------------|--------|
| Create body | `{ body: string (1–8000), parent_annotation_id?: string }` — parent must be on the **same block**. |
| Hidden | Non–owner/maintainer lists omit `hidden: true` unless the row is their own; owners/maintainers see all. |

---

## Typical agent flow

1. **Create:** `notlabel inquiry create --raw-input "<user idea>" --json` → capture `id`.
2. **Update (after Inquiry Agent):** `notlabel inquiry update <id> --refined-statement "..." --seed-topics "a,b,c" --confidence 0.9 --json`.
3. **Log research (canvas style):** as the investigation progresses, append blocks:

   ```bash
   notlabel inquiry research add-block <id> \
     --content "..." \
     --kind note \
     --json
   ```

   Use `notlabel inquiry research list-blocks <id> --kind insight --page 0 --limit 20 --json`
   to fetch only the latest insights (or remove `--kind` to page through all blocks).

4. **Discuss a block (optional):** `notlabel inquiry research annotations add <inquiry-id> <block-id> --body "…" --json` (or `list-block` / `list-inquiry` to read threads).

5. **Publish highlight (optional, owner):** `notlabel inquiry highlight set <id> --file ./highlight.json --json` or inline flags; or `inquiry highlight preview-activate` for an AI draft + activation.

6. **Activate (on user confirm):** `notlabel inquiry activate <id> --json` → capture `orbit_graph_id`; poll `GET /inquiries/:id/orbit-graph` or `GET /inquiries/:id` until the graph is ready.

---

## Agent canvas protocol (helper text)

For LLM agents, `notlabel protocol` prints a canvas-style protocol describing how to keep inquiry blocks updated and how to use notifications as a delta feed:

```bash
notlabel protocol
```

For the full SKILL.md (onboarding + workflow), run:

```bash
notlabel skill
```

Use these as self-contained text guides for how to:
- Create or select an Inquiry.
- Append research blocks with appropriate `kind`/`data` conventions.
- Read back the research notebook as a linear canvas/log.
- Add **annotations** (comments) on blocks for collaboration when it helps the user.
- Query block groups directly (e.g. only `kind=insight`) and paginate for incremental reads.
- Poll unread notifications to detect only new updates.

---

## API endpoints used (backend contract)

| CLI command | HTTP |
|-------------|------|
| `inquiry create` | `POST /inquiries` — body: `{ raw_input, type?, status?, preferred_language? }` (CLI sends `preferred_language: "en"` by default). |
| `inquiry get` | `GET /inquiries/:id`. |
| `inquiry update` | `PATCH /inquiries/:id` — body: `{ refined_statement?, confidence?, seed_topics?, type?, preferred_language? }` (no `raw_input`). |
| `inquiry activate` | `POST /inquiries/:id/activate` — returns `{ id, status, activated_at?, orbit_graph_id?, created_at }`. |
| `inquiry list` | `GET /inquiries` — query: `?status=drafting|active|archived`. |
| `inquiry highlight get` | `GET /inquiries/:id/highlight`. |
| `inquiry highlight set` | `PUT /inquiries/:id/highlight` — body: `{ title, abstract, key_findings, open_questions?, next_steps?, evidence_block_ids?, body_md? }`. |
| `inquiry highlight preview-activate` | `POST /inquiries/:id/preview-highlight-activate` — optional body `{ evidence_block_ids? }`; activates inquiry. |
| `inquiry highlight versions list` | `GET /inquiries/:id/highlight/versions`. |
| `inquiry highlight versions show` | `GET /inquiries/:id/highlight/versions/:version`. |
| `inquiry highlight versions revert` | `POST /inquiries/:id/highlight/revert/:version`. |
| `inquiry research add-block` | `POST /inquiries/:id/blocks` — body: `{ kind, base_type, content?, title?, data?, linked_block_ids?, privacy? }`; returns **Block**. |
| `inquiry research add-block-on-topic` | `POST /topics/:topicId/blocks` — same body shape; block is topic-scoped until promoted. |
| `inquiry research get-block` | `GET /blocks/:blockId`. |
| `inquiry research update-block` | `PATCH /blocks/:blockId` — partial body. |
| `inquiry research delete-block` | `DELETE /blocks/:blockId` — soft delete; returns `{ id, deleted }`. |
| `inquiry research list-blocks` | `GET /inquiries/:id/blocks` — optional query: `base_type`, `kind`, `page`, `limit`, `pinned`, `sort`; returns `{ items, pagination }`. |
| `inquiry research annotations list-block` | `GET /inquiries/:inquiryId/blocks/:blockId/annotations` — returns `{ items: Annotation[] }`. |
| `inquiry research annotations list-inquiry` | `GET /inquiries/:inquiryId/annotations` — returns `{ items: Annotation[] }`. |
| `inquiry research annotations add` | `POST /inquiries/:inquiryId/blocks/:blockId/annotations` — body: `{ body, parent_annotation_id? }`. |
| `inquiry research annotations delete` | `DELETE …/annotations/:annotationId` — soft-delete; returns `{ id, deleted }`. |
| `inquiry research annotations set-hidden` | `PATCH …/annotations/:annotationId/hidden` — body: `{ hidden: boolean }`. |
| `social inquiries stats` | `GET /social/inquiries/:id/stats` — includes populated `tags` (`slug`, `label`). |
| `social inquiries related` | `GET /social/inquiries/:id/related` — query: `limit`. |
| `social inquiries add-tags` | `POST /social/inquiries/:id/tags` — body: `{ tags: string[] }`; returns `204 No Content`. |
| `social inquiries remove-tag` | `DELETE /social/inquiries/:id/tags/:slug` — returns `204 No Content`. |
| `social tags popular` | `GET /social/tags/popular` — query: `limit`. |
| `social tags search` | `GET /social/tags/search` — query: `q`, `limit`. |
| `public list` | `GET /public/investigations/inquiries` — query: `status`, `all_statuses`, `type`, `q`, `user_id`, `page`, `limit`, `sort`. |
| `public get` | `GET /public/investigations/inquiries/:id`. |
| `public list-blocks` | `GET /public/investigations/inquiries/:id/blocks`. |
| `public get-block` | `GET /public/investigations/blocks/:id`. |
| `public user-profile` | `GET /public/investigations/users/profile/:username`. |
| `notifications list` | `GET /notifications` — optional query: `unread_only`, `limit`, `offset`; returns `Notification[]`. |
| `notifications read` | `PATCH /notifications/:id/read` — returns updated `Notification`. |
| `notifications read-by-source` | `POST /notifications/read-by-source` — body: `{ source }`; returns updated `Notification`. |

---

## Backend resource shapes (Inquiry, Block, Annotation)

These notes mirror **`notlabel-services`** schemas and serializers so agents parse `--json` output correctly. Source of truth remains the backend repo.

### Inquiry (`GET /inquiries/:id` with JWT)

Private **detail** uses `serializeInquiryDetail`. Beyond core fields (`raw_input`, `refined_statement`, `type`, `status`, `confidence`, `privacy`, `preferred_language`, `orbit_graph_id`, `activated_at`, timestamps):

| Field | Meaning |
|--------|---------|
| `seed_topics` | String labels (legacy/bench copy). |
| `seed_topic_ids` | Topic document ids (strings in JSON). |
| `root_topic_id`, `root_topic` | Root topic id and optional `{ id, label, slug, description }`. |
| `topics` | De-duplicated array of topic summaries (`id`, `label`, `slug`, `description`). |
| `collaborators` | `{ user_id, role: viewer\|editor\|maintainer, user?: { username, email, avatar, first_name, last_name } }[]`. Owner is inquiry `user_id`, not repeated here. |
| `my_role` | `owner` \| `viewer` \| `editor` \| `maintainer` for the current user. |

`preferred_language` is normalized in the response; the Mongoose enum includes at least `en` and `es`. Public discovery endpoints omit collaborator-rich shapes.

### Block (`GET`/`POST`/`PATCH` `/blocks/…`, list items)

| Area | Meaning |
|------|---------|
| Scope | `inquiry_id` (normal inquiry canvas) and/or `topic_id` (topic-scoped / pre-promotion). |
| Actor | Optional `actor_kind` (`user_manual` \| `agent`), `actor_label`, `correlation_id` when the client sent HTTP provenance headers on write. |
| Contributions | Optional `contribution_kind`, `contribution_review_status` (`pending` \| `approved` \| `rejected`), review timestamps, `contribution_reviewed_by_user_id`, `contribution_rejection_reason`. |

### Block annotation (list / create / set-hidden)

| Area | Meaning |
|------|---------|
| Payload | `items[]` with `actor_*`, `block_id`, `inquiry_id`, `user_id`, `body`, `parent_annotation_id`, `hidden`, populated `user` (`id`, `username`, `display_name`), `block` (`id`, `title`, `kind`), timestamps. |
| Deletes | Schema has `deleted_at`; **list routes omit** soft-deleted rows. |
| Hidden | Non–owner/maintainer lists typically omit others’ `hidden: true` unless the row is the viewer’s own. |

---

### Orbit graph endpoints (backend; not exposed by CLI)

The backend maintains an **orbit graph** per inquiry: nodes = topics (with orbit/gravity), edges = links between topics. The CLI does not call these; they are used by the frontend or direct API.

| HTTP | Description |
|------|-------------|
| `GET /orbit-graphs/:id` | Graph metadata (status, node_count, edge_count). |
| `GET /orbit-graphs/:id/nodes` | List nodes (topic_id, label, orbit, gravity, position, bench_id). |
| `GET /orbit-graphs/:id/edges` | List edges (source_node_id, target_node_id, weight, type). |
| `POST /orbit-graphs/:id/nodes` | Add one node — body: `{ topic_id? \| label?, orbit, gravity?, position? }`. |
| `POST /orbit-graphs/:id/edges` | Add one edge between existing nodes — body: `{ source_node_id, target_node_id, weight?, type? }`. |
| `POST /orbit-graphs/:id/connect-topics` | Add edge between two **topics** (by topic_id) — body: `{ source_topic_id, target_topic_id }`. Both topics must already be nodes in the graph. |
| `POST /orbit-graphs/:id/nodes-and-edges` | Add one node and edges from it to existing nodes — body: `{ topic_id? \| label?, orbit, connect_to_node_ids[], gravity?, edge_weight? }`. |
| `POST /orbit-graphs/:id/generate-orbit-3` | AI-generated “surprise” topics (orbit 3) and edges to orbit-1 nodes; no body. |

**Graph lifecycle:** On **activate**, the backend creates the graph from current `seed_topics` (nodes orbit 1, fully connected edges). On **inquiry update** with new `seed_topics` and an existing ready graph, the backend automatically adds new topic nodes and edges to all current nodes. Edge types include `direct`, `adjacent`, `surprise`.

All request/response formats and business rules are defined in the Orbit backend reference. This CLI only consumes the inquiry API above.

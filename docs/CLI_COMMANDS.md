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

## Onboarding

| Command | Description |
|--------|-------------|
| `notlabel onboarding research` | Print the quick-start sequence to begin research with inquiry + blocks + notifications. |

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

The **Inquiry** is the central topic of an Orbit. Lifecycle: **create** (drafting) → **update** (refined_statement, seed_topics, etc.) → **activate** (confirms and triggers orbit graph generation).

### create

Create a new inquiry in `drafting` status. `raw_input` is immutable after creation.

```bash
notlabel inquiry create --raw-input "<user text>" [--type hypothesis|exploration|question] [--json]
```

| Option | Required | Description |
|--------|----------|-------------|
| `--raw-input <text>` | Yes | User's raw input (idea, question, hypothesis). |
| `--type <type>` | No | `hypothesis`, `exploration`, or `question`. Default: `exploration`. |
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

---

### update

Update inquiry fields. **Does not allow changing `raw_input`.** Used by the Inquiry Agent to set refined statement and seed topics.

```bash
notlabel inquiry update <id> [--refined-statement <text>] [--confidence <0-1>] [--seed-topics <a,b,c>] [--type <type>] [--json]
```

| Option | Description |
|--------|-------------|
| `--refined-statement <text>` | Refined statement from the agent. |
| `--confidence <number>` | Confidence score 0–1. |
| `--seed-topics <items>` | Comma-separated list of seed topic labels (e.g. `topic1,topic2,topic3`). If the inquiry already has a **ready** orbit graph, the backend automatically adds new topics as nodes and edges in the graph. |
| `--type <type>` | `hypothesis`, `exploration`, or `question`. |
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
| `--data <json>` | No | Optional structured metadata. |
| `--linked-blocks` | No | Comma-separated ids of other blocks in the same inquiry. |
| `--privacy` | No | `private` or `public`. |
| `--json` | No | Output the created **block** as JSON. |

**Notes:**
- List and inspect blocks with `inquiry research list-blocks` or `GET /inquiries/:id/blocks`.
- The backend stores blocks in a dedicated collection; they are not embedded on `GET /inquiries/:id`.

**Orbit graph (backend):** When you add or update `seed_topics` on an inquiry that already has a **ready** orbit graph, the backend automatically adds the new topics as nodes (orbit 1) and creates edges between them and all existing nodes. The frontend graph updates accordingly. The CLI does not expose graph mutation commands; the front (or direct API) can use the orbit-graph endpoints below for manual edges/nodes.

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

4. **Activate (on user confirm):** `notlabel inquiry activate <id> --json` → capture `orbit_graph_id`; poll `GET /inquiries/:id/orbit-graph` or `GET /inquiries/:id` until the graph is ready.

---

## Agent helper: commands agent research

For LLM agents, there is a helper command that prints a canvas-style protocol describing how to keep inquiry blocks updated and how to use notifications as a delta feed:

```bash
notlabel commands agent research
```

Use this as a self-contained, text-based guide for how to:
- Create or select an Inquiry.
- Append research blocks with appropriate `kind`/`data` conventions.
- Read back the research notebook as a linear canvas/log.
- Query block groups directly (e.g. only `kind=insight`) and paginate for incremental reads.
- Poll unread notifications to detect only new updates.

---

## API endpoints used (backend contract)

| CLI command | HTTP |
|-------------|------|
| `inquiry create` | `POST /inquiries` — body: `{ raw_input, type? }`. |
| `inquiry get` | `GET /inquiries/:id`. |
| `inquiry update` | `PATCH /inquiries/:id` — body: `{ refined_statement?, confidence?, seed_topics?, type? }` (no `raw_input`). |
| `inquiry activate` | `POST /inquiries/:id/activate` — returns `{ id, status, activated_at?, orbit_graph_id?, created_at }`. |
| `inquiry list` | `GET /inquiries` — query: `?status=drafting|active|archived`. |
| `inquiry research add-block` | `POST /inquiries/:id/blocks` — body: `{ kind, base_type, content?, title?, data?, linked_block_ids?, privacy? }`; returns **Block**. |
| `inquiry research list-blocks` | `GET /inquiries/:id/blocks` — optional query: `base_type`, `kind`, `page`, `limit`, `pinned`, `sort`; returns `{ items, pagination }`. |
| `notifications list` | `GET /notifications` — optional query: `unread_only`, `limit`, `offset`; returns `Notification[]`. |
| `notifications read` | `PATCH /notifications/:id/read` — returns updated `Notification`. |
| `notifications read-by-source` | `POST /notifications/read-by-source` — body: `{ source }`; returns updated `Notification`. |

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

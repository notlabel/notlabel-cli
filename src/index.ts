#!/usr/bin/env bun

// Bun loads .env automatically in development (bun run / bun dev).
// No extra call needed — Bun reads .env from the project root by default.

import { Command } from "commander";
import { loginCommand } from "./commands/auth/login.js";
import { logoutCommand } from "./commands/auth/logout.js";
import { whoamiCommand } from "./commands/auth/whoami.js";
import { createInquiryCommand } from "./commands/inquiry/create.js";
import { getInquiryCommand } from "./commands/inquiry/get.js";
import { updateInquiryCommand } from "./commands/inquiry/update.js";
import { activateInquiryCommand } from "./commands/inquiry/activate.js";
import { listInquiryCommand } from "./commands/inquiry/list.js";
import { addResearchBlockCommand } from "./commands/inquiry/research-add-block.js";
import { listResearchBlocksCommand } from "./commands/inquiry/research-list-blocks.js";
import { agentResearchCommands } from "./commands/agent/research.js";
import { listNotificationsCommand } from "./commands/notifications/list.js";
import { markNotificationReadCommand } from "./commands/notifications/read.js";
import { markNotificationReadBySourceCommand } from "./commands/notifications/read-by-source.js";
import { showConfigCommand } from "./commands/config/show.js";
import { onboardingResearchCommand } from "./commands/onboarding/research.js";

const program = new Command();

program
  .name("notlabel")
  .description("Official CLI for notlabel.org")
  .version("0.1.0");

// ── auth ──────────────────────────────────────────────────────────────────────
const auth = program.command("auth").description("Authentication commands");

auth
  .command("login")
  .description("Sign in to notlabel.org via browser")
  .action(async () => {
    await loginCommand();
  });

auth
  .command("logout")
  .description("Remove local credentials")
  .action(() => {
    logoutCommand();
  });

auth
  .command("whoami")
  .description("Show the currently authenticated user")
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    await whoamiCommand({ json: opts.json });
  });

// Top-level login alias (same as auth login)
program
  .command("login")
  .description("Sign in to notlabel.org via browser (alias for auth login)")
  .action(async () => {
    await loginCommand();
  });

// ── inquiry (Orbit central topic) ──────────────────────────────────────────────
const inquiry = program
  .command("inquiry")
  .description("Orbit central topic (Inquiry): create, update, activate, list");

inquiry
  .command("create")
  .description("Create a new inquiry in drafting status")
  .requiredOption("--raw-input <text>", "User raw input (immutable after creation)")
  .option("--type <type>", "hypothesis | exploration | question", "exploration")
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    await createInquiryCommand({
      rawInput: opts.rawInput,
      type: opts.type,
      json: opts.json,
    });
  });

inquiry
  .command("get <id>")
  .description("Get one inquiry by id")
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await getInquiryCommand({ id, json: opts.json });
  });

inquiry
  .command("update <id>")
  .description("Update inquiry (refined_statement, confidence, seed_topics, type). No raw_input.")
  .option("--refined-statement <text>", "Refined statement from agent")
  .option("--confidence <number>", "Confidence 0-1", (v) => parseFloat(v))
  .option("--seed-topics <items>", "Comma-separated seed topics", (v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .option("--type <type>", "hypothesis | exploration | question")
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await updateInquiryCommand({
      id,
      refinedStatement: opts.refinedStatement,
      confidence: opts.confidence,
      seedTopics: opts.seedTopics,
      type: opts.type,
      json: opts.json,
    });
  });

inquiry
  .command("activate <id>")
  .description("Confirm inquiry and trigger orbit graph generation")
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await activateInquiryCommand({ id, json: opts.json });
  });

inquiry
  .command("list")
  .description("List inquiries for the current user")
  .option("--status <status>", "Filter: drafting | active | archived")
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    await listInquiryCommand({ status: opts.status, json: opts.json });
  });

// ── inquiry research notebook (thesis canvas) ────────────────────────────────
const inquiryResearch = inquiry
  .command("research")
  .description(
    "Blocks attached to an inquiry (primary API for research content)",
  );

inquiryResearch
  .command("add-block <id>")
  .description("Create a block on the inquiry (blocks are the primary research surface)")
  .requiredOption("--content <text>", "Block body text")
  .option(
    "--base-type <type>",
    "note | experiment | source | code | insight | custom",
    "note",
  )
  .option(
    "--kind <kind>",
    "Kind label (free-form; default: note). Examples: reference, goal, question, idea.",
    "note",
  )
  .option("--title <text>", "Optional short title")
  .option(
    "--data <json>",
    "Optional JSON payload for structured metadata (e.g. reference details).",
  )
  .option(
    "--linked-blocks <ids>",
    "Comma-separated block ids to link (same inquiry).",
  )
  .option("--privacy <privacy>", "private | public")
  .option("--json", "Output created block as JSON for agents")
  .action(async (id, opts) => {
    let dataObj: Record<string, unknown> | undefined;
    if (opts.data) {
      try {
        dataObj = JSON.parse(opts.data);
      } catch {
        console.error(
          "\x1b[31mError: --data must be valid JSON (e.g. '{\"url\":\"https://...\"}').\x1b[0m",
        );
        process.exit(1);
      }
    }

    const baseType = opts.baseType as
      | "note"
      | "experiment"
      | "source"
      | "code"
      | "insight"
      | "custom";
    const allowed = new Set([
      "note",
      "experiment",
      "source",
      "code",
      "insight",
      "custom",
    ]);
    if (!allowed.has(baseType)) {
      console.error(
        "\x1b[31mError: --base-type must be one of: note, experiment, source, code, insight, custom.\x1b[0m",
      );
      process.exit(1);
    }

    let privacy: "private" | "public" | undefined;
    if (opts.privacy) {
      if (opts.privacy !== "private" && opts.privacy !== "public") {
        console.error(
          "\x1b[31mError: --privacy must be private or public.\x1b[0m",
        );
        process.exit(1);
      }
      privacy = opts.privacy;
    }

    const linkedBlockIds = opts.linkedBlocks
      ? opts.linkedBlocks
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;

    await addResearchBlockCommand({
      id,
      content: opts.content,
      kind: opts.kind,
      baseType,
      ...(opts.title !== undefined && opts.title !== ""
        ? { title: opts.title }
        : {}),
      ...(dataObj !== undefined ? { data: dataObj } : {}),
      ...(linkedBlockIds?.length ? { linkedBlockIds } : {}),
      ...(privacy !== undefined ? { privacy } : {}),
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });

// ── notifications ─────────────────────────────────────────────────────────────
const notifications = program
  .command("notifications")
  .description(
    "Notification inbox for user-level updates (including new research updates)",
  );

notifications
  .command("list")
  .description("List notifications (latest first)")
  .option("--unread-only", "Only unread notifications")
  .option("--limit <n>", "Page size 1-100", (v) => parseInt(v, 10))
  .option("--offset <n>", "Offset >= 0", (v) => parseInt(v, 10))
  .option("--json", "Output notifications as JSON for agents")
  .action(async (opts) => {
    if (opts.limit !== undefined && (Number.isNaN(opts.limit) || opts.limit < 1 || opts.limit > 100)) {
      console.error("\x1b[31mError: --limit must be between 1 and 100.\x1b[0m");
      process.exit(1);
    }
    if (opts.offset !== undefined && (Number.isNaN(opts.offset) || opts.offset < 0)) {
      console.error("\x1b[31mError: --offset must be >= 0.\x1b[0m");
      process.exit(1);
    }
    await listNotificationsCommand({
      ...(opts.unreadOnly !== undefined ? { unreadOnly: !!opts.unreadOnly } : {}),
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      ...(opts.offset !== undefined ? { offset: opts.offset } : {}),
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });

notifications
  .command("read <id>")
  .description("Mark one notification as read by id")
  .option("--json", "Output updated notification as JSON for agents")
  .action(async (id, opts) => {
    await markNotificationReadCommand({
      id,
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });

notifications
  .command("read-by-source <source>")
  .description("Mark a notification as read using source token (from tracked links)")
  .option("--json", "Output updated notification as JSON for agents")
  .action(async (source, opts) => {
    await markNotificationReadBySourceCommand({
      source,
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });

inquiryResearch
  .command("list-blocks <id>")
  .description("List blocks for an inquiry (filter by kind and paginate)")
  .option(
    "--base-type <type>",
    "Filter: note | experiment | source | code | insight | custom",
  )
  .option("--kind <kind>", "Filter by kind label")
  .option("--page <n>", "Page index >= 0 (default: 0)", (v) => parseInt(v, 10))
  .option("--limit <n>", "Page size 1-100 (default: 20)", (v) => parseInt(v, 10))
  .option("--pinned <bool>", "Filter pinned: true or false")
  .option(
    "--sort <order>",
    "Sort: updatedAt:desc (default on server) | createdAt:desc",
  )
  .option("--json", "Output blocks as JSON for agents")
  .action(async (id, opts) => {
    let baseType:
      | "note"
      | "experiment"
      | "source"
      | "code"
      | "insight"
      | "custom"
      | undefined;
    if (opts.baseType) {
      const allowed = new Set([
        "note",
        "experiment",
        "source",
        "code",
        "insight",
        "custom",
      ]);
      if (!allowed.has(opts.baseType)) {
        console.error(
          "\x1b[31mError: --base-type must be one of: note, experiment, source, code, insight, custom.\x1b[0m",
        );
        process.exit(1);
      }
      baseType = opts.baseType;
    }

    let pinned: boolean | undefined;
    if (opts.pinned !== undefined) {
      if (opts.pinned === "true") pinned = true;
      else if (opts.pinned === "false") pinned = false;
      else {
        console.error(
          "\x1b[31mError: --pinned must be true or false.\x1b[0m",
        );
        process.exit(1);
      }
    }

    let sort: "updatedAt:desc" | "createdAt:desc" | undefined;
    if (opts.sort) {
      if (opts.sort !== "updatedAt:desc" && opts.sort !== "createdAt:desc") {
        console.error(
          "\x1b[31mError: --sort must be updatedAt:desc or createdAt:desc.\x1b[0m",
        );
        process.exit(1);
      }
      sort = opts.sort;
    }

    if (
      opts.page !== undefined &&
      (Number.isNaN(opts.page) || opts.page < 0)
    ) {
      console.error("\x1b[31mError: --page must be >= 0.\x1b[0m");
      process.exit(1);
    }
    if (
      opts.limit !== undefined &&
      (Number.isNaN(opts.limit) || opts.limit < 1 || opts.limit > 100)
    ) {
      console.error("\x1b[31mError: --limit must be between 1 and 100.\x1b[0m");
      process.exit(1);
    }

    await listResearchBlocksCommand({
      id,
      ...(baseType !== undefined ? { baseType } : {}),
      ...(opts.kind !== undefined ? { kind: opts.kind } : {}),
      ...(opts.page !== undefined ? { page: opts.page } : {}),
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(sort !== undefined ? { sort } : {}),
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });

// ── config ────────────────────────────────────────────────────────────────────
program
  .command("config")
  .description("Show backend URL and config (from .env / NOTLABEL_API_URL)")
  .option("--json", "Output raw JSON")
  .action((opts) => {
    showConfigCommand({ json: opts.json });
  });

// ── help (human + agents) ───────────────────────────────────────────────────
program
  .command("help")
  .description(
    "Show high-level help and pointers (like `npm help`), including agent entrypoints",
  )
  .action(() => {
    const lines = [
      "notlabel — CLI help",
      "",
      "Top-level commands:",
      "  auth       Authentication (login, logout, whoami)",
      "  inquiry    Orbit central topic (create, update, activate, list, blocks)",
      "  notifications Notification inbox (new research updates, mark read)",
      "  config     Show backend URL and config",
      "  commands   Meta-commands for agents and documentation",
      "",
      "For detailed help on a specific command, use:",
      "  notlabel <command> --help",
      "Examples:",
      "  notlabel inquiry --help",
      "  notlabel inquiry research --help",
      "  notlabel notifications --help",
      "",
      "Agent entrypoint (recommended):",
      "  notlabel commands agent research",
      "    Prints the research canvas protocol:",
      "    - What an Inquiry is and how to manage its lifecycle.",
      "    - How to query block groups directly (e.g. kind=insight) with pagination.",
      "    - How to poll unread notifications for new research updates.",
      "    - The typical agent loop while investigating an Inquiry.",
      "",
      "Notes:",
      "- All inquiry-related commands accept --json for machine-readable output.",
      "- Backends and business rules are defined in the Orbit backend reference; this CLI only consumes that API.",
    ];

    console.log(lines.join("\n"));
  });

// ── onboarding ───────────────────────────────────────────────────────────────
const onboarding = program
  .command("onboarding")
  .description("Quick-start flows for common tasks");

onboarding
  .command("research")
  .description("Show the most important commands to start research")
  .action(() => {
    onboardingResearchCommand();
  });

// ── commands (agent helpers) ────────────────────────────────────────────────
const commands = program
  .command("commands")
  .description("Meta-commands: documentation and helper protocols for agents");

const commandsAgent = commands
  .command("agent")
  .description("Agent-oriented command descriptions");

commandsAgent
  .command("research")
  .description(
    "Show research canvas protocol for agents (how to create/list inquiry blocks via CLI)",
  )
  .action(async () => {
    await agentResearchCommands();
  });

program.parse();

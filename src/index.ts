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
import { getHighlightCommand } from "./commands/inquiry/highlight-get.js";
import { previewHighlightActivateCommand } from "./commands/inquiry/highlight-preview-activate.js";
import { setHighlightCommand } from "./commands/inquiry/highlight-set.js";
import {
  getHighlightVersionCommand,
  listHighlightVersionsCommand,
  revertHighlightCommand,
} from "./commands/inquiry/highlight-versions.js";
import { addResearchBlockCommand } from "./commands/inquiry/research-add-block.js";
import { listResearchBlocksCommand } from "./commands/inquiry/research-list-blocks.js";
import { addResearchBlocksCommand } from "./commands/inquiry/research-add-blocks.js";
import { summarizeResearchBlocksCommand } from "./commands/inquiry/research-summary.js";
import {
  addBlockAnnotationCommand,
  deleteBlockAnnotationCommand,
  listBlockAnnotationsForBlockCommand,
  listBlockAnnotationsForInquiryCommand,
  setBlockAnnotationHiddenCommand,
} from "./commands/inquiry/research-annotations.js";
import { agentResearchCommands } from "./commands/agent/research.js";
import { printAgentSkill } from "./commands/agent/skill-print.js";
import { listNotificationsCommand } from "./commands/notifications/list.js";
import { markNotificationReadCommand } from "./commands/notifications/read.js";
import { markNotificationReadBySourceCommand } from "./commands/notifications/read-by-source.js";
import { showConfigCommand } from "./commands/config/show.js";
import { onboardingResearchCommand } from "./commands/onboarding/research.js";
import { publicGetBlockCommand } from "./commands/public/get-block.js";
import { publicGetInquiryCommand } from "./commands/public/get-inquiry.js";
import { publicListBlocksCommand } from "./commands/public/list-blocks.js";
import { publicListInquiriesCommand } from "./commands/public/list-inquiries.js";
import { publicUserProfileCommand } from "./commands/public/user-profile.js";
import { addInquiryTagsCommand } from "./commands/social/add-tags.js";
import { getInquiryStatsCommand } from "./commands/social/get-stats.js";
import { listPopularTagsCommand } from "./commands/social/popular-tags.js";
import { listRelatedInquiriesCommand } from "./commands/social/inquiry-related.js";
import { removeInquiryTagCommand } from "./commands/social/remove-tag.js";
import { searchTagsCommand } from "./commands/social/search-tags.js";

const program = new Command();

program
  .name("notlabel")
  .description("Official CLI for notlabel.org")
  .version("0.2.0");

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

// ── lab / agents (flat, short commands) ───────────────────────────────────────
program
  .command("skill")
  .description(
    "Print the agent SKILL.md (onboarding for the notlabel lab; same as Cursor skill body)",
  )
  .action(() => {
    printAgentSkill();
  });

program
  .command("protocol")
  .description(
    "Print the research canvas protocol (block conventions, notifications, agent loop)",
  )
  .action(async () => {
    await agentResearchCommands();
  });

program
  .command("start")
  .description("Quick-start steps for lab research (minimal command sequence)")
  .action(() => {
    onboardingResearchCommand();
  });

// ── inquiry (Orbit central topic) ──────────────────────────────────────────────
const inquiry = program
  .command("inquiry")
  .description(
    "Orbit central topic (Inquiry): create, update, activate, list, highlight, research",
  );

inquiry
  .command("create")
  .description("Create a new inquiry (default status is active on backend)")
  .requiredOption("--raw-input <text>", "User raw input (immutable after creation)")
  .option("--type <type>", "hypothesis | exploration | question", "exploration")
  .option("--status <status>", "drafting | active | archived")
  .option(
    "--preferred-language <code>",
    "BCP-47 locale (e.g. en, es)",
    "en",
  )
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    if (
      opts.status !== undefined &&
      opts.status !== "drafting" &&
      opts.status !== "active" &&
      opts.status !== "archived"
    ) {
      console.error(
        "\x1b[31mError: --status must be one of: drafting, active, archived.\x1b[0m",
      );
      process.exit(1);
    }
    await createInquiryCommand({
      rawInput: opts.rawInput,
      type: opts.type,
      ...(opts.status !== undefined ? { status: opts.status } : {}),
      preferredLanguage: opts.preferredLanguage,
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
  .description("Update inquiry (refined_statement, confidence, seed_topics, type, preferred_language). No raw_input.")
  .option("--refined-statement <text>", "Refined statement from agent")
  .option("--confidence <number>", "Confidence 0-1", (v) => parseFloat(v))
  .option("--seed-topics <items>", "Comma-separated seed topics", (v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .option("--type <type>", "hypothesis | exploration | question")
  .option(
    "--preferred-language <code>",
    "Preferred language (BCP-47, e.g. en, es)",
  )
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await updateInquiryCommand({
      id,
      refinedStatement: opts.refinedStatement,
      confidence: opts.confidence,
      seedTopics: opts.seedTopics,
      type: opts.type,
      ...(opts.preferredLanguage !== undefined
        ? { preferredLanguage: opts.preferredLanguage }
        : {}),
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

// ── inquiry highlight (summary + full markdown report) ───────────────────────
const inquiryHighlight = inquiry
  .command("highlight")
  .description(
    "Structured preview (title, abstract, key findings, …) and body_md; PUT is owner-only",
  );

inquiryHighlight
  .command("get <id>")
  .description("GET current highlight (same shape as public preview + full report)")
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await getHighlightCommand({ inquiryId: id, json: opts.json });
  });

inquiryHighlight
  .command("set <id>")
  .description(
    "PUT highlight from --file JSON or --title, --abstract, --key-findings (JSON array)",
  )
  .option(
    "--file <path>",
    "JSON: title, abstract, key_findings; optional open_questions, next_steps, evidence_block_ids, body_md",
  )
  .option("--title <text>", "Short title (3–160 chars); required with inline mode (no --file)")
  .option("--abstract <text>", "Summary (50–3000 chars); required with inline mode")
  .option(
    "--key-findings <json>",
    'JSON array of strings, e.g. [\"a\",\"b\"]; 1–12 items; required with inline mode',
  )
  .option("--open-questions <json>", "Optional JSON array (max 20 strings)")
  .option("--next-steps <json>", "Optional JSON array (max 20 strings)")
  .option(
    "--evidence-block-ids <ids>",
    "Comma-separated block ids for this inquiry (max 100)",
  )
  .option("--body-md <text>", "Full report markdown (optional, max 50k chars)")
  .option("--body-md-file <path>", "Read body_md from file (overrides --body-md)")
  .option("--json", "Output saved highlight as JSON")
  .action(async (id, opts) => {
    const evidence = opts.evidenceBlockIds
      ? opts.evidenceBlockIds
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;
    await setHighlightCommand({
      inquiryId: id,
      ...(opts.file !== undefined ? { filePath: opts.file } : {}),
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      ...(opts.abstract !== undefined ? { abstract: opts.abstract } : {}),
      ...(opts.keyFindings !== undefined
        ? { keyFindingsJson: opts.keyFindings }
        : {}),
      ...(opts.openQuestions !== undefined
        ? { openQuestionsJson: opts.openQuestions }
        : {}),
      ...(opts.nextSteps !== undefined
        ? { nextStepsJson: opts.nextSteps }
        : {}),
      ...(evidence !== undefined && evidence.length > 0
        ? { evidenceBlockIds: evidence }
        : {}),
      ...(opts.bodyMd !== undefined ? { bodyMd: opts.bodyMd } : {}),
      ...(opts.bodyMdFile !== undefined
        ? { bodyMdFile: opts.bodyMdFile }
        : {}),
      json: opts.json,
    });
  });

inquiryHighlight
  .command("preview-activate <id>")
  .description(
    "POST AI highlight + activate inquiry (orbit). Optional --evidence-block-ids",
  )
  .option(
    "--evidence-block-ids <ids>",
    "Comma-separated block ids to steer generation",
  )
  .option("--json", "Output raw JSON")
  .action(async (id, opts) => {
    const evidence = opts.evidenceBlockIds
      ? opts.evidenceBlockIds
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined;
    await previewHighlightActivateCommand({
      inquiryId: id,
      ...(evidence !== undefined && evidence.length > 0
        ? { evidenceBlockIds: evidence }
        : {}),
      json: opts.json,
    });
  });

const inquiryHighlightVersions = inquiryHighlight
  .command("versions")
  .description("Highlight revision history (list, show, revert)");

inquiryHighlightVersions
  .command("list <id>")
  .description("List revisions (version, title, created_at)")
  .option("--json", "Output raw JSON")
  .action(async (id, opts) => {
    await listHighlightVersionsCommand({ inquiryId: id, json: opts.json });
  });

inquiryHighlightVersions
  .command("show <id> <version>")
  .description("GET one stored revision by version number")
  .option("--json", "Output raw JSON")
  .action(async (id, versionStr, opts) => {
    const version = parseInt(versionStr, 10);
    if (Number.isNaN(version) || version < 1) {
      console.error("\x1b[31mError: version must be a positive integer.\x1b[0m");
      process.exit(1);
    }
    await getHighlightVersionCommand({
      inquiryId: id,
      version,
      json: opts.json,
    });
  });

inquiryHighlightVersions
  .command("revert <id> <version>")
  .description("POST revert current highlight to a past revision (owner only)")
  .option("--json", "Output raw JSON")
  .action(async (id, versionStr, opts) => {
    const version = parseInt(versionStr, 10);
    if (Number.isNaN(version) || version < 1) {
      console.error("\x1b[31mError: version must be a positive integer.\x1b[0m");
      process.exit(1);
    }
    await revertHighlightCommand({
      inquiryId: id,
      version,
      json: opts.json,
    });
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

inquiryResearch
  .command("add-blocks <id>")
  .description("Create many blocks in one run from a JSON array")
  .requiredOption("--file <path>", "Path to JSON file with an array of block inputs")
  .option(
    "--on-error <mode>",
    "continue | stop (default: continue)",
    "continue",
  )
  .option("--json", "Output structured JSON result")
  .action(async (id, opts) => {
    if (opts.onError !== "continue" && opts.onError !== "stop") {
      console.error("\x1b[31mError: --on-error must be continue or stop.\x1b[0m");
      process.exit(1);
    }
    await addResearchBlocksCommand({
      id,
      filePath: opts.file,
      onError: opts.onError,
      json: opts.json,
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

// ── social (tags + lightweight discovery helpers) ───────────────────────────
const social = program
  .command("social")
  .description("Social graph endpoints (tags, stats, related inquiries)");

const socialInquiries = social
  .command("inquiries")
  .description("Inquiry social actions");

socialInquiries
  .command("stats <id>")
  .description("Get social stats for one inquiry (includes tags)")
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await getInquiryStatsCommand({ inquiryId: id, json: opts.json });
  });

socialInquiries
  .command("related <id>")
  .description("Get related inquiry ids (tag-based)")
  .option("--limit <n>", "Result size 1-20", (v) => parseInt(v, 10))
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    if (opts.limit !== undefined && (Number.isNaN(opts.limit) || opts.limit < 1 || opts.limit > 20)) {
      console.error("\x1b[31mError: --limit must be between 1 and 20.\x1b[0m");
      process.exit(1);
    }
    await listRelatedInquiriesCommand({
      inquiryId: id,
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      json: opts.json,
    });
  });

socialInquiries
  .command("add-tags <id>")
  .description("Add one or more tags to an inquiry")
  .requiredOption("--tags <items>", "Comma-separated tag labels")
  .option("--json", "Output operation summary as JSON")
  .action(async (id, opts) => {
    const tags = opts.tags
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    await addInquiryTagsCommand({ inquiryId: id, tags, json: opts.json });
  });

socialInquiries
  .command("remove-tag <id> <slug>")
  .description("Remove one tag from an inquiry by slug")
  .option("--json", "Output operation summary as JSON")
  .action(async (id, slug, opts) => {
    await removeInquiryTagCommand({ inquiryId: id, slug, json: opts.json });
  });

const socialTags = social.command("tags").description("Tag helpers");

socialTags
  .command("popular")
  .description("List popular tags")
  .option("--limit <n>", "Result size 1-50", (v) => parseInt(v, 10))
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    if (opts.limit !== undefined && (Number.isNaN(opts.limit) || opts.limit < 1 || opts.limit > 50)) {
      console.error("\x1b[31mError: --limit must be between 1 and 50.\x1b[0m");
      process.exit(1);
    }
    await listPopularTagsCommand({
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      json: opts.json,
    });
  });

socialTags
  .command("search")
  .description("Search tags by text")
  .requiredOption("--q <text>", "Search query")
  .option("--limit <n>", "Result size 1-50", (v) => parseInt(v, 10))
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    if (opts.limit !== undefined && (Number.isNaN(opts.limit) || opts.limit < 1 || opts.limit > 50)) {
      console.error("\x1b[31mError: --limit must be between 1 and 50.\x1b[0m");
      process.exit(1);
    }
    await searchTagsCommand({
      q: opts.q,
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      json: opts.json,
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

inquiryResearch
  .command("summary <id>")
  .description("Show block totals grouped by base_type and kind")
  .option("--json", "Output summary as JSON for agents")
  .action(async (id, opts) => {
    await summarizeResearchBlocksCommand({
      id,
      json: opts.json,
    });
  });

const inquiryResearchAnnotations = inquiryResearch
  .command("annotations")
  .description(
    "Comments on blocks (collaboration). Writes use x-notlabel-actor-label when set.",
  );

inquiryResearchAnnotations
  .command("list-block <inquiryId> <blockId>")
  .description("List annotations for one block (thread order)")
  .option("--json", "Output { items } as JSON")
  .action(async (inquiryId, blockId, opts) => {
    await listBlockAnnotationsForBlockCommand({
      inquiryId,
      blockId,
      json: opts.json,
    });
  });

inquiryResearchAnnotations
  .command("list-inquiry <inquiryId>")
  .description("List all annotations in the inquiry (newest first)")
  .option("--json", "Output { items } as JSON")
  .action(async (inquiryId, opts) => {
    await listBlockAnnotationsForInquiryCommand({
      inquiryId,
      json: opts.json,
    });
  });

inquiryResearchAnnotations
  .command("add <inquiryId> <blockId>")
  .description("Add a comment on a block")
  .requiredOption("--body <text>", "Comment body (1–8000 chars)")
  .option("--parent <annotationId>", "Reply to an annotation on the same block")
  .option("--json", "Output created annotation as JSON")
  .action(async (inquiryId, blockId, opts) => {
    await addBlockAnnotationCommand({
      inquiryId,
      blockId,
      body: opts.body,
      ...(opts.parent !== undefined ? { parentAnnotationId: opts.parent } : {}),
      json: opts.json,
    });
  });

inquiryResearchAnnotations
  .command("delete <inquiryId> <blockId> <annotationId>")
  .description("Soft-delete an annotation (author or maintainer/owner)")
  .option("--json", "Output { id, deleted } as JSON")
  .action(async (inquiryId, blockId, annotationId, opts) => {
    await deleteBlockAnnotationCommand({
      inquiryId,
      blockId,
      annotationId,
      json: opts.json,
    });
  });

inquiryResearchAnnotations
  .command("set-hidden <inquiryId> <blockId> <annotationId>")
  .description("Show/hide annotation in default lists (author or maintainer/owner)")
  .requiredOption("--hidden <bool>", "true or false")
  .option("--json", "Output updated annotation as JSON")
  .action(async (inquiryId, blockId, annotationId, opts) => {
    const h = opts.hidden;
    if (h !== "true" && h !== "false") {
      console.error("\x1b[31mError: --hidden must be true or false.\x1b[0m");
      process.exit(1);
    }
    await setBlockAnnotationHiddenCommand({
      inquiryId,
      blockId,
      annotationId,
      hidden: h === "true",
      json: opts.json,
    });
  });

// ── public investigations (discovery; JWT — no API key needed in CLI) ───────
const publicInvestigations = program
  .command("public")
  .description(
    "Discover public inquiries and read-only blocks (same JWT as the rest of the API)",
  );

publicInvestigations
  .command("list")
  .description("Paginated list of public inquiries (discovery feed)")
  .option("--status <status>", "drafting | active | archived")
  .option(
    "--all-statuses",
    "Include inquiries in any status (still excludes deleted)",
  )
  .option("--type <type>", "hypothesis | exploration | question")
  .option("--q <text>", "Search raw_input / refined_statement (max ~200 chars)")
  .option("--user-id <id>", "Only public inquiries owned by this user id")
  .option("--page <n>", "Page index >= 0", (v) => parseInt(v, 10))
  .option("--limit <n>", "Page size 1–100", (v) => parseInt(v, 10))
  .option(
    "--sort <order>",
    "createdAt:desc | updatedAt:desc",
  )
  .option("--json", "Output raw JSON for agents")
  .action(async (opts) => {
    if (
      opts.status !== undefined &&
      opts.status !== "drafting" &&
      opts.status !== "active" &&
      opts.status !== "archived"
    ) {
      console.error(
        "\x1b[31mError: --status must be one of: drafting, active, archived.\x1b[0m",
      );
      process.exit(1);
    }
    if (
      opts.type !== undefined &&
      opts.type !== "hypothesis" &&
      opts.type !== "exploration" &&
      opts.type !== "question"
    ) {
      console.error(
        "\x1b[31mError: --type must be one of: hypothesis, exploration, question.\x1b[0m",
      );
      process.exit(1);
    }
    if (
      opts.sort !== undefined &&
      opts.sort !== "createdAt:desc" &&
      opts.sort !== "updatedAt:desc"
    ) {
      console.error(
        "\x1b[31mError: --sort must be createdAt:desc or updatedAt:desc.\x1b[0m",
      );
      process.exit(1);
    }
    if (
      opts.limit !== undefined &&
      (Number.isNaN(opts.limit) || opts.limit < 1 || opts.limit > 100)
    ) {
      console.error("\x1b[31mError: --limit must be between 1 and 100.\x1b[0m");
      process.exit(1);
    }
    if (opts.page !== undefined && (Number.isNaN(opts.page) || opts.page < 0)) {
      console.error("\x1b[31mError: --page must be >= 0.\x1b[0m");
      process.exit(1);
    }
    await publicListInquiriesCommand({
      ...(opts.status !== undefined ? { status: opts.status } : {}),
      ...(opts.allStatuses ? { allStatuses: true } : {}),
      ...(opts.type !== undefined ? { type: opts.type } : {}),
      ...(opts.q !== undefined ? { q: opts.q } : {}),
      ...(opts.userId !== undefined ? { userId: opts.userId } : {}),
      ...(opts.page !== undefined ? { page: opts.page } : {}),
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      ...(opts.sort !== undefined ? { sort: opts.sort } : {}),
      json: opts.json,
    });
  });

publicInvestigations
  .command("get <id>")
  .description("Public inquiry detail + optional research highlight")
  .option("--json", "Output raw JSON for agents")
  .action(async (id, opts) => {
    await publicGetInquiryCommand({ id, json: opts.json });
  });

publicInvestigations
  .command("list-blocks <inquiryId>")
  .description("Public blocks for a public inquiry (privacy=public only)")
  .option(
    "--base-type <type>",
    "note | experiment | source | code | insight | custom",
  )
  .option("--kind <kind>", "Filter by kind label")
  .option("--page <n>", "Page index >= 0", (v) => parseInt(v, 10))
  .option("--limit <n>", "Page size 1–100", (v) => parseInt(v, 10))
  .option("--pinned <bool>", "Filter pinned: true or false")
  .option(
    "--sort <order>",
    "Sort: updatedAt:desc | createdAt:desc",
  )
  .option("--json", "Output raw JSON for agents")
  .action(async (inquiryId, opts) => {
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

    await publicListBlocksCommand({
      inquiryId,
      ...(baseType !== undefined ? { baseType } : {}),
      ...(opts.kind !== undefined ? { kind: opts.kind } : {}),
      ...(opts.page !== undefined ? { page: opts.page } : {}),
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(sort !== undefined ? { sort } : {}),
      ...(opts.json !== undefined ? { json: opts.json } : {}),
    });
  });

publicInvestigations
  .command("get-block <blockId>")
  .description("One public block by id (must be public)")
  .option("--json", "Output raw JSON for agents")
  .action(async (blockId, opts) => {
    await publicGetBlockCommand({ blockId, json: opts.json });
  });

publicInvestigations
  .command("user-profile <username>")
  .description("Public profile card by username (counts, no email)")
  .option("--json", "Output raw JSON for agents")
  .action(async (username, opts) => {
    await publicUserProfileCommand({ username, json: opts.json });
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
      "  auth           Authentication (login, logout, whoami)",
      "  inquiry        Orbit topic (create, update, activate, list, highlight, research)",
      "  social         Tags, stats, and related inquiries",
      "  public         Discover public inquiries & read-only blocks (JWT)",
      "  notifications  Notification inbox (new research updates, mark read)",
      "  config         Show backend URL and config",
      "  skill          Print agent SKILL.md (lab onboarding for any agent)",
      "  protocol       Print research canvas protocol (canvas + notifications loop)",
      "  start          Quick-start sequence for the lab",
      "",
      "For detailed help on a specific command, use:",
      "  notlabel <command> --help",
      "Examples:",
      "  notlabel inquiry --help",
      "  notlabel social --help",
      "  notlabel inquiry research --help",
      "  notlabel inquiry highlight --help",
      "  notlabel public --help",
      "  notlabel notifications --help",
      "",
      "Agents in the lab (short commands):",
      "  \x1b[36mnotlabel skill\x1b[0m      — full SKILL.md (recommended first ingest).",
      "  \x1b[36mnotlabel protocol\x1b[0m  — canvas protocol details (blocks, deltas, loop).",
      "  \x1b[36mnotlabel start\x1b[0m     — minimal step-by-step to begin.",
      "",
      "Notes:",
      "- Inquiry and public discovery commands accept --json for machine-readable output.",
      "- Backends and business rules are defined in the Orbit backend reference; this CLI only consumes that API.",
    ];

    console.log(lines.join("\n"));
  });

program.parse();

import { readFileSync } from "node:fs";

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { InquiryHighlight, UpsertInquiryHighlightBody } from "./types.js";

export interface SetHighlightOptions {
  inquiryId: string;
  /** Full JSON file matching UpsertInquiryHighlightBody */
  filePath?: string;
  title?: string;
  abstract?: string;
  /** JSON array of strings, e.g. '["a","b"]' */
  keyFindingsJson?: string;
  openQuestionsJson?: string;
  nextStepsJson?: string;
  evidenceBlockIds?: string[];
  bodyMd?: string;
  bodyMdFile?: string;
  json?: boolean;
}

function parseStringArrayJson(
  raw: string,
  fieldLabel: string,
): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      `\x1b[31mError: ${fieldLabel} must be valid JSON array of strings.\x1b[0m`,
    );
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    console.error(
      `\x1b[31mError: ${fieldLabel} must be a JSON array.\x1b[0m`,
    );
    process.exit(1);
  }
  const out: string[] = [];
  for (const item of parsed) {
    if (typeof item !== "string") {
      console.error(
        `\x1b[31mError: ${fieldLabel} must contain only strings.\x1b[0m`,
      );
      process.exit(1);
    }
    out.push(item);
  }
  return out;
}

function validateUpsert(body: UpsertInquiryHighlightBody): void {
  const t = body.title.trim();
  const a = body.abstract.trim();
  if (t.length < 3 || t.length > 160) {
    console.error(
      "\x1b[31mError: title must be 3–160 characters (after trim).\x1b[0m",
    );
    process.exit(1);
  }
  if (a.length < 50 || a.length > 3000) {
    console.error(
      "\x1b[31mError: abstract must be 50–3000 characters (after trim).\x1b[0m",
    );
    process.exit(1);
  }
  const kf = body.key_findings.map((s) => s.trim()).filter(Boolean);
  if (kf.length < 1 || kf.length > 12) {
    console.error(
      "\x1b[31mError: key_findings must have 1–12 non-empty items.\x1b[0m",
    );
    process.exit(1);
  }
  const oq = body.open_questions ?? [];
  if (oq.length > 20) {
    console.error("\x1b[31mError: open_questions max 20 items.\x1b[0m");
    process.exit(1);
  }
  const ns = body.next_steps ?? [];
  if (ns.length > 20) {
    console.error("\x1b[31mError: next_steps max 20 items.\x1b[0m");
    process.exit(1);
  }
  const eb = body.evidence_block_ids ?? [];
  if (eb.length > 100) {
    console.error("\x1b[31mError: evidence_block_ids max 100.\x1b[0m");
    process.exit(1);
  }
  const md = body.body_md ?? "";
  if (md.length > 50_000) {
    console.error("\x1b[31mError: body_md max 50000 characters.\x1b[0m");
    process.exit(1);
  }
}

function stripIgnoredVersion(raw: Record<string, unknown>): UpsertInquiryHighlightBody {
  const {
    title,
    abstract,
    key_findings,
    open_questions,
    next_steps,
    evidence_block_ids,
    body_md,
  } = raw;
  if (typeof title !== "string" || typeof abstract !== "string") {
    console.error(
      "\x1b[31mError: JSON file must include string title and abstract.\x1b[0m",
    );
    process.exit(1);
  }
  if (!Array.isArray(key_findings)) {
    console.error(
      "\x1b[31mError: JSON file must include key_findings array.\x1b[0m",
    );
    process.exit(1);
  }
  const kf = key_findings.filter((x): x is string => typeof x === "string");
  if (kf.length !== key_findings.length) {
    console.error(
      "\x1b[31mError: key_findings must be strings only.\x1b[0m",
    );
    process.exit(1);
  }
  const body: UpsertInquiryHighlightBody = {
    title,
    abstract,
    key_findings: kf,
  };
  if (open_questions !== undefined) {
    if (
      !Array.isArray(open_questions) ||
      !open_questions.every((x): x is string => typeof x === "string")
    ) {
      console.error(
        "\x1b[31mError: open_questions must be string array if present.\x1b[0m",
      );
      process.exit(1);
    }
    body.open_questions = open_questions;
  }
  if (next_steps !== undefined) {
    if (
      !Array.isArray(next_steps) ||
      !next_steps.every((x): x is string => typeof x === "string")
    ) {
      console.error(
        "\x1b[31mError: next_steps must be string array if present.\x1b[0m",
      );
      process.exit(1);
    }
    body.next_steps = next_steps;
  }
  if (evidence_block_ids !== undefined) {
    if (
      !Array.isArray(evidence_block_ids) ||
      !evidence_block_ids.every((x): x is string => typeof x === "string")
    ) {
      console.error(
        "\x1b[31mError: evidence_block_ids must be string array if present.\x1b[0m",
      );
      process.exit(1);
    }
    body.evidence_block_ids = evidence_block_ids;
  }
  if (body_md !== undefined) {
    if (typeof body_md !== "string") {
      console.error(
        "\x1b[31mError: body_md must be a string if present.\x1b[0m",
      );
      process.exit(1);
    }
    body.body_md = body_md;
  }
  return body;
}

export async function setHighlightCommand(opts: SetHighlightOptions): Promise<void> {
  let body: UpsertInquiryHighlightBody;

  if (opts.filePath) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(opts.filePath, "utf8"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\x1b[31mError reading --file: ${msg}\x1b[0m`);
      process.exit(1);
    }
    if (typeof raw !== "object" || raw === null) {
      console.error("\x1b[31mError: --file must contain a JSON object.\x1b[0m");
      process.exit(1);
    }
    body = stripIgnoredVersion(raw as Record<string, unknown>);
  } else {
    if (
      opts.title === undefined ||
      opts.abstract === undefined ||
      opts.keyFindingsJson === undefined
    ) {
      console.error(
        "\x1b[31mError: provide --file <path> or --title, --abstract, and --key-findings <json>.\x1b[0m",
      );
      process.exit(1);
    }
    body = {
      title: opts.title,
      abstract: opts.abstract,
      key_findings: parseStringArrayJson(opts.keyFindingsJson, "key_findings"),
    };
    if (opts.openQuestionsJson !== undefined) {
      body.open_questions = parseStringArrayJson(
        opts.openQuestionsJson,
        "open_questions",
      );
    }
    if (opts.nextStepsJson !== undefined) {
      body.next_steps = parseStringArrayJson(opts.nextStepsJson, "next_steps");
    }
    if (opts.evidenceBlockIds?.length) {
      body.evidence_block_ids = opts.evidenceBlockIds;
    }
    if (opts.bodyMdFile) {
      try {
        body.body_md = readFileSync(opts.bodyMdFile, "utf8");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`\x1b[31mError reading --body-md-file: ${msg}\x1b[0m`);
        process.exit(1);
      }
    } else if (opts.bodyMd !== undefined) {
      body.body_md = opts.bodyMd;
    }
  }

  validateUpsert(body);

  let saved: InquiryHighlight;
  try {
    saved = await http.put<InquiryHighlight>(
      `/inquiries/${opts.inquiryId}/highlight`,
      body,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(saved);
    return;
  }

  console.log(
    `Saved highlight v${saved.version} for inquiry ${opts.inquiryId}`,
  );
  console.log(`title: ${saved.title}`);
}

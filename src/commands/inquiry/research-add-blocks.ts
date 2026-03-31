import { readFileSync } from "node:fs";
import { http, HttpError } from "../../core/http.js";
import { warnBlockDataConventions } from "./block-data-hints.js";
import type { Block, BlockBaseType, CreateBlockBody } from "./types.js";
import { printJson } from "./common.js";

interface BlockInput {
  content?: string;
  kind?: string;
  base_type?: "note" | "experiment" | "source" | "code" | "insight" | "custom";
  title?: string;
  data?: Record<string, unknown>;
  linked_block_ids?: string[];
  privacy?: "private" | "public";
}

export interface AddResearchBlocksOptions {
  id: string;
  filePath: string;
  onError: "continue" | "stop";
  json?: boolean;
}

export async function addResearchBlocksCommand(
  opts: AddResearchBlocksOptions,
): Promise<void> {
  let raw: string;
  try {
    raw = readFileSync(opts.filePath, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31mError reading file: ${message}\x1b[0m`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("\x1b[31mError: --file must contain valid JSON.\x1b[0m");
    process.exit(1);
  }

  if (!Array.isArray(parsed)) {
    console.error("\x1b[31mError: --file JSON must be an array of block objects.\x1b[0m");
    process.exit(1);
  }

  const items = parsed as BlockInput[];
  const results: Array<{ index: number; ok: boolean; error?: string }> = [];

  for (const [index, item] of items.entries()) {
    const content = item.content?.trim();
    if (!content) {
      results.push({
        index,
        ok: false,
        error: "--content is required and must be non-empty",
      });
      if (opts.onError === "stop") break;
      continue;
    }

    const kind = (item.kind ?? "note").trim();
    if (!kind) {
      results.push({
        index,
        ok: false,
        error: "--kind must be non-empty when set",
      });
      if (opts.onError === "stop") break;
      continue;
    }

    const base_type = item.base_type ?? "note";
    warnBlockDataConventions(base_type as BlockBaseType, kind, item.data);
    const body: CreateBlockBody = {
      kind,
      base_type,
      content,
      ...(item.title !== undefined && item.title.trim() !== ""
        ? { title: item.title.trim() }
        : {}),
      ...(item.data !== undefined ? { data: item.data } : {}),
      ...(item.linked_block_ids?.length
        ? { linked_block_ids: item.linked_block_ids }
        : {}),
      ...(item.privacy ? { privacy: item.privacy } : {}),
    };

    try {
      await http.post<Block>(`/inquiries/${opts.id}/blocks`, body);
      results.push({ index, ok: true });
    } catch (err) {
      const message =
        err instanceof HttpError
          ? `Request failed (${err.status}): ${err.body}`
          : err instanceof Error
            ? err.message
            : String(err);
      results.push({ index, ok: false, error: message });
      if (opts.onError === "stop") break;
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);

  if (opts.json) {
    printJson({
      inquiry_id: opts.id,
      total: items.length,
      ok: okCount,
      failed: fail.length,
      results,
    });
    return;
  }

  console.log("\x1b[32mBatch add-blocks finished.\x1b[0m");
  console.log(`inquiry_id: ${opts.id}`);
  console.log(`total:      ${items.length}`);
  console.log(`ok:         ${okCount}`);
  console.log(`failed:     ${fail.length}`);
  if (fail.length > 0) {
    console.log("");
    console.log("Failed items:");
    for (const f of fail) {
      console.log(`- index ${f.index}: ${f.error ?? "unknown error"}`);
    }
  }
  console.log();
}

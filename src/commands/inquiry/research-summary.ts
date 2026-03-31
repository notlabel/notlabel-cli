import { http } from "../../core/http.js";
import type { Block, BlockBaseType, ListBlocksResponse } from "./types.js";
import { handleApiError, printJson } from "./common.js";

export interface SummarizeResearchBlocksOptions {
  id: string;
  json?: boolean;
}

interface Summary {
  inquiry_id: string;
  total_blocks: number;
  by_base_type: Record<BlockBaseType, number>;
  by_kind: Record<string, number>;
}

function emptySummary(id: string): Summary {
  return {
    inquiry_id: id,
    total_blocks: 0,
    by_base_type: {
      note: 0,
      experiment: 0,
      source: 0,
      code: 0,
      insight: 0,
      custom: 0,
    },
    by_kind: {},
  };
}

export async function summarizeResearchBlocksCommand(
  opts: SummarizeResearchBlocksOptions,
): Promise<void> {
  const summary = emptySummary(opts.id);
  const limit = 100;
  let page = 0;

  while (true) {
    const path = `/inquiries/${opts.id}/blocks?page=${page}&limit=${limit}`;
    let data: ListBlocksResponse | Block[];
    try {
      data = await http.get<ListBlocksResponse | Block[]>(path);
    } catch (err) {
      handleApiError(err);
    }

    const payload = Array.isArray(data)
      ? { items: data, pagination: null }
      : { items: data.items ?? [], pagination: data.pagination ?? null };
    const items = payload.items;

    for (const block of items) {
      summary.total_blocks += 1;
      summary.by_base_type[block.base_type] += 1;
      summary.by_kind[block.kind] = (summary.by_kind[block.kind] ?? 0) + 1;
    }

    if (!payload.pagination?.has_next) break;
    page += 1;
  }

  if (opts.json) {
    printJson(summary);
    return;
  }

  console.log(`inquiry_id:   ${summary.inquiry_id}`);
  console.log(`total_blocks: ${summary.total_blocks}`);
  console.log("");
  console.log("base_type counts:");
  for (const [baseType, count] of Object.entries(summary.by_base_type)) {
    console.log(`- ${baseType}: ${count}`);
  }
  console.log("");
  console.log("kind counts:");
  const kinds = Object.entries(summary.by_kind).sort((a, b) => b[1] - a[1]);
  if (!kinds.length) {
    console.log("- none");
  } else {
    for (const [kind, count] of kinds) {
      console.log(`- ${kind}: ${count}`);
    }
  }
  console.log();
}

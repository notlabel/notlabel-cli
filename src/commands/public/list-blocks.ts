import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { BlockBaseType } from "../inquiry/types.js";
import type { PublicListBlocksResponse } from "./types.js";

export interface PublicListBlocksOptions {
  inquiryId: string;
  baseType?: BlockBaseType;
  kind?: string;
  page?: number;
  limit?: number;
  pinned?: boolean;
  sort?: "updatedAt:desc" | "createdAt:desc";
  json?: boolean;
}

export async function publicListBlocksCommand(
  opts: PublicListBlocksOptions,
): Promise<void> {
  const params = new URLSearchParams();
  if (opts.baseType) params.set("base_type", opts.baseType);
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.pinned !== undefined) params.set("pinned", String(opts.pinned));
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.page !== undefined) params.set("page", String(opts.page));
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const path = `/public/investigations/inquiries/${opts.inquiryId}/blocks${qs ? `?${qs}` : ""}`;

  let result: PublicListBlocksResponse;
  try {
    result = await http.get<PublicListBlocksResponse>(path);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  const blocks = result.items ?? [];
  if (!blocks.length) {
    console.log("No public blocks for this inquiry (or inquiry not public).");
    if (result.pagination) {
      const p = result.pagination;
      console.log(`page=${p.page} limit=${p.limit} total=${p.total}`);
    }
    console.log();
    return;
  }

  blocks.forEach((block, index) => {
    const preview =
      (block.content && block.content.trim()) ||
      (block.title && block.title.trim()) ||
      "—";
    const short =
      preview.length > 120 ? `${preview.slice(0, 120)}…` : preview;
    const pin = block.is_pinned ? " 📌" : "";
    console.log(
      `${index + 1}. ${block.id}  [${block.base_type}/${block.kind}]${pin}`,
    );
    console.log(`   ${short}`);
  });
  if (result.pagination) {
    const p = result.pagination;
    console.log();
    console.log(
      `pagination: page=${p.page} limit=${p.limit} total=${p.total} has_next=${p.has_next}`,
    );
  }
  console.log();
}

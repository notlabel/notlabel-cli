import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type {
  Block,
  BlockBaseType,
  BlocksPagination,
  ListBlocksResponse,
} from "./types.js";

export interface ListResearchBlocksOptions {
  id: string;
  baseType?: BlockBaseType;
  kind?: string;
  pinned?: boolean;
  sort?: "updatedAt:desc" | "createdAt:desc";
  page?: number;
  limit?: number;
  json?: boolean;
}

function normalizeBlocksPayload(data: unknown): {
  items: Block[];
  pagination: BlocksPagination | null;
} {
  if (Array.isArray(data)) {
    return { items: data as Block[], pagination: null };
  }
  if (data && typeof data === "object" && "items" in data) {
    const itemsRaw = (data as { items?: unknown }).items;
    const paginationRaw = (data as { pagination?: unknown }).pagination;
    const items = Array.isArray(itemsRaw) ? (itemsRaw as Block[]) : [];
    const pagination =
      paginationRaw && typeof paginationRaw === "object"
        ? (paginationRaw as BlocksPagination)
        : null;
    return { items, pagination };
  }
  return { items: [], pagination: null };
}

export async function listResearchBlocksCommand(
  opts: ListResearchBlocksOptions,
): Promise<void> {
  const params = new URLSearchParams();
  if (opts.baseType) params.set("base_type", opts.baseType);
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.pinned !== undefined) params.set("pinned", String(opts.pinned));
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.page !== undefined) params.set("page", String(opts.page));
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const path = `/inquiries/${opts.id}/blocks${qs ? `?${qs}` : ""}`;

  let result: { items: Block[]; pagination: BlocksPagination | null };
  try {
    const data = await http.get<ListBlocksResponse | Block[]>(path);
    result = normalizeBlocksPayload(data);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  const blocks = result.items;
  if (!blocks.length) {
    console.log("No blocks found for this inquiry.");
    if (result.pagination) {
      const p = result.pagination;
      console.log(`page=${p.page} limit=${p.limit} total=${p.total} has_next=${p.has_next}`);
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

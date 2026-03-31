import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type {
  Block,
  BlockBaseType,
  BlocksPagination,
  CreateBlockBody,
  InquiryPrivacy,
  ListBlocksResponse,
} from "./types.js";

export interface AddResearchBlockOptions {
  id: string;
  content: string;
  kind?: string;
  baseType?: BlockBaseType;
  title?: string;
  data?: Record<string, unknown>;
  linkedBlockIds?: string[];
  privacy?: InquiryPrivacy;
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

async function validateLinkedBlockIds(
  inquiryId: string,
  linkedBlockIds: string[],
): Promise<string[]> {
  const wanted = new Set(linkedBlockIds);
  const found = new Set<string>();
  let page = 0;
  const limit = 100;

  while (found.size < wanted.size) {
    const path = `/inquiries/${inquiryId}/blocks?page=${page}&limit=${limit}`;
    const data = await http.get<ListBlocksResponse | Block[]>(path);
    const result = normalizeBlocksPayload(data);

    for (const block of result.items) {
      if (wanted.has(block.id)) found.add(block.id);
    }

    if (!result.pagination?.has_next) break;
    page += 1;
  }

  return linkedBlockIds.filter((id) => !found.has(id));
}

export async function addResearchBlockCommand(
  opts: AddResearchBlockOptions,
): Promise<void> {
  const content = opts.content?.trim();
  if (!content) {
    console.error(
      "\x1b[31mError: --content is required and must be non-empty.\x1b[0m",
    );
    process.exit(1);
  }

  const kind = (opts.kind ?? "note").trim();
  if (!kind) {
    console.error("\x1b[31mError: --kind must be non-empty when set.\x1b[0m");
    process.exit(1);
  }

  const base_type = opts.baseType ?? "note";

  const body: CreateBlockBody = {
    kind,
    base_type,
    content,
    ...(opts.title !== undefined && opts.title.trim() !== ""
      ? { title: opts.title.trim() }
      : {}),
    ...(opts.data !== undefined ? { data: opts.data } : {}),
    ...(opts.linkedBlockIds?.length ? { linked_block_ids: opts.linkedBlockIds } : {}),
    ...(opts.privacy ? { privacy: opts.privacy } : {}),
  };

  if (opts.linkedBlockIds?.length) {
    let missingIds: string[] = [];
    try {
      missingIds = await validateLinkedBlockIds(opts.id, opts.linkedBlockIds);
    } catch (err) {
      handleApiError(err);
    }
    if (missingIds.length > 0) {
      console.error(
        `\x1b[31mError: --linked-blocks contains unknown block ids for inquiry ${opts.id}: ${missingIds.join(", ")}\x1b[0m`,
      );
      process.exit(1);
    }
  }

  let block: Block;
  try {
    block = await http.post<Block>(`/inquiries/${opts.id}/blocks`, body);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(block);
    return;
  }

  console.log("\x1b[32mBlock created.\x1b[0m");
  console.log(`block_id:     ${block.id}`);
  console.log(`inquiry_id:   ${block.inquiry_id}`);
  console.log(`kind:         ${block.kind}`);
  console.log(`base_type:    ${block.base_type}`);
  if (block.title) console.log(`title:        ${block.title}`);
  const preview = block.content ?? "";
  console.log(
    `content:      ${preview.slice(0, 120)}${preview.length > 120 ? "…" : ""}`,
  );
  console.log();
}

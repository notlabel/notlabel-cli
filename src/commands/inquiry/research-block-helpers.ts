import { http } from "../../core/http.js";
import type { Block, BlocksPagination, ListBlocksResponse } from "./types.js";

export function normalizeBlocksPayload(data: unknown): {
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

export async function validateLinkedBlockIdsInInquiry(
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

export async function validateLinkedBlockIdsInTopic(
  topicId: string,
  linkedBlockIds: string[],
): Promise<string[]> {
  const wanted = new Set(linkedBlockIds);
  const found = new Set<string>();
  let page = 0;
  const limit = 100;

  while (found.size < wanted.size) {
    const path = `/topics/${topicId}/blocks?page=${page}&limit=${limit}`;
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

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Block, BlockBaseType, CreateBlockBody, InquiryPrivacy } from "./types.js";

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

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { PublicBlock } from "./types.js";

export async function publicGetBlockCommand(opts: {
  blockId: string;
  json?: boolean;
}): Promise<void> {
  let block: PublicBlock;
  try {
    block = await http.get<PublicBlock>(
      `/public/investigations/blocks/${opts.blockId}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(block);
    return;
  }

  console.log(`id:          ${block.id}`);
  if (block.inquiry_id) console.log(`inquiry_id:  ${block.inquiry_id}`);
  console.log(`kind:        ${block.kind}`);
  console.log(`base_type:   ${block.base_type}`);
  if (block.title) console.log(`title:       ${block.title}`);
  const prev = block.content ?? "";
  console.log(
    `content:     ${prev.slice(0, 200)}${prev.length > 200 ? "…" : ""}`,
  );
  console.log();
}

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Block } from "./types.js";

export interface GetResearchBlockOptions {
  blockId: string;
  json?: boolean;
}

export async function getResearchBlockCommand(
  opts: GetResearchBlockOptions,
): Promise<void> {
  let block: Block;
  try {
    block = await http.get<Block>(`/blocks/${opts.blockId}`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(block);
    return;
  }

  console.log(`id:           ${block.id}`);
  if (block.inquiry_id) console.log(`inquiry_id:   ${block.inquiry_id}`);
  if (block.topic_id) console.log(`topic_id:     ${block.topic_id}`);
  console.log(`kind:         ${block.kind}`);
  console.log(`base_type:    ${block.base_type}`);
  if (block.title) console.log(`title:        ${block.title}`);
  const preview = block.content ?? "";
  console.log(
    `content:      ${preview.slice(0, 200)}${preview.length > 200 ? "…" : ""}`,
  );
  if (block.linked_block_ids?.length) {
    console.log(`linked_blocks: ${block.linked_block_ids.join(", ")}`);
  }
  console.log();
}

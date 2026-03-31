import { http } from "../../core/http.js";
import { warnBlockDataConventions } from "./block-data-hints.js";
import { handleApiError, printJson } from "./common.js";
import {
  validateLinkedBlockIdsInTopic,
} from "./research-block-helpers.js";
import type {
  Block,
  BlockBaseType,
  CreateBlockBody,
  InquiryPrivacy,
} from "./types.js";

export interface AddResearchBlockOnTopicOptions {
  topicId: string;
  content: string;
  kind?: string;
  baseType?: BlockBaseType;
  title?: string;
  data?: Record<string, unknown>;
  linkedBlockIds?: string[];
  privacy?: InquiryPrivacy;
  json?: boolean;
}

export async function addResearchBlockOnTopicCommand(
  opts: AddResearchBlockOnTopicOptions,
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
  warnBlockDataConventions(base_type, kind, opts.data);

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
      missingIds = await validateLinkedBlockIdsInTopic(
        opts.topicId,
        opts.linkedBlockIds,
      );
    } catch (err) {
      handleApiError(err);
    }
    if (missingIds.length > 0) {
      console.error(
        `\x1b[31mError: --linked-blocks contains unknown block ids for topic ${opts.topicId}: ${missingIds.join(", ")}\x1b[0m`,
      );
      process.exit(1);
    }
  }

  let block: Block;
  try {
    block = await http.post<Block>(
      `/topics/${opts.topicId}/blocks`,
      body,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(block);
    return;
  }

  console.log("\x1b[32mBlock created on topic.\x1b[0m");
  console.log(`block_id:     ${block.id}`);
  console.log(`topic_id:     ${opts.topicId}`);
  if (block.inquiry_id) console.log(`inquiry_id:   ${block.inquiry_id}`);
  console.log(`kind:         ${block.kind}`);
  console.log(`base_type:    ${block.base_type}`);
  console.log();
}

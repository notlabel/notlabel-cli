import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import {
  validateLinkedBlockIdsInInquiry,
  validateLinkedBlockIdsInTopic,
} from "./research-block-helpers.js";
import type { Block, BlockBaseType, InquiryPrivacy, UpdateBlockBody } from "./types.js";

export interface UpdateResearchBlockOptions {
  blockId: string;
  kind?: string;
  baseType?: BlockBaseType;
  title?: string;
  content?: string;
  data?: Record<string, unknown>;
  linkedBlockIds?: string[];
  privacy?: InquiryPrivacy;
  isPinned?: boolean;
  /** Inquiry id: required when updating linked_block_ids (client-side validation). */
  inquiryIdForLinks?: string;
  /** Topic id: required when updating linked_block_ids on topic-scoped blocks. */
  topicIdForLinks?: string;
  json?: boolean;
}

export async function updateResearchBlockCommand(
  opts: UpdateResearchBlockOptions,
): Promise<void> {
  const body: UpdateBlockBody = {};
  if (opts.kind !== undefined) body.kind = opts.kind.trim();
  if (opts.baseType !== undefined) body.base_type = opts.baseType;
  if (opts.title !== undefined) body.title = opts.title;
  if (opts.content !== undefined) body.content = opts.content;
  if (opts.data !== undefined) body.data = opts.data;
  if (opts.linkedBlockIds !== undefined) {
    body.linked_block_ids = opts.linkedBlockIds;
  }
  if (opts.privacy !== undefined) body.privacy = opts.privacy;
  if (opts.isPinned !== undefined) body.is_pinned = opts.isPinned;

  const keys = Object.keys(body).filter(
    (k) => (body as Record<string, unknown>)[k] !== undefined,
  );
  if (keys.length === 0) {
    console.error(
      "\x1b[31mError: provide at least one of --kind, --base-type, --title, --content, --data, --linked-blocks, --privacy, --pinned.\x1b[0m",
    );
    process.exit(1);
  }

  if (opts.linkedBlockIds !== undefined && opts.linkedBlockIds.length > 0) {
    if (opts.inquiryIdForLinks) {
      let missing: string[] = [];
      try {
        missing = await validateLinkedBlockIdsInInquiry(
          opts.inquiryIdForLinks,
          opts.linkedBlockIds,
        );
      } catch (err) {
        handleApiError(err);
      }
      if (missing.length) {
        console.error(
          `\x1b[31mError: --linked-blocks unknown for inquiry ${opts.inquiryIdForLinks}: ${missing.join(", ")}\x1b[0m`,
        );
        process.exit(1);
      }
    } else if (opts.topicIdForLinks) {
      let missing: string[] = [];
      try {
        missing = await validateLinkedBlockIdsInTopic(
          opts.topicIdForLinks,
          opts.linkedBlockIds,
        );
      } catch (err) {
        handleApiError(err);
      }
      if (missing.length) {
        console.error(
          `\x1b[31mError: --linked-blocks unknown for topic ${opts.topicIdForLinks}: ${missing.join(", ")}\x1b[0m`,
        );
        process.exit(1);
      }
    } else {
      console.error(
        "\x1b[31mError: when setting non-empty --linked-blocks, pass --inquiry-id or --topic-id so the CLI can validate ids.\x1b[0m",
      );
      process.exit(1);
    }
  }

  let block: Block;
  try {
    block = await http.patch<Block>(`/blocks/${opts.blockId}`, body);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(block);
    return;
  }

  console.log("\x1b[32mBlock updated.\x1b[0m");
  console.log(`block_id:     ${block.id}`);
  console.log();
}

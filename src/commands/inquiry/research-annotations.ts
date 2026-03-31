import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type {
  BlockAnnotation,
  CreateBlockAnnotationBody,
  ListBlockAnnotationsResponse,
} from "./types.js";

export async function listBlockAnnotationsForBlockCommand(opts: {
  inquiryId: string;
  blockId: string;
  json?: boolean;
}): Promise<void> {
  let data: ListBlockAnnotationsResponse;
  try {
    data = await http.get<ListBlockAnnotationsResponse>(
      `/inquiries/${opts.inquiryId}/blocks/${opts.blockId}/annotations`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(data);
    return;
  }

  const items = data.items ?? [];
  if (!items.length) {
    console.log("No annotations for this block.");
    console.log();
    return;
  }
  items.forEach((a, i) => printAnnotationLine(a, i));
  console.log();
}

export async function listBlockAnnotationsForInquiryCommand(opts: {
  inquiryId: string;
  json?: boolean;
}): Promise<void> {
  let data: ListBlockAnnotationsResponse;
  try {
    data = await http.get<ListBlockAnnotationsResponse>(
      `/inquiries/${opts.inquiryId}/annotations`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(data);
    return;
  }

  const items = data.items ?? [];
  if (!items.length) {
    console.log("No annotations for this inquiry.");
    console.log();
    return;
  }
  items.forEach((a, i) => printAnnotationLine(a, i));
  console.log();
}

export async function addBlockAnnotationCommand(opts: {
  inquiryId: string;
  blockId: string;
  body: string;
  parentAnnotationId?: string;
  json?: boolean;
}): Promise<void> {
  const text = opts.body?.trim();
  if (!text) {
    console.error("\x1b[31mError: --body is required and must be non-empty.\x1b[0m");
    process.exit(1);
  }

  const payload: CreateBlockAnnotationBody = { body: text };
  if (opts.parentAnnotationId?.trim()) {
    payload.parent_annotation_id = opts.parentAnnotationId.trim();
  }

  let ann: BlockAnnotation;
  try {
    ann = await http.post<BlockAnnotation>(
      `/inquiries/${opts.inquiryId}/blocks/${opts.blockId}/annotations`,
      payload,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(ann);
    return;
  }

  console.log("\x1b[32mAnnotation created.\x1b[0m");
  console.log(`id:         ${ann.id}`);
  console.log(`block_id:   ${ann.block_id}`);
  const preview =
    ann.body.length > 160 ? `${ann.body.slice(0, 160)}…` : ann.body;
  console.log(`body:       ${preview}`);
  console.log();
}

export async function deleteBlockAnnotationCommand(opts: {
  inquiryId: string;
  blockId: string;
  annotationId: string;
  json?: boolean;
}): Promise<void> {
  let result: { id: string; deleted: boolean };
  try {
    result = await http.delete<{ id: string; deleted: boolean }>(
      `/inquiries/${opts.inquiryId}/blocks/${opts.blockId}/annotations/${opts.annotationId}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  console.log("\x1b[32mAnnotation deleted.\x1b[0m");
  console.log(`id: ${result.id}`);
  console.log();
}

export async function setBlockAnnotationHiddenCommand(opts: {
  inquiryId: string;
  blockId: string;
  annotationId: string;
  hidden: boolean;
  json?: boolean;
}): Promise<void> {
  let ann: BlockAnnotation;
  try {
    ann = await http.patch<BlockAnnotation>(
      `/inquiries/${opts.inquiryId}/blocks/${opts.blockId}/annotations/${opts.annotationId}/hidden`,
      { hidden: opts.hidden },
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(ann);
    return;
  }

  console.log("\x1b[32mAnnotation updated.\x1b[0m");
  console.log(`id:     ${ann.id}`);
  console.log(`hidden: ${ann.hidden}`);
  console.log();
}

function printAnnotationLine(a: BlockAnnotation, index: number): void {
  const who = a.user?.display_name || a.user?.username || a.user_id;
  const blockHint = a.block?.kind
    ? `[${a.block.kind}]`
    : "";
  const parent = a.parent_annotation_id ? ` ↳ parent ${a.parent_annotation_id}` : "";
  const hidden = a.hidden ? " (hidden)" : "";
  const agent =
    a.actor_label != null && a.actor_label !== ""
      ? ` [${a.actor_kind ?? "agent"}:${a.actor_label}]`
      : "";
  const body = a.body ?? "";
  const preview = body.length > 100 ? `${body.slice(0, 100)}…` : body;
  console.log(
    `${index + 1}. ${a.id}  ${who}${agent}  block ${a.block_id} ${blockHint}${parent}${hidden}`,
  );
  console.log(`   ${preview}`);
}

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { PreviewHighlightActivateResponse } from "./types.js";

export interface PreviewHighlightActivateOptions {
  inquiryId: string;
  evidenceBlockIds?: string[];
  json?: boolean;
}

export async function previewHighlightActivateCommand(
  opts: PreviewHighlightActivateOptions,
): Promise<void> {
  const body =
    opts.evidenceBlockIds && opts.evidenceBlockIds.length > 0
      ? { evidence_block_ids: opts.evidenceBlockIds }
      : {};

  let res: PreviewHighlightActivateResponse;
  try {
    res = await http.post<PreviewHighlightActivateResponse>(
      `/inquiries/${opts.inquiryId}/preview-highlight-activate`,
      body,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(res);
    return;
  }

  console.log(
    `Inquiry ${res.inquiry.id} status=${res.inquiry.status} orbit_graph_id=${res.inquiry.orbit_graph_id ?? "—"}`,
  );
  console.log(
    `Highlight v${res.highlight.version}: ${res.highlight.title}`,
  );
}

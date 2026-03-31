import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { InquiryHighlight } from "./types.js";

export interface GetHighlightOptions {
  inquiryId: string;
  json?: boolean;
}

export async function getHighlightCommand(opts: GetHighlightOptions): Promise<void> {
  let highlight: InquiryHighlight;
  try {
    highlight = await http.get<InquiryHighlight>(
      `/inquiries/${opts.inquiryId}/highlight`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(highlight);
    return;
  }

  console.log(`id:                 ${highlight.id}`);
  console.log(`inquiry_id:         ${highlight.inquiry_id}`);
  console.log(`version:            ${highlight.version}`);
  console.log(`title:              ${highlight.title}`);
  console.log(`abstract:\n${highlight.abstract}\n`);
  if (highlight.key_findings.length) {
    console.log("key_findings:");
    for (const line of highlight.key_findings) {
      console.log(`  - ${line}`);
    }
    console.log();
  }
  if (highlight.open_questions.length) {
    console.log("open_questions:");
    for (const line of highlight.open_questions) {
      console.log(`  - ${line}`);
    }
    console.log();
  }
  if (highlight.next_steps.length) {
    console.log("next_steps:");
    for (const line of highlight.next_steps) {
      console.log(`  - ${line}`);
    }
    console.log();
  }
  if (highlight.evidence_block_ids.length) {
    console.log(
      `evidence_block_ids: ${highlight.evidence_block_ids.join(", ")}`,
    );
    console.log();
  }
  if (highlight.body_md.trim()) {
    console.log("--- body_md ---");
    console.log(highlight.body_md);
    console.log("--- end body_md ---");
  } else {
    console.log("(body_md empty)");
  }
  if (highlight.updated_at) {
    console.log();
    console.log(`updated_at:         ${highlight.updated_at}`);
  }
}

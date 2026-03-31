import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { InquiryStats } from "./types.js";

export async function getInquiryStatsCommand(opts: {
  inquiryId: string;
  json?: boolean;
}): Promise<void> {
  let stats: InquiryStats;
  try {
    stats = await http.get<InquiryStats>(`/social/inquiries/${opts.inquiryId}/stats`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(stats);
    return;
  }

  console.log(`inquiry_id:              ${stats.inquiry_id}`);
  console.log(`fork_count:              ${stats.fork_count}`);
  console.log(`watch_count:             ${stats.watch_count}`);
  console.log(`related_count:           ${stats.related_count}`);
  console.log(`visit_count:             ${stats.visit_count}`);
  console.log(`unique_researcher_count: ${stats.unique_researcher_count}`);
  if (!stats.tags?.length) {
    console.log("tags:                    (none)");
    console.log();
    return;
  }
  console.log("tags:");
  for (const tag of stats.tags) {
    console.log(`- ${tag.slug} (${tag.label}) count=${tag.count}`);
  }
  console.log();
}

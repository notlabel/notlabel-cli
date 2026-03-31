import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Inquiry } from "./types.js";

export interface GetInquiryOptions {
  id: string;
  json?: boolean;
}

export async function getInquiryCommand(opts: GetInquiryOptions): Promise<void> {
  let inquiry: Inquiry;
  try {
    inquiry = await http.get<Inquiry>(`/inquiries/${opts.id}`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(inquiry);
    return;
  }

  console.log(`id:                ${inquiry.id}`);
  if (inquiry.status) console.log(`status:            ${inquiry.status}`);
  if (inquiry.type) console.log(`type:              ${inquiry.type}`);
  if (inquiry.preferred_language)
    console.log(`preferred_language: ${inquiry.preferred_language}`);
  if (inquiry.raw_input != null) console.log(`raw_input:         ${inquiry.raw_input}`);
  if (inquiry.refined_statement) {
    console.log(`refined_statement: ${inquiry.refined_statement}`);
  }
  if (inquiry.confidence != null) console.log(`confidence:        ${inquiry.confidence}`);
  if (inquiry.privacy) console.log(`privacy:           ${inquiry.privacy}`);
  if (inquiry.seed_topics?.length) {
    console.log(`seed_topics:       ${inquiry.seed_topics.join(", ")}`);
  }
  if (inquiry.orbit_graph_id) {
    console.log(`orbit_graph_id:    ${inquiry.orbit_graph_id}`);
  }
  if (inquiry.created_at) console.log(`created_at:        ${inquiry.created_at}`);
  console.log();
}

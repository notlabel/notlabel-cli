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
  if (inquiry.seed_topic_ids?.length) {
    console.log(`seed_topic_ids:    ${inquiry.seed_topic_ids.join(", ")}`);
  }
  if (inquiry.root_topic_id) {
    console.log(`root_topic_id:     ${inquiry.root_topic_id}`);
  }
  if (inquiry.topics?.length) {
    const line = inquiry.topics
      .map((t) => (t.slug ? `${t.label} [${t.slug}]` : t.label))
      .join("; ");
    console.log(`topics:            ${line}`);
  }
  if (inquiry.my_role) {
    console.log(`my_role:           ${inquiry.my_role}`);
  }
  if (inquiry.collaborators?.length) {
    console.log(
      `collaborators:     ${inquiry.collaborators.length} (use --json for roles)`,
    );
  }
  if (inquiry.orbit_graph_id) {
    console.log(`orbit_graph_id:    ${inquiry.orbit_graph_id}`);
  }
  if (inquiry.created_at) console.log(`created_at:        ${inquiry.created_at}`);
  console.log();
}

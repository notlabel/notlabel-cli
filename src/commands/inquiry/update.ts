import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Inquiry, UpdateInquiryBody } from "./types.js";

export interface UpdateInquiryOptions {
  id: string;
  refinedStatement?: string;
  confidence?: number;
  seedTopics?: string[];
  type?: "hypothesis" | "exploration" | "question";
  json?: boolean;
}

export async function updateInquiryCommand(opts: UpdateInquiryOptions): Promise<void> {
  const body: UpdateInquiryBody = {};
  if (opts.refinedStatement !== undefined) body.refined_statement = opts.refinedStatement;
  if (opts.confidence !== undefined) body.confidence = opts.confidence;
  if (opts.seedTopics !== undefined) body.seed_topics = opts.seedTopics;
  if (opts.type !== undefined) body.type = opts.type;

  if (Object.keys(body).length === 0) {
    console.error("\x1b[31mError: provide at least one of --refined-statement, --confidence, --seed-topics, --type.\x1b[0m");
    process.exit(1);
  }

  let inquiry: Inquiry;
  try {
    inquiry = await http.patch<Inquiry>(`/inquiries/${opts.id}`, body);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(inquiry);
    return;
  }

  console.log("\x1b[32mInquiry updated.\x1b[0m");
  console.log(`id:     ${inquiry.id}`);
  console.log(`status: ${inquiry.status}`);
  if (inquiry.refined_statement) console.log(`refined_statement: ${inquiry.refined_statement}`);
  if (inquiry.seed_topics?.length) console.log(`seed_topics: ${inquiry.seed_topics.join(", ")}`);
  console.log();
}

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Inquiry, InquiryPrivacy, UpdateInquiryBody } from "./types.js";

export interface UpdateInquiryOptions {
  id: string;
  refinedStatement?: string;
  confidence?: number;
  seedTopics?: string[];
  type?: "hypothesis" | "exploration" | "question";
  privacy?: InquiryPrivacy;
  preferredLanguage?: string;
  json?: boolean;
}

export async function updateInquiryCommand(opts: UpdateInquiryOptions): Promise<void> {
  let beforeStatus: Inquiry["status"] | undefined;
  try {
    const before = await http.get<Inquiry>(`/inquiries/${opts.id}`);
    beforeStatus = before.status;
  } catch {
    // Non-fatal preflight.
  }

  const body: UpdateInquiryBody = {};
  if (opts.refinedStatement !== undefined) body.refined_statement = opts.refinedStatement;
  if (opts.confidence !== undefined) body.confidence = opts.confidence;
  if (opts.seedTopics !== undefined) body.seed_topics = opts.seedTopics;
  if (opts.type !== undefined) body.type = opts.type;
  if (opts.privacy !== undefined) body.privacy = opts.privacy;
  if (opts.preferredLanguage !== undefined) {
    const lang = opts.preferredLanguage.trim();
    if (!lang) {
      console.error(
        "\x1b[31mError: --preferred-language must be non-empty when set.\x1b[0m",
      );
      process.exit(1);
    }
    body.preferred_language = lang;
  }

  if (Object.keys(body).length === 0) {
    console.error(
      "\x1b[31mError: provide at least one of --refined-statement, --confidence, --seed-topics, --type, --privacy, --preferred-language.\x1b[0m",
    );
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
  if (
    beforeStatus !== undefined &&
    inquiry.status !== undefined &&
    inquiry.status !== beforeStatus
  ) {
    console.log(`transition: ${beforeStatus} -> ${inquiry.status}`);
  }
  if (inquiry.refined_statement) console.log(`refined_statement: ${inquiry.refined_statement}`);
  if (inquiry.seed_topics?.length) console.log(`seed_topics: ${inquiry.seed_topics.join(", ")}`);
  if (inquiry.privacy) console.log(`privacy: ${inquiry.privacy}`);
  if (inquiry.preferred_language)
    console.log(`preferred_language: ${inquiry.preferred_language}`);
  console.log();
}

import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Inquiry, CreateInquiryBody, InquiryStatus } from "./types.js";

export interface CreateInquiryOptions {
  rawInput: string;
  type?: "hypothesis" | "exploration" | "question";
  status?: InquiryStatus;
  /** BCP-47 code; defaults to `en` when omitted (matches backend default). */
  preferredLanguage?: string;
  json?: boolean;
}

export async function createInquiryCommand(opts: CreateInquiryOptions): Promise<void> {
  const raw = opts.rawInput?.trim();
  if (!raw) {
    console.error("\x1b[31mError: raw_input is required and must be non-empty.\x1b[0m");
    process.exit(1);
  }

  const lang = (opts.preferredLanguage ?? "en").trim();
  if (!lang) {
    console.error(
      "\x1b[31mError: preferred_language must be non-empty (default is en).\x1b[0m",
    );
    process.exit(1);
  }

  const body: CreateInquiryBody = {
    raw_input: raw,
    type: opts.type ?? "exploration",
    preferred_language: lang,
    ...(opts.status !== undefined ? { status: opts.status } : {}),
  };

  let inquiry: Inquiry;
  try {
    inquiry = await http.post<Inquiry>("/inquiries", body);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(inquiry);
    return;
  }

  console.log("\x1b[32mInquiry created.\x1b[0m");
  console.log(`id:     ${inquiry.id}`);
  console.log(`status: ${inquiry.status}`);
  console.log(`type:   ${inquiry.type}`);
  if (inquiry.preferred_language)
    console.log(`lang:   ${inquiry.preferred_language}`);
  console.log();
}

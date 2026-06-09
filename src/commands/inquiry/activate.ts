import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { ActivateInquiryResponse, Inquiry } from "./types.js";

export interface ActivateInquiryOptions {
  id: string;
  json?: boolean;
}

export async function activateInquiryCommand(opts: ActivateInquiryOptions): Promise<void> {
  let before: Inquiry | null = null;
  try {
    before = await http.get<Inquiry>(`/inquiries/${opts.id}`);
  } catch {
    // Non-fatal preflight; activation request will still provide canonical error.
  }

  if (before?.status === "active") {
    if (opts.json) {
      printJson(before);
      return;
    }
    console.log(
      "\x1b[33mInquiry is already active. Skipping activate request.\x1b[0m",
    );
    console.log(`id:             ${before.id}`);
    console.log(`status:         ${before.status}`);
    if (before.activated_at) {
      console.log(`activated_at:   ${before.activated_at}`);
    }
    console.log();
    return;
  }

  let result: ActivateInquiryResponse;
  try {
    result = await http.post<ActivateInquiryResponse>(`/inquiries/${opts.id}/activate`);
  } catch (err) {
    handleApiError(err);
  }

  const r = result!;

  if (opts.json) {
    printJson(r);
    return;
  }

  const was = before?.status ?? "unknown";
  console.log("\x1b[32mInquiry activated.\x1b[0m");
  console.log(`transition:     ${was} -> ${r.status}`);
  console.log(`id:             ${r.id}`);
  console.log(`status:         ${r.status}`);
  if (r.activated_at) {
    console.log(`activated_at:   ${r.activated_at}`);
  }
  console.log();
}

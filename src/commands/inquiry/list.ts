import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { Inquiry } from "./types.js";

export interface ListInquiryOptions {
  status?: "drafting" | "active" | "archived";
  json?: boolean;
}

export async function listInquiryCommand(opts: ListInquiryOptions): Promise<void> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  const qs = params.toString();
  const path = qs ? `/inquiries?${qs}` : "/inquiries";

  let inquiries: Inquiry[];
  try {
    const data = await http.get<Inquiry[] | { items: Inquiry[] }>(path);
    inquiries = Array.isArray(data) ? data : (data as { items: Inquiry[] }).items ?? [];
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(inquiries);
    return;
  }

  if (inquiries.length === 0) {
    console.log("No inquiries found.");
    console.log();
    return;
  }

  for (const i of inquiries) {
    const raw = i.raw_input ?? "";
    console.log(`${i.id}  ${i.status ?? "-"}  ${i.type ?? "-"}  ${raw.slice(0, 50)}${raw.length > 50 ? "…" : ""}`);
  }
  console.log();
}

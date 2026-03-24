import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type { ActivateInquiryResponse } from "./types.js";

export interface ActivateInquiryOptions {
  id: string;
  json?: boolean;
}

export async function activateInquiryCommand(opts: ActivateInquiryOptions): Promise<void> {
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

  console.log("\x1b[32mInquiry activated. Orbit graph generation started.\x1b[0m");
  console.log(`id:             ${r.id}`);
  console.log(`status:         ${r.status}`);
  if (r.activated_at) {
    console.log(`activated_at:   ${r.activated_at}`);
  }
  if (r.orbit_graph_id) {
    console.log(`orbit_graph_id: ${r.orbit_graph_id}`);
  }
  console.log("\nPoll GET /inquiries/:id/orbit-graph or GET /inquiries/:id until the graph is ready.");
  console.log();
}

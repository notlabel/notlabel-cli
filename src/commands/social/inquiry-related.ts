import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";

export async function listRelatedInquiriesCommand(opts: {
  inquiryId: string;
  limit?: number;
  json?: boolean;
}): Promise<void> {
  const qs =
    opts.limit !== undefined ? `?limit=${encodeURIComponent(String(opts.limit))}` : "";

  let data: { inquiry_id: string; related_inquiry_ids: string[] };
  try {
    data = await http.get<{ inquiry_id: string; related_inquiry_ids: string[] }>(
      `/social/inquiries/${opts.inquiryId}/related${qs}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(data);
    return;
  }

  console.log(`inquiry_id: ${data.inquiry_id}`);
  if (!data.related_inquiry_ids?.length) {
    console.log("related:    (none)");
    console.log();
    return;
  }
  console.log("related:");
  for (const id of data.related_inquiry_ids) {
    console.log(`- ${id}`);
  }
  console.log();
}

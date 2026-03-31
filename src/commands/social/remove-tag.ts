import { http } from "../../core/http.js";
import { handleApiError } from "../inquiry/common.js";

export async function removeInquiryTagCommand(opts: {
  inquiryId: string;
  slug: string;
  json?: boolean;
}): Promise<void> {
  const slug = opts.slug.trim();
  if (!slug) {
    console.error("\x1b[31mError: slug is required.\x1b[0m");
    process.exit(1);
  }

  try {
    await http.delete<void>(`/social/inquiries/${opts.inquiryId}/tags/${encodeURIComponent(slug)}`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    console.log(JSON.stringify({ inquiry_id: opts.inquiryId, removed_slug: slug }));
    return;
  }

  console.log("\x1b[32mTag removed.\x1b[0m");
  console.log(`inquiry_id: ${opts.inquiryId}`);
  console.log(`slug:       ${slug}`);
  console.log();
}

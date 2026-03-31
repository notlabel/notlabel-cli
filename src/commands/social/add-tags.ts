import { http } from "../../core/http.js";
import { handleApiError } from "../inquiry/common.js";

export interface AddInquiryTagsOptions {
  inquiryId: string;
  tags: string[];
  json?: boolean;
}

export async function addInquiryTagsCommand(
  opts: AddInquiryTagsOptions,
): Promise<void> {
  const tags = opts.tags.map((t) => t.trim()).filter(Boolean);
  if (tags.length === 0) {
    console.error("\x1b[31mError: provide at least one tag.\x1b[0m");
    process.exit(1);
  }

  try {
    await http.post<void>(`/social/inquiries/${opts.inquiryId}/tags`, { tags });
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    console.log(
      JSON.stringify({ inquiry_id: opts.inquiryId, added: tags.length, tags }),
    );
    return;
  }

  console.log("\x1b[32mTags added.\x1b[0m");
  console.log(`inquiry_id: ${opts.inquiryId}`);
  console.log(`tags:       ${tags.join(", ")}`);
  console.log();
}

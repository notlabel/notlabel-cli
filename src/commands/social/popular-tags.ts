import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { Tag } from "./types.js";

export async function listPopularTagsCommand(opts: {
  limit?: number;
  json?: boolean;
}): Promise<void> {
  const qs =
    opts.limit !== undefined ? `?limit=${encodeURIComponent(String(opts.limit))}` : "";
  let tags: Tag[];
  try {
    tags = await http.get<Tag[]>(`/social/tags/popular${qs}`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(tags);
    return;
  }

  if (!tags.length) {
    console.log("No popular tags.");
    console.log();
    return;
  }
  tags.forEach((tag, i) => {
    console.log(`${i + 1}. ${tag.slug} (${tag.label}) count=${tag.count}`);
  });
  console.log();
}

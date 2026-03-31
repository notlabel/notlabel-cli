import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { Tag } from "./types.js";

export async function searchTagsCommand(opts: {
  q: string;
  limit?: number;
  json?: boolean;
}): Promise<void> {
  const q = opts.q.trim();
  if (!q) {
    console.error("\x1b[31mError: --q is required and must be non-empty.\x1b[0m");
    process.exit(1);
  }

  const params = new URLSearchParams();
  params.set("q", q);
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));

  let tags: Tag[];
  try {
    tags = await http.get<Tag[]>(`/social/tags/search?${params.toString()}`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(tags);
    return;
  }

  if (!tags.length) {
    console.log("No tags match your query.");
    console.log();
    return;
  }
  tags.forEach((tag, i) => {
    console.log(`${i + 1}. ${tag.slug} (${tag.label}) count=${tag.count}`);
  });
  console.log();
}

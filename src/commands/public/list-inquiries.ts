import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type {
  PublicInquirySort,
  PublicListInquiriesResponse,
} from "./types.js";
import type { InquiryStatus, InquiryType } from "../inquiry/types.js";

export interface PublicListInquiriesOptions {
  status?: InquiryStatus;
  allStatuses?: boolean;
  type?: InquiryType;
  q?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sort?: PublicInquirySort;
  json?: boolean;
}

export async function publicListInquiriesCommand(
  opts: PublicListInquiriesOptions,
): Promise<void> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.allStatuses) params.set("all_statuses", "true");
  if (opts.type) params.set("type", opts.type);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.userId?.trim()) params.set("user_id", opts.userId.trim());
  if (opts.page !== undefined) params.set("page", String(opts.page));
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.sort) params.set("sort", opts.sort);

  const qs = params.toString();
  const path = `/public/investigations/inquiries${qs ? `?${qs}` : ""}`;

  let data: PublicListInquiriesResponse;
  try {
    data = await http.get<PublicListInquiriesResponse>(path);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(data);
    return;
  }

  const items = data.items ?? [];
  if (!items.length) {
    console.log("No public inquiries match.");
    if (data.pagination) {
      const p = data.pagination;
      console.log(`page=${p.page} limit=${p.limit} total=${p.total}`);
    }
    console.log();
    return;
  }

  for (const i of items) {
    const title = (i.refined_statement ?? i.raw_input ?? "").trim();
    const short =
      title.length > 72 ? `${title.slice(0, 72)}…` : title || "—";
    const who = i.owner?.username ? `@${i.owner.username}` : "—";
    const bc = i.stats?.block_count ?? 0;
    const ac = i.stats?.annotation_count ?? 0;
    console.log(
      `${i.id}  ${i.status ?? "-"}  ${i.type ?? "-"}  ${who}  blocks:${bc} comments:${ac}`,
    );
    console.log(`   ${short}`);
  }
  if (data.pagination) {
    const p = data.pagination;
    console.log();
    console.log(
      `pagination: page=${p.page} limit=${p.limit} total=${p.total} has_next=${p.has_next}`,
    );
  }
  console.log();
}

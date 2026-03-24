import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { Notification } from "./types.js";

export interface ListNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  json?: boolean;
}

export async function listNotificationsCommand(
  opts: ListNotificationsOptions,
): Promise<void> {
  const params = new URLSearchParams();
  if (opts.unreadOnly !== undefined) params.set("unread_only", String(opts.unreadOnly));
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.offset !== undefined) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const path = qs ? `/notifications?${qs}` : "/notifications";

  let notifications: Notification[];
  try {
    const data = await http.get<Notification[] | { items: Notification[] }>(path);
    notifications = Array.isArray(data)
      ? data
      : (data as { items?: Notification[] }).items ?? [];
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(notifications);
    return;
  }

  if (!notifications.length) {
    console.log("No notifications found.");
    console.log();
    return;
  }

  for (const n of notifications) {
    const unread = n.is_read ? "" : " [NEW]";
    const source = n.source ? ` source=${n.source}` : "";
    console.log(`${n.id}${unread}  ${n.channel}  ${n.title}${source}`);
    console.log(`  ${n.message.slice(0, 140)}${n.message.length > 140 ? "…" : ""}`);
  }
  console.log();
}

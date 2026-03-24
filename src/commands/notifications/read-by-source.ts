import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { Notification } from "./types.js";

export interface MarkNotificationReadBySourceOptions {
  source: string;
  json?: boolean;
}

export async function markNotificationReadBySourceCommand(
  opts: MarkNotificationReadBySourceOptions,
): Promise<void> {
  const source = opts.source.trim();
  if (!source) {
    console.error("\x1b[31mError: source is required and must be non-empty.\x1b[0m");
    process.exit(1);
  }

  let notification: Notification;
  try {
    notification = await http.post<Notification>("/notifications/read-by-source", {
      source,
    });
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(notification);
    return;
  }

  console.log("\x1b[32mNotification source marked as read.\x1b[0m");
  console.log(`id:      ${notification.id}`);
  console.log(`source:  ${notification.source ?? "-"}`);
  console.log(`read_at: ${notification.read_at ?? "-"}`);
  console.log();
}

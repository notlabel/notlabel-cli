import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { Notification } from "./types.js";

export interface MarkNotificationReadOptions {
  id: string;
  json?: boolean;
}

export async function markNotificationReadCommand(
  opts: MarkNotificationReadOptions,
): Promise<void> {
  let notification: Notification;
  try {
    notification = await http.patch<Notification>(`/notifications/${opts.id}/read`);
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(notification);
    return;
  }

  console.log("\x1b[32mNotification marked as read.\x1b[0m");
  console.log(`id:      ${notification.id}`);
  console.log(`title:   ${notification.title}`);
  console.log(`read_at: ${notification.read_at ?? "-"}`);
  console.log();
}

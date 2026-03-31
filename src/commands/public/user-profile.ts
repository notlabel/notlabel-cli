import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";
import type { PublicUserProfileResponse } from "./types.js";

export async function publicUserProfileCommand(opts: {
  username: string;
  json?: boolean;
}): Promise<void> {
  const u = opts.username.trim().replace(/^@/, "");
  if (!u) {
    console.error("\x1b[31mError: username is required.\x1b[0m");
    process.exit(1);
  }

  let profile: PublicUserProfileResponse;
  try {
    profile = await http.get<PublicUserProfileResponse>(
      `/public/investigations/users/profile/${encodeURIComponent(u)}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(profile);
    return;
  }

  console.log(`${profile.display_name}  @${profile.username}`);
  console.log(`id:     ${profile.id}`);
  if (profile.stats) {
    console.log(
      `stats:  public inquiries ${profile.stats.public_inquiries_count}, followers ${profile.stats.follower_count}, following ${profile.stats.following_count}`,
    );
  }
  console.log();
}

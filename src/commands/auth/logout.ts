import { deleteCredentials } from "../../core/credentials.js";

export function logoutCommand(): void {
  const deleted = deleteCredentials();

  if (deleted) {
    console.log("\x1b[32mLogged out. Session credentials removed.\x1b[0m");
  } else {
    console.log("No active session found.");
  }
}

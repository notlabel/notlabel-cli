import { spawn } from "child_process";

const FRONTEND_URL =
  process.env["NOTLABEL_FRONTEND_URL"] ?? "https://notlabel.org";

export function buildSignInUrl(port: number): string {
  return `${FRONTEND_URL}/cli/sign-in?port=${port}`;
}

export function openBrowser(url: string): void {
  const platform = process.platform;

  let cmd: string;
  let args: string[];

  if (platform === "darwin") {
    cmd = "open";
    args = [url];
  } else if (platform === "win32") {
    cmd = "cmd";
    args = ["/c", "start", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }

  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
}

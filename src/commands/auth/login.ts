import * as http from "http";
import { findAvailablePort } from "../../utils/port.js";
import { buildSignInUrl, openBrowser } from "../../utils/browser.js";
import { saveCredentials, type Credentials } from "../../core/credentials.js";
import { printLabAgentHints } from "./lab-hints.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface CallbackParams {
  access_token: string;
  refresh_token: string;
  method?: "google" | "email";
}

function parseCallbackParams(url: URL): CallbackParams | null {
  const access_token = url.searchParams.get("access_token");
  const refresh_token = url.searchParams.get("refresh_token");

  if (!access_token || !refresh_token) return null;

  const method = url.searchParams.get("method");

  return {
    access_token,
    refresh_token,
    method: method === "email" ? "email" : "google",
  };
}

function waitForCallback(port: number): Promise<CallbackParams> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url;
      if (!rawUrl) {
        res.writeHead(400);
        res.end("Bad request");
        return;
      }

      const url = new URL(rawUrl, `http://localhost:${port}`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const params = parseCallbackParams(url);

      if (!params) {
        res.writeHead(400);
        res.end("Missing tokens in callback");
        reject(new Error("Callback received without required tokens"));
        server.close();
        return;
      }

      // Send a friendly page and try to close the tab (browsers may block if not opened by script)
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html>
  <head><title>not label CLI</title></head>
  <body style="font-family:sans-serif;text-align:center;padding-top:60px">
    <h2>Login successful!</h2>
    <p id="msg">Closing...</p>
    <script>
      setTimeout(function() { window.close(); }, 600);
      setTimeout(function() {
        document.getElementById("msg").textContent = "You can close this tab and return to your terminal.";
      }, 2000);
    </script>
  </body>
</html>`);

      server.close(() => resolve(params));
    });

    server.on("error", reject);

    server.listen(port, "127.0.0.1", () => {
      // Server is ready
    });
  });
}

export async function loginCommand(): Promise<void> {
  let port: number;

  try {
    port = await findAvailablePort();
  } catch {
    console.error("\x1b[31mError: could not find an available port.\x1b[0m");
    process.exit(1);
  }

  const signInUrl = buildSignInUrl(port);
  console.log(`\nOpening browser to sign in...\n`);
  console.log(`  ${signInUrl}\n`);
  console.log("(If the browser didn't open, visit the URL above manually)\n");

  openBrowser(signInUrl);

  let params: CallbackParams;

  try {
    params = await waitForCallback(port);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31mLogin failed: ${message}\x1b[0m`);
    process.exit(1);
  }

  const credentials: Credentials = {
    method: params.method ?? "google",
    access_token: params.access_token,
    refresh_token: params.refresh_token,
    refresh_expires_at: new Date(Date.now() + SEVEN_DAYS_MS).toISOString(),
  };

  saveCredentials(credentials);

  console.log("\x1b[32mLogin successful! Credentials saved.\x1b[0m");

  // Optionally fetch and show the user's email
  try {
    const { http } = await import("../../core/http.js");
    const me = await http.get<{ email: string; name?: string }>("/auth/me");
    console.log(`\nLogged in as: \x1b[36m${me.email}\x1b[0m`);
    if (me.name) console.log(`Name: ${me.name}`);
  } catch {
    // Non-fatal: tokens saved, just can't show email right now
  }

  printLabAgentHints();
}

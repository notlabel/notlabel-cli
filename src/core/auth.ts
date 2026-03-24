import { loadCredentials, saveCredentials, type Credentials } from "./credentials.js";

const API_URL =
  process.env["NOTLABEL_API_URL"] ??
  "https://notlabel-services.notlabel.org/api/v1";

export class AuthExpiredError extends Error {
  constructor() {
    super("Session expired. Run: notlabel auth login");
    this.name = "AuthExpiredError";
  }
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  refresh_expires_at: string;
  method: "google" | "email";
}

function isExpired(isoDate: string): boolean {
  return new Date(isoDate).getTime() <= Date.now();
}

export async function getValidAccessToken(): Promise<string> {
  const creds = loadCredentials();

  if (!creds) {
    throw new AuthExpiredError();
  }

  // Try to decode expiry from JWT (exp claim) without verifying signature
  const accessExpired = isAccessTokenExpired(creds.access_token);

  if (!accessExpired) {
    return creds.access_token;
  }

  if (isExpired(creds.refresh_expires_at)) {
    throw new AuthExpiredError();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: creds.refresh_token }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Auth refresh timed out after 30s. Backend: ${API_URL}/auth/refresh`
      );
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new AuthExpiredError();
  }

  const data = (await response.json()) as RefreshResponse;

  const updated: Credentials = {
    method: data.method,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    refresh_expires_at: data.refresh_expires_at,
  };

  saveCredentials(updated);
  return updated.access_token;
}

function isAccessTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf-8")
    ) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    // Give a 30s buffer to avoid edge cases
    return payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
}

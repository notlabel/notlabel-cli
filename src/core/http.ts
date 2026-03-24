import { getValidAccessToken, AuthExpiredError } from "./auth.js";

export const API_URL =
  process.env["NOTLABEL_API_URL"] ??
  "https://notlabel-services.notlabel.org/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly url?: string
  ) {
    const msg = url
      ? `HTTP ${status}: ${body}\n  Backend: ${url}`
      : `HTTP ${status}: ${body}`;
    super(msg);
    this.name = "HttpError";
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getValidAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    const init: RequestInit = {
      method: options.method ?? "GET",
      headers,
      signal: controller.signal,
    };
    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }
    response = await fetch(`${API_URL}${path}`, init);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Backend: ${API_URL}${path}`
      );
    }
    throw err;
  }
  clearTimeout(timeoutId);

  const text = await response.text();

  if (!response.ok) {
    throw new HttpError(response.status, text, `${API_URL}${path}`);
  }

  return JSON.parse(text) as T;
}

export const http = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>(path, {
      method: "GET",
      ...(headers !== undefined ? { headers } : {}),
    }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { AuthExpiredError };

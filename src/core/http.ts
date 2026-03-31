import { randomUUID } from "node:crypto";
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

/** One id per CLI process so related writes in the same command run correlate. */
const CLI_RUN_CORRELATION_ID = randomUUID();

const HEADER_ACTOR_LABEL = "x-notlabel-actor-label";
const HEADER_REQUEST_ID = "x-request-id";

const DEFAULT_ACTOR_LABEL = "notlabel-cli";

function writeProvenanceHeaders(): Record<string, string> {
  const fromEnv = process.env["NOTLABEL_ACTOR_LABEL"]?.trim();
  const actorLabel = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ACTOR_LABEL;
  return {
    [HEADER_ACTOR_LABEL]: actorLabel,
    [HEADER_REQUEST_ID]: CLI_RUN_CORRELATION_ID,
  };
}

function isWriteMethod(method: HttpMethod): boolean {
  return (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE"
  );
}

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

  const method: HttpMethod = options.method ?? "GET";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(isWriteMethod(method) ? writeProvenanceHeaders() : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    const init: RequestInit = {
      method,
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

  // Some endpoints intentionally return 204 No Content.
  if (text.trim() === "") {
    return undefined as T;
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

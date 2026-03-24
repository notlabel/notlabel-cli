import { AuthExpiredError, HttpError } from "../../core/http.js";

export function handleApiError(err: unknown): never {
  if (err instanceof AuthExpiredError) {
    console.error(`\x1b[31m${err.message}\x1b[0m`);
  } else if (err instanceof HttpError) {
    console.error(`\x1b[31mRequest failed (${err.status}): ${err.body}\x1b[0m`);
  } else {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31mError: ${message}\x1b[0m`);
  }
  process.exit(1);
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data));
}

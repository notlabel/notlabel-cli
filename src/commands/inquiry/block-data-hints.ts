import type { BlockBaseType } from "./types.js";

/**
 * Warn when common conventions are likely violated (non-fatal; backend may still accept).
 */
export function warnBlockDataConventions(
  baseType: BlockBaseType,
  kind: string,
  data: Record<string, unknown> | undefined,
): void {
  const k = kind.trim().toLowerCase();
  if (baseType === "source" && (k === "reference" || k.endsWith("reference"))) {
    const url =
      data && typeof data["url"] === "string"
        ? (data["url"] as string).trim()
        : "";
    if (!url) {
      console.warn(
        "\x1b[33mWarning: for base_type source + kind reference, pass --data with at least a url, e.g.\x1b[0m",
      );
      console.warn(
        `  \x1b[33m--data '{"url":"https://doi.org/...","title":"Paper title","authors":["A","B"],"year":2024}'\x1b[0m`,
      );
    }
  }
}

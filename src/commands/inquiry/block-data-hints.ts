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
  if (baseType === "correction" && data && typeof data["target_block_id"] !== "string") {
    console.warn(
      "\x1b[33mWarning: for base_type correction, consider --data with target_block_id (Mongo id of the block being corrected).\x1b[0m",
    );
  }
  if (
    baseType === "agent_finding" &&
    data &&
    typeof data["confidence_score"] !== "number"
  ) {
    console.warn(
      "\x1b[33mWarning: for base_type agent_finding, consider --data with confidence_score (0–1) and model_id.\x1b[0m",
    );
  }
  if (
    baseType === "dataset" &&
    data &&
    typeof data["format"] !== "string" &&
    typeof data["columns"] === "undefined"
  ) {
    console.warn(
      "\x1b[33mWarning: for base_type dataset, consider --data with format and/or columns for reproducibility.\x1b[0m",
    );
  }
}

import type { BlockBaseType } from "./types.js";

/** Non-empty `data.url` string satisfies link-only source blocks without body text. */
export function sourceDataHasUrl(data: Record<string, unknown> | undefined): boolean {
  if (!data) return false;
  const u = data.url;
  return typeof u === "string" && u.trim().length > 0;
}

/**
 * Resolves `content` for POST block create. Source blocks may omit body when `data.url` is set.
 */
export function resolveCreateBlockContent(
  baseType: BlockBaseType,
  data: Record<string, unknown> | undefined,
  contentOpt: string | undefined,
): { content?: string } | { error: string } {
  const trimmed = (contentOpt ?? "").trim();
  if (trimmed) return { content: trimmed };
  if (baseType === "source" && sourceDataHasUrl(data)) {
    return {};
  }
  if (baseType === "source") {
    return {
      error:
        'Error: for --base-type source, provide --content or --data with a non-empty string field "url".',
    };
  }
  return { error: "Error: --content is required and must be non-empty." };
}

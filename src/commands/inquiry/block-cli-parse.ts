import { BLOCK_BASE_TYPES, type BlockBaseType } from "./types.js";

const ALLOWED_BASE_TYPES = new Set<string>(BLOCK_BASE_TYPES);

const BASE_TYPE_LIST = BLOCK_BASE_TYPES.join(", ");

export function parseBlockOptionsForWrite(opts: {
  data?: string;
  linkedBlocks?: string;
  privacy?: string;
  baseType?: string;
}): {
  dataObj: Record<string, unknown> | undefined;
  linkedBlockIds: string[] | undefined;
  privacy: "private" | "public" | undefined;
  baseType: BlockBaseType;
} {
  let dataObj: Record<string, unknown> | undefined;
  if (opts.data) {
    try {
      dataObj = JSON.parse(opts.data);
    } catch {
      console.error(
        "\x1b[31mError: --data must be valid JSON (e.g. '{\"url\":\"https://...\"}').\x1b[0m",
      );
      process.exit(1);
    }
  }

  const baseTypeRaw = opts.baseType as string | undefined;
  const bt = (baseTypeRaw ?? "note") as BlockBaseType;
  if (!ALLOWED_BASE_TYPES.has(bt)) {
    console.error(
      `\x1b[31mError: --base-type must be one of: ${BASE_TYPE_LIST}.\x1b[0m`,
    );
    process.exit(1);
  }

  let privacy: "private" | "public" | undefined;
  if (opts.privacy) {
    if (opts.privacy !== "private" && opts.privacy !== "public") {
      console.error(
        "\x1b[31mError: --privacy must be private or public.\x1b[0m",
      );
      process.exit(1);
    }
    privacy = opts.privacy;
  }

  const linkedBlockIds = opts.linkedBlocks
    ? opts.linkedBlocks
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : undefined;

  return { dataObj, linkedBlockIds, privacy, baseType: bt };
}

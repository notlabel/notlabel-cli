import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";
import type {
  InquiryHighlight,
  ListHighlightVersionsResponse,
} from "./types.js";

export interface ListHighlightVersionsOptions {
  inquiryId: string;
  json?: boolean;
}

export async function listHighlightVersionsCommand(
  opts: ListHighlightVersionsOptions,
): Promise<void> {
  let data: ListHighlightVersionsResponse;
  try {
    data = await http.get<ListHighlightVersionsResponse>(
      `/inquiries/${opts.inquiryId}/highlight/versions`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(data);
    return;
  }

  for (const row of data.items) {
    console.log(`v${row.version}\t${row.title}\t${row.created_at}`);
  }
}

export interface GetHighlightVersionOptions {
  inquiryId: string;
  version: number;
  json?: boolean;
}

export async function getHighlightVersionCommand(
  opts: GetHighlightVersionOptions,
): Promise<void> {
  let highlight: InquiryHighlight;
  try {
    highlight = await http.get<InquiryHighlight>(
      `/inquiries/${opts.inquiryId}/highlight/versions/${opts.version}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(highlight);
    return;
  }

  console.log(`version:            ${highlight.version}`);
  console.log(`title:              ${highlight.title}`);
  console.log(`abstract:\n${highlight.abstract}\n`);
  if (highlight.body_md.trim()) {
    console.log("--- body_md ---");
    console.log(highlight.body_md);
  }
}

export interface RevertHighlightOptions {
  inquiryId: string;
  version: number;
  json?: boolean;
}

export async function revertHighlightCommand(
  opts: RevertHighlightOptions,
): Promise<void> {
  let highlight: InquiryHighlight;
  try {
    highlight = await http.post<InquiryHighlight>(
      `/inquiries/${opts.inquiryId}/highlight/revert/${opts.version}`,
      {},
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(highlight);
    return;
  }

  console.log(
    `Reverted highlight to v${opts.version}; current version is ${highlight.version}`,
  );
}

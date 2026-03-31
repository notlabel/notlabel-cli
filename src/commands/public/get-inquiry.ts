import { http } from "../../core/http.js";
import { handleApiError, printJson } from "../inquiry/common.js";

export async function publicGetInquiryCommand(opts: {
  id: string;
  json?: boolean;
}): Promise<void> {
  let data: unknown;
  try {
    data = await http.get<unknown>(
      `/public/investigations/inquiries/${opts.id}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(data);
    return;
  }

  const row = data as Record<string, unknown>;
  console.log(`id:                 ${row["id"]}`);
  if (row["status"]) console.log(`status:             ${row["status"]}`);
  if (row["type"]) console.log(`type:               ${row["type"]}`);
  if (row["preferred_language"])
    console.log(`preferred_language: ${row["preferred_language"]}`);
  if (row["raw_input"] != null)
    console.log(`raw_input:          ${row["raw_input"]}`);
  if (row["refined_statement"])
    console.log(`refined_statement:  ${row["refined_statement"]}`);
  if (row["orbit_graph_id"])
    console.log(`orbit_graph_id:     ${row["orbit_graph_id"]}`);
  const hl = row["highlight"];
  if (hl && typeof hl === "object") {
    const h = hl as Record<string, unknown>;
    if (h["title"]) console.log(`highlight.title:    ${h["title"]}`);
  }
  console.log();
}

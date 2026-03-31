import { http } from "../../core/http.js";
import { handleApiError, printJson } from "./common.js";

export interface DeleteResearchBlockOptions {
  blockId: string;
  json?: boolean;
}

export async function deleteResearchBlockCommand(
  opts: DeleteResearchBlockOptions,
): Promise<void> {
  let result: { id: string; deleted: boolean };
  try {
    result = await http.delete<{ id: string; deleted: boolean }>(
      `/blocks/${opts.blockId}`,
    );
  } catch (err) {
    handleApiError(err);
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  console.log("\x1b[32mBlock deleted (soft delete on server).\x1b[0m");
  console.log(`block_id: ${result.id}`);
  console.log();
}

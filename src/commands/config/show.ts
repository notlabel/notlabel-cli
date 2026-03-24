import { API_URL } from "../../core/http.js";

export function showConfigCommand(opts: { json?: boolean }): void {
  const config = {
    NOTLABEL_API_URL: API_URL,
  };

  if (opts.json) {
    console.log(JSON.stringify(config));
    return;
  }

  console.log("Backend (API):");
  console.log(`  NOTLABEL_API_URL  ${config.NOTLABEL_API_URL}`);
  console.log();
}

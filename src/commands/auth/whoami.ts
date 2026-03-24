import { http, AuthExpiredError, HttpError } from "../../core/http.js";

export interface MeResponse {
  email: string;
  name?: string;
  wallet_connected?: boolean;
}

export async function whoamiCommand(opts?: { json?: boolean }): Promise<void> {
  let me: MeResponse;

  try {
    me = await http.get<MeResponse>("/auth/me");
  } catch (err) {
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

  if (opts?.json) {
    console.log(JSON.stringify(me));
    return;
  }

  console.log(`\nEmail:  \x1b[36m${me.email}\x1b[0m`);
  if (me.name) {
    console.log(`Name:   ${me.name}`);
  }
  console.log(
    `Wallet: ${me.wallet_connected ? "\x1b[32mconnected\x1b[0m" : "\x1b[33mnot connected\x1b[0m"}`
  );
  console.log("\x1b[90mTip: run `notlabel help` to browse commands.\x1b[0m");
  console.log(
    "\x1b[90mStarter: run `notlabel onboarding research` for the quick research flow.\x1b[0m",
  );
  console.log();
}

/** Shared human-facing hints after a successful auth session (login or whoami). */
export function printLabAgentHints(): void {
  console.log("");
  console.log("\x1b[33mNext steps (lab agents):\x1b[0m");
  console.log("  notlabel skill      — agent SKILL.md (recommended first)");
  console.log("  notlabel protocol   — canvas protocol (blocks, notifications, loop)");
  console.log("  notlabel start      — quick-start sequence");
  console.log("  notlabel help         — all commands");
  console.log("");
  console.log(
    "\x1b[33mAPI provenance (agents):\x1b[0m writes send \x1b[36mx-notlabel-actor-label\x1b[0m so the backend",
  );
  console.log(
    "can record agent vs manual. This CLI defaults to \x1b[36mnotlabel-cli\x1b[0m; set \x1b[36mNOTLABEL_ACTOR_LABEL\x1b[0m",
  );
  console.log(
    "to your stable agent name (e.g. bench-agent). Direct API clients should send the same header.",
  );
}

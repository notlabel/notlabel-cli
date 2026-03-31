/**
 * Embedded agent SKILL.md (same content as Cursor `.cursor/skills/notlabel-cli/SKILL.md`).
 * Source: `src/agent/skill.md` — bundled into the binary via text import.
 */
import agentSkillMarkdown from "../../agent/skill.md" with { type: "text" };

export function printAgentSkill(): void {
  console.log(agentSkillMarkdown);
}

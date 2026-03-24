export function onboardingResearchCommand(): void {
  const lines = [
    "notlabel — Research onboarding",
    "",
    "Quick start:",
    "1) Login",
    "   notlabel auth login",
    "",
    "2) Create your inquiry (draft)",
    "   notlabel inquiry create --raw-input \"<your research question>\" --type exploration --json",
    "",
    "3) Refine it (optional but recommended)",
    "   notlabel inquiry update <inquiry-id> --refined-statement \"...\" --seed-topics \"topic1,topic2\" --confidence 0.8 --json",
    "",
    "4) Add your first research block",
    "   notlabel inquiry research add-block <inquiry-id> --content \"First note\" --base-type note --kind note --json",
    "",
    "5) Read recent insights and updates",
    "   notlabel inquiry research list-blocks <inquiry-id> --kind insight --page 0 --limit 20 --json",
    "   notlabel notifications list --unread-only --json",
    "",
    "6) Activate when the inquiry is ready",
    "   notlabel inquiry activate <inquiry-id> --json",
    "",
    "Need details?",
    "- notlabel help",
    "- notlabel inquiry --help",
    "- notlabel inquiry research --help",
    "- notlabel commands agent research",
  ];

  console.log(lines.join("\n"));
}

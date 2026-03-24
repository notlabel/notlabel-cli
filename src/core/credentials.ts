import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parse, stringify } from "smol-toml";

export interface Credentials {
  method: "google" | "email";
  access_token: string;
  refresh_token: string;
  refresh_expires_at: string;
}

interface CredentialsFile {
  human: Credentials;
}

const NOTLABEL_DIR = path.join(os.homedir(), ".notlabel");
const CREDENTIALS_PATH = path.join(NOTLABEL_DIR, "credentials.toml");

function ensureDir(): void {
  if (!fs.existsSync(NOTLABEL_DIR)) {
    fs.mkdirSync(NOTLABEL_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadCredentials(): Credentials | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;

  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    const parsed = parse(raw) as unknown as CredentialsFile;
    return parsed.human ?? null;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  ensureDir();

  const data: CredentialsFile = { human: creds };
  const toml = stringify(data as unknown as Record<string, unknown>);
  fs.writeFileSync(CREDENTIALS_PATH, toml, { mode: 0o600 });
}

export function deleteCredentials(): boolean {
  if (!fs.existsSync(CREDENTIALS_PATH)) return false;
  fs.unlinkSync(CREDENTIALS_PATH);
  return true;
}

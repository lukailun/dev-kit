import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  FIGMA_BASE_URL_ENV_KEY,
  FIGMA_FILE_ID_ENV_KEY,
  FIGMA_PAGE_ID_ENV_KEY,
  FIGMA_TOKEN_ENV_KEY,
  GITLAB_BASE_URL_ENV_KEY,
  GITLAB_TOKEN_ENV_KEY,
  LINEAR_API_KEY_ENV_KEY,
  LINEAR_PROJECT_ID_ENV_KEY,
  OPENROUTER_BASE_URL_ENV_KEY,
  OPENROUTER_API_KEY_ENV_KEY,
  SENTRY_API_KEY_ENV_KEY,
  SENTRY_BASE_URL_ENV_KEY,
  SENTRY_ORGANIZATION_ENV_KEY,
  SENTRY_PROJECT_ENV_KEY,
  CLAUDE_BASE_URL_ENV_KEY,
  CLAUDE_API_KEY_ENV_KEY,
  CLAUDE_AUTH_TOKEN_ENV_KEY,
  DEEPSEEK_BASE_URL_ENV_KEY,
  DEEPSEEK_API_KEY_ENV_KEY,
  GEMINI_BASE_URL_ENV_KEY,
  GEMINI_API_KEY_ENV_KEY,
  GLM_BASE_URL_ENV_KEY,
  GLM_API_KEY_ENV_KEY,
  KIMI_BASE_URL_ENV_KEY,
  KIMI_API_KEY_ENV_KEY,
  LONGCAT_BASE_URL_ENV_KEY,
  LONGCAT_API_KEY_ENV_KEY,
  MIMO_BASE_URL_ENV_KEY,
  MIMO_API_KEY_ENV_KEY,
  MINIMAX_BASE_URL_ENV_KEY,
  MINIMAX_API_KEY_ENV_KEY,
  HY_BASE_URL_ENV_KEY,
  HY_API_KEY_ENV_KEY,
  QWEN_BASE_URL_ENV_KEY,
  QWEN_API_KEY_ENV_KEY,
} from "./constants";
import { isFileNotFoundError } from "@/utils/fs-errors.js";
import { restrictDirToCurrentUser } from "@/utils/windows-acl.js";

export const devKitEnvDir = path.join(os.homedir(), ".dev-kit");
export const devKitEnvPath = path.join(devKitEnvDir, ".env");

type EnvMap = Record<string, string>;

export type CredentialDiagnostic = {
  key: string;
  source:
    | "process.env"
    | "~/.dev-kit/.env"
    | "process.env over ~/.dev-kit/.env"
    | "unset";
  length: number | null;
  preview: string;
  warnings: string[];
};

/**
 * Every environment variable DevKit reads or persists, in the order they are
 * written to `~/.dev-kit/.env`. This is the single source of truth: the
 * credential diagnostics list and the agent's debug-dump key list are both
 * derived from it (see {@link CREDENTIAL_DIAGNOSTIC_ENV_KEYS} and
 * {@link DEBUG_ENV_KEYS}), so they cannot silently drift out of sync when a new
 * managed key is added.
 */
export const MANAGED_ENV_KEYS = [
  // Figma
  FIGMA_BASE_URL_ENV_KEY,
  FIGMA_FILE_ID_ENV_KEY,
  FIGMA_PAGE_ID_ENV_KEY,
  FIGMA_TOKEN_ENV_KEY,
  // GitLab
  GITLAB_BASE_URL_ENV_KEY,
  GITLAB_TOKEN_ENV_KEY,
  // Linear
  LINEAR_API_KEY_ENV_KEY,
  LINEAR_PROJECT_ID_ENV_KEY,
  // OpenRouter
  OPENROUTER_BASE_URL_ENV_KEY,
  OPENROUTER_API_KEY_ENV_KEY,
  // Sentry
  SENTRY_API_KEY_ENV_KEY,
  SENTRY_BASE_URL_ENV_KEY,
  SENTRY_ORGANIZATION_ENV_KEY,
  SENTRY_PROJECT_ENV_KEY,
  // AI 服务
  CLAUDE_BASE_URL_ENV_KEY,
  CLAUDE_API_KEY_ENV_KEY,
  CLAUDE_AUTH_TOKEN_ENV_KEY,
  DEEPSEEK_BASE_URL_ENV_KEY,
  DEEPSEEK_API_KEY_ENV_KEY,
  GEMINI_BASE_URL_ENV_KEY,
  GEMINI_API_KEY_ENV_KEY,
  GLM_BASE_URL_ENV_KEY,
  GLM_API_KEY_ENV_KEY,
  KIMI_BASE_URL_ENV_KEY,
  KIMI_API_KEY_ENV_KEY,
  LONGCAT_BASE_URL_ENV_KEY,
  LONGCAT_API_KEY_ENV_KEY,
  MIMO_BASE_URL_ENV_KEY,
  MIMO_API_KEY_ENV_KEY,
  MINIMAX_BASE_URL_ENV_KEY,
  MINIMAX_API_KEY_ENV_KEY,
  HY_BASE_URL_ENV_KEY,
  HY_API_KEY_ENV_KEY,
  QWEN_BASE_URL_ENV_KEY,
  QWEN_API_KEY_ENV_KEY,
] as const;

// LangChain project/tracing settings are managed but are not credentials, so
// they are excluded from the diagnostics panel.
const NON_CREDENTIAL_ENV_KEYS = new Set<string>([
  "LANGCHAIN_PROJECT",
  "LANGCHAIN_TRACING_V2",
]);

/**
 * Managed keys surfaced (in display order) in the credential diagnostics panel:
 * the provider/model settings and every credential, but not the LangChain
 * project/tracing settings. Derived from {@link MANAGED_ENV_KEYS} so a new
 * credential key automatically appears in diagnostics.
 */
export const CREDENTIAL_DIAGNOSTIC_ENV_KEYS: readonly string[] = [
  ...MANAGED_ENV_KEYS.filter(
    (key) => !NON_CREDENTIAL_ENV_KEYS.has(key),
  ),
];

/**
 * Keys dumped in the agent's environment debug line: every managed key plus the
 * LangChain endpoint override that OpenWiki reads but never persists. Derived
 * from {@link MANAGED_ENV_KEYS} so it cannot drift.
 */
export const DEBUG_ENV_KEYS: readonly string[] = [
  ...MANAGED_ENV_KEYS,
  "LANGCHAIN_ENDPOINT",
];

const managedEnvKeys: readonly string[] = MANAGED_ENV_KEYS;

const deprecatedEnvKeys = ["OPENAI_ORG_ID", "OPENAI_PROJECT"];

/**
 * The shell's values for managed credential keys, captured once before any load
 * or save wrote to `process.env`. A shell export keeps precedence over
 * `~/.openwiki/.env` at runtime, so this snapshot lets the wizard tell the user
 * when a value they save will be shadowed, and keeps {@link saveDevKitEnv}
 * from masking a shell var in-process. Held in memory only; never persisted or
 * logged.
 */
let shellEnvAtStartup: Record<string, string> | undefined;

/**
 * Snapshot the shell's values for managed credential keys. Idempotent: the
 * first call wins, so a later load or save cannot capture values OpenWiki
 * itself seeded into `process.env`.
 */
function captureShellEnv(): void {
  if (shellEnvAtStartup !== undefined) {
    return;
  }

  const snapshot: Record<string, string> = {};

  for (const key of CREDENTIAL_DIAGNOSTIC_ENV_KEYS) {
    const value = process.env[key];

    if (value !== undefined) {
      snapshot[key] = value;
    }
  }

  shellEnvAtStartup = snapshot;
}

/**
 * The shell value for a managed key as captured at startup, or `undefined` when
 * the shell did not set it. Reflects the pre-load snapshot, so it stays stable
 * even after {@link loadDevKitEnv} / {@link saveDevKitEnv} mutate
 * `process.env`.
 */
export function getShellEnvValue(key: string): string | undefined {
  return shellEnvAtStartup?.[key];
}

/**
 * The values saved in `~/.openwiki/.env` as of the first load, before shell
 * exports win in `process.env`. Lets the setup wizard pre-fill fields from the
 * saved config rather than `process.env` (which a shell var may shadow), so
 * editing config never captures a shell override. In memory only.
 */
let savedEnvAtStartup: Record<string, string> | undefined;

/**
 * The saved `~/.dev-kit/.env` value for a key as of startup, or `undefined`.
 * Distinct from {@link getShellEnvValue} (the shell snapshot) and from
 * `process.env` (shell-over-file at runtime).
 */
export function getSavedEnvValue(key: string): string | undefined {
  return savedEnvAtStartup?.[key];
}

export async function loadDevKitEnv(): Promise<EnvMap> {
  captureShellEnv();
  const env = await readDevKitEnv();
  if (savedEnvAtStartup === undefined) {
    savedEnvAtStartup = { ...env };
  }
  for (const [key, value] of Object.entries(env)) {
    if (deprecatedEnvKeys.includes(key)) {
      continue;
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return env;
}

export async function getCredentialDiagnostics(): Promise<
  CredentialDiagnostic[]
> {
  const fileEnv = await readDevKitEnv();

  return CREDENTIAL_DIAGNOSTIC_ENV_KEYS.map((key) =>
    createCredentialDiagnostic(key, fileEnv),
  );
}

export async function saveDevKitEnv(updates: EnvMap): Promise<void> {
  captureShellEnv();

  const currentEnv = await readDevKitEnv();
  const nextEnv = {
    ...currentEnv,
    ...updates,
  };

  for (const key of deprecatedEnvKeys) {
    delete nextEnv[key];
  }

  // An empty value means "not set" (e.g. skipping the optional LangSmith key),
  // so drop the key rather than persisting KEY="" which would later read back
  // as configured. Also self-heals any empty values left by earlier writes.
  for (const key of Object.keys(nextEnv)) {
    if (nextEnv[key] === "") {
      delete nextEnv[key];
    }
  }

  await mkdir(devKitEnvDir, {
    recursive: true,
    mode: 0o700,
  });
  await chmod(devKitEnvDir, 0o700);
  await restrictDirToCurrentUser(devKitEnvDir);

  await writeFile(devKitEnvPath, formatEnv(nextEnv), {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(devKitEnvPath, 0o600);

  for (const [key, value] of Object.entries(updates)) {
    // A shell export wins at runtime, so don't mask it in process.env; the
    // saved value is only the fallback for when that shell var is unset.
    if (shellEnvAtStartup?.[key] !== undefined) {
      continue;
    }

    // Mirror the file: an empty value means "not set", so clear it from
    // process.env rather than leaving KEY="" (which reads back as configured).
    if (value === "") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function createCredentialDiagnostic(
  key: CredentialDiagnostic["key"],
  fileEnv: EnvMap,
): CredentialDiagnostic {
  const processValue = process.env[key];
  const fileValue = fileEnv[key];
  const value = processValue ?? fileValue;
  const source = getCredentialSource(processValue, fileValue);

  if (value === undefined) {
    return {
      key,
      source,
      length: null,
      preview: "<unset>",
      warnings: [],
    };
  }

  return {
    key,
    source,
    length: value.length,
    preview: isNonSecretDiagnosticKey(key)
      ? JSON.stringify(value)
      : createCredentialPreview(value),
    warnings: getCredentialWarnings(value),
  };
}

function getCredentialSource(
  processValue: string | undefined,
  fileValue: string | undefined,
): CredentialDiagnostic["source"] {
  if (processValue !== undefined && fileValue !== undefined) {
    return "process.env over ~/.dev-kit/.env";
  }
  if (processValue !== undefined) {
    return "process.env";
  }
  if (fileValue !== undefined) {
    return "~/.dev-kit/.env";
  }
  return "unset";
}

function isNonSecretDiagnosticKey(key: string): boolean {
  // 非密钥的配置项（如 Base URL）不需要隐藏
  return key.endsWith("_BASE_URL") || key.endsWith("_PROJECT") || key.endsWith("_ORGANIZATION") || key.endsWith("_FILE_ID") || key.endsWith("_PAGE_ID");
}

function createCredentialPreview(value: string): string {
  if (value.length <= 10) {
    return JSON.stringify("*".repeat(value.length));
  }

  return JSON.stringify(`${value.slice(0, 6)}...${value.slice(-4)}`);
}

function getCredentialWarnings(value: string): string[] {
  const warnings: string[] = [];

  if (value !== value.trim()) {
    warnings.push("leading/trailing whitespace");
  }

  if (value.includes("\n") || value.includes("\r")) {
    warnings.push("contains newline");
  }

  if (value.includes('"') || value.includes("'")) {
    warnings.push("contains quote character");
  }

  if (/\[[^\]]+\]/u.test(value)) {
    warnings.push("contains bracketed suffix/text");
  }

  return warnings;
}

async function readDevKitEnv(): Promise<EnvMap> {
  try {
    return parseEnv(await readFile(devKitEnvPath, "utf8"));
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return {};
    }
    throw error;
  }
}

export function parseEnv(content: string): EnvMap {
  const env: EnvMap = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    // Handle "export KEY=value" syntax
    const exportPrefix = "export ";
    const lineToParse = line.startsWith(exportPrefix)
      ? line.slice(exportPrefix.length)
      : line;

    const equalsIndex = lineToParse.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = lineToParse.slice(0, equalsIndex).trim();
    const rawValue = lineToParse.slice(equalsIndex + 1).trim();

    if (!/^[A-Z_][A-Z0-9_]*$/u.test(key)) {
      continue;
    }

    env[key] = parseEnvValue(rawValue);
  }

  return env;
}

function parseEnvValue(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\n/gu, "\n")
      .replace(/\\r/gu, "\r")
      .replace(/\\"/gu, '"')
      .replace(/\\\\/gu, "\\");
  }

  return value;
}

export function formatEnv(env: EnvMap): string {
  const keys = [
    ...managedEnvKeys.filter((key) => env[key] !== undefined),
    ...Object.keys(env)
      .filter((key) => !managedEnvKeys.includes(key))
      .sort(),
  ];

  return `${keys.map((key) => `${key}=${formatEnvValue(env[key] ?? "")}`).join("\n")}\n`;
}

function formatEnvValue(value: string): string {
  return `"${value
    .replace(/\\/gu, "\\\\")
    .replace(/"/gu, '\\"')
    .replace(/\n/gu, "\\n")
    .replace(/\r/gu, "\\r")}"`;
}

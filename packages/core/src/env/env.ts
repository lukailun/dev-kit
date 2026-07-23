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
} from "@/utils/constants";
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
 * DevKit 读取或持久化的所有环境变量，按写入 `~/.dev-kit/.env` 的顺序排列。
 * 这是唯一的数据来源：凭证诊断列表和调试转储的键列表均由此派生
 * （参见 {@link CREDENTIAL_DIAGNOSTIC_ENV_KEYS} 和 {@link DEBUG_ENV_KEYS}），
 * 因此新增受管键时不会出现静默不同步的问题。
 */
export const MANAGED_ENV_KEYS = [
  // Figma 设计工具
  FIGMA_BASE_URL_ENV_KEY,
  FIGMA_FILE_ID_ENV_KEY,
  FIGMA_PAGE_ID_ENV_KEY,
  FIGMA_TOKEN_ENV_KEY,
  // GitLab 代码托管
  GITLAB_BASE_URL_ENV_KEY,
  GITLAB_TOKEN_ENV_KEY,
  // Linear 项目管理
  LINEAR_API_KEY_ENV_KEY,
  LINEAR_PROJECT_ID_ENV_KEY,
  // OpenRouter 模型路由
  OPENROUTER_BASE_URL_ENV_KEY,
  OPENROUTER_API_KEY_ENV_KEY,
  // Sentry 错误监控
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

// LangChain 项目/追踪设置属于受管项，但不属于凭证，因此从诊断面板中排除。
const NON_CREDENTIAL_ENV_KEYS = new Set<string>([
  "LANGCHAIN_PROJECT",
  "LANGCHAIN_TRACING_V2",
]);

/**
 * 凭证诊断面板中展示的受管键（按显示顺序）：包括提供商/模型设置及所有凭证，
 * 但不包括 LangChain 项目/追踪设置。由 {@link MANAGED_ENV_KEYS} 派生，
 * 新增凭证键会自动出现在诊断中。
 */
export const CREDENTIAL_DIAGNOSTIC_ENV_KEYS: readonly string[] = [
  ...MANAGED_ENV_KEYS.filter(
    (key) => !NON_CREDENTIAL_ENV_KEYS.has(key),
  ),
];

/**
 * 代理环境调试行中转储的键：包括所有受管键，以及 OpenWiki 读取但从不持久化的
 * LangChain 端点覆盖。由 {@link MANAGED_ENV_KEYS} 派生，不会出现不同步。
 */
export const DEBUG_ENV_KEYS: readonly string[] = [
  ...MANAGED_ENV_KEYS,
  "LANGCHAIN_ENDPOINT",
];

const managedEnvKeys: readonly string[] = MANAGED_ENV_KEYS;

/**
 * 启动时捕获的受管凭证键的 shell 值，在任何加载或保存写入 `process.env` 之前捕获一次。
 * shell export 在运行时优先于 `~/.openwiki/.env`，因此此快照让向导可以告知用户
 * 保存的值是否会被覆盖，并防止 {@link saveDevKitEnv} 在进程内遮蔽 shell 变量。
 * 仅保存在内存中，不会持久化或记录日志。
 */
let shellEnvAtStartup: Record<string, string> | undefined;

/**
 * 快照受管凭证键的 shell 值。幂等操作：首次调用生效，
 * 后续的加载或保存不会捕获 OpenWiki 自身注入 `process.env` 的值。
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
 * 启动时捕获的受管键的 shell 值，若 shell 未设置则返回 `undefined`。
 * 反映加载前的快照，即使在 {@link loadDevKitEnv} / {@link saveDevKitEnv}
 * 修改 `process.env` 后仍保持稳定。
 */
export function getShellEnvValue(key: string): string | undefined {
  return shellEnvAtStartup?.[key];
}

/**
 * 首次加载时 `~/.openwiki/.env` 中保存的值，在 shell export 在 `process.env` 中生效之前。
 * 使设置向导可以从保存的配置（而非可能被 shell 变量覆盖的 `process.env`）预填字段，
 * 编辑配置时不会捕获 shell 覆盖值。仅保存在内存中。
 */
let savedEnvAtStartup: Record<string, string> | undefined;

/**
 * 启动时 `~/.dev-kit/.env` 中指定键的已保存值，未设置则返回 `undefined`。
 * 区别于 {@link getShellEnvValue}（shell 快照）和 `process.env`（运行时 shell 优先于文件）。
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
  // 空值表示"未设置"（例如跳过可选的 LangSmith 键），
  // 因此删除键而不是持久化 KEY=""，否则后续读取会误认为已配置。
  // 同时自动修复之前写入留下的空值。
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

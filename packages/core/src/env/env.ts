import { existsSync } from "node:fs";
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
} from "../utils/constants.js";
import { isFileNotFoundError } from "../utils/fs-errors.js";
import { restrictDirToCurrentUser } from "../utils/windows-acl.js";

export const devKitEnvDir = path.join(os.homedir(), ".dev-kit");
export const devKitEnvPath = path.join(devKitEnvDir, ".env");

/**
 * 从当前工作目录向上查找最近的项目级 `.dev-kit/.env`（类似向上找 package.json），
 * 使脚本从 `.claude/` 等子目录启动时也能定位到项目根的配置。
 * 读取优先级高于 `~/.dev-kit/.env`，用于存放项目级覆盖配置。
 * 整条祖先链上都不存在时返回 `undefined`。
 */
export function getProjectEnvPath(): string | undefined {
  const home = os.homedir();
  const { root } = path.parse(process.cwd());
  let dir = process.cwd();

  for (;;) {
    // 用户级 `~/.dev-kit/.env` 不属于项目层：跳过 home 这一级，
    // 避免向上查找时把用户级文件误当成项目级文件读进来。
    if (dir !== home) {
      const candidate = path.join(dir, ".dev-kit", ".env");
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    if (dir === root) {
      return undefined;
    }
    dir = path.dirname(dir);
  }
}

const PROJECT_ENV_LABEL = ".dev-kit/.env";
const USER_ENV_LABEL = "~/.dev-kit/.env";

type EnvMap = Record<string, string>;

export type CredentialDiagnostic = {
  key: string;
  /**
   * 值的来源链，按读取优先级从高到低以 " over " 连接
   * （如 "process.env over .dev-kit/.env over ~/.dev-kit/.env"），均未设置时为 "unset"。
   */
  source: string;
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
 * 代理环境调试行中转储的键：包括所有受管键。由 {@link MANAGED_ENV_KEYS} 派生，不会出现不同步。
 */
export const DEBUG_ENV_KEYS: readonly string[] = [
  ...MANAGED_ENV_KEYS,
  "LANGCHAIN_ENDPOINT",
];

const managedEnvKeys: readonly string[] = MANAGED_ENV_KEYS;

/**
 * 启动时捕获的受管凭证键的 shell 值，在任何加载或保存写入 `process.env` 之前捕获一次。
 * shell export 在运行时优先于文件层（项目级/用户级），因此此快照让向导可以告知用户
 * 保存的值是否会被覆盖，并防止 {@link saveDevKitEnv} 在进程内遮蔽 shell 变量。
 * 仅保存在内存中，不会持久化或记录日志。
 */
let shellEnvAtStartup: Record<string, string> | undefined;

/**
 * 快照受管凭证键的 shell 值。幂等操作：首次调用生效，
 * 后续的加载或保存不会捕获 dev-kit 自身注入 `process.env` 的值。
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
 * 首次加载时文件层保存的值（项目级 `.dev-kit/.env` 覆盖用户级 `~/.dev-kit/.env`），
 * 在 shell export 在 `process.env` 中生效之前。
 * 使设置向导可以从保存的配置（而非可能被 shell 变量覆盖的 `process.env`）预填字段，
 * 编辑配置时不会捕获 shell 覆盖值。仅保存在内存中。
 */
let savedEnvAtStartup: Record<string, string> | undefined;

/**
 * 启动时文件层中指定键的已保存值（项目级覆盖用户级），未设置则返回 `undefined`。
 * 区别于 {@link getShellEnvValue}（shell 快照）和 `process.env`（运行时 shell 优先于文件）。
 */
export function getSavedEnvValue(key: string): string | undefined {
  return savedEnvAtStartup?.[key];
}

export async function loadDevKitEnv(): Promise<EnvMap> {
  captureShellEnv();
  const { project, user } = await readEnvLayers();
  // 读取优先级：shell（process.env 已有值）> 项目级 > 用户级
  const env = { ...user, ...project };
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
  captureShellEnv();
  const { project, user } = await readEnvLayers();

  return CREDENTIAL_DIAGNOSTIC_ENV_KEYS.map((key) =>
    createCredentialDiagnostic(key, project, user),
  );
}

/**
 * 合并写入用户级 `~/.dev-kit/.env`。
 * 注意：若同名键存在于项目级 `.dev-kit/.env`，读取时项目级仍然优先，
 * 对该键的写入不会改变生效值（项目级文件为手工维护的覆盖层）。
 */
export async function saveDevKitEnv(updates: EnvMap): Promise<void> {
  captureShellEnv();

  // 只合并用户层：若并入项目层的值，会在用户文件里留下项目配置的副本，
  // 项目文件变更或删除后就变成过期残留。
  const currentEnv = await readEnvFile(devKitEnvPath);
  const nextEnv = {
    ...currentEnv,
    ...updates,
  };
  // 空值表示"未设置"，因此删除键而不是持久化 KEY=""，否则后续读取会误认为已配置。
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
  projectEnv: EnvMap,
  userEnv: EnvMap,
): CredentialDiagnostic {
  // 用启动快照而非 process.env：loadDevKitEnv 注入后 process.env 会包含文件层的值，
  // 直接读会把来源误标为 shell。
  const shellValue = getShellEnvValue(key);
  const projectValue = projectEnv[key];
  const userValue = userEnv[key];
  const value = shellValue ?? projectValue ?? userValue;
  const source = getDiagnosticSource(shellValue, projectValue, userValue);

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

/** 按读取优先级拼接实际提供了该键的层："process.env" > 项目级 > 用户级。 */
function getDiagnosticSource(
  shellValue: string | undefined,
  projectValue: string | undefined,
  userValue: string | undefined,
): string {
  const layers: string[] = [];
  if (shellValue !== undefined) layers.push("process.env");
  if (projectValue !== undefined) layers.push(PROJECT_ENV_LABEL);
  if (userValue !== undefined) layers.push(USER_ENV_LABEL);
  return layers.length > 0 ? layers.join(" over ") : "unset";
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

async function readEnvFile(filePath: string | undefined): Promise<EnvMap> {
  if (filePath === undefined) {
    return {};
  }
  try {
    return parseEnv(await readFile(filePath, "utf8"));
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return {};
    }
    throw error;
  }
}

/** 分别读取两个文件层：项目级（高优先）与用户级（兜底），文件不存在视为该层为空。 */
async function readEnvLayers(): Promise<{ project: EnvMap; user: EnvMap }> {
  const [project, user] = await Promise.all([
    readEnvFile(getProjectEnvPath()),
    readEnvFile(devKitEnvPath),
  ]);
  return { project, user };
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

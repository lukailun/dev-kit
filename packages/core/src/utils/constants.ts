export const DEV_KIT_DIR = "dev-kit";
export const UPDATE_METADATA_PATH = `${DEV_KIT_DIR}/.last-update.json`;

// Figma
export const FIGMA_BASE_URL_ENV_KEY = "FIGMA_BASE_URL";
export const FIGMA_FILE_ID_ENV_KEY = "FIGMA_FILE_ID";
export const FIGMA_PAGE_ID_ENV_KEY = "FIGMA_PAGE_ID";
export const FIGMA_TOKEN_ENV_KEY = "FIGMA_TOKEN";

// Git
export const GITHUB_BASE_URL_ENV_KEY = "GITHUB_BASE_URL";
export const GITHUB_TOKEN_ENV_KEY = "GITHUB_TOKEN";
export const GITLAB_BASE_URL_ENV_KEY = "GITLAB_BASE_URL";
export const GITLAB_TOKEN_ENV_KEY = "GITLAB_TOKEN";

// Linear
export const LINEAR_API_KEY_ENV_KEY = "LINEAR_API_KEY";
export const LINEAR_PROJECT_ID_ENV_KEY = "LINEAR_PROJECT_ID";

// OpenRouter
export const OPENROUTER_BASE_URL_ENV_KEY = "OPENROUTER_BASE_URL";
export const OPENROUTER_API_KEY_ENV_KEY = "OPENROUTER_API_KEY";

// Sentry
export const SENTRY_API_KEY_ENV_KEY = "SENTRY_API_KEY";
export const SENTRY_BASE_URL_ENV_KEY = "SENTRY_BASE_URL";
export const SENTRY_ORGANIZATION_ENV_KEY = "SENTRY_ORGANIZATION";
export const SENTRY_PROJECT_ENV_KEY = "SENTRY_PROJECT";

// Anthropic
export const CLAUDE_BASE_URL_ENV_KEY = "CLAUDE_BASE_URL";
export const CLAUDE_API_KEY_ENV_KEY = "CLAUDE_API_KEY";
export const CLAUDE_AUTH_TOKEN_ENV_KEY = "CLAUDE_AUTH_TOKEN";

// DeepSeek
export const DEEPSEEK_BASE_URL_ENV_KEY = "DEEPSEEK_BASE_URL";
export const DEEPSEEK_API_KEY_ENV_KEY = "DEEPSEEK_API_KEY";

// Gemini
export const GEMINI_BASE_URL_ENV_KEY = "GEMINI_BASE_URL";
export const GEMINI_API_KEY_ENV_KEY = "GEMINI_API_KEY";

// GLM
export const GLM_BASE_URL_ENV_KEY = "GLM_BASE_URL";
export const GLM_API_KEY_ENV_KEY = "GLM_API_KEY";

// KIMI
export const KIMI_BASE_URL_ENV_KEY = "KIMI_BASE_URL";
export const KIMI_API_KEY_ENV_KEY = "KIMI_API_KEY";

// LongCat
export const LONGCAT_BASE_URL_ENV_KEY = "LONGCAT_BASE_URL";
export const LONGCAT_API_KEY_ENV_KEY = "LONGCAT_API_KEY";

// Mimo
export const MIMO_BASE_URL_ENV_KEY = "MIMO_BASE_URL";
export const MIMO_API_KEY_ENV_KEY = "MIMO_API_KEY";

// MiniMax
export const MINIMAX_BASE_URL_ENV_KEY = "MINIMAX_BASE_URL";
export const MINIMAX_API_KEY_ENV_KEY = "MINIMAX_API_KEY";

// 混元 (Hy)
export const HY_BASE_URL_ENV_KEY = "HY_BASE_URL";
export const HY_API_KEY_ENV_KEY = "HY_API_KEY";

// Qwen
export const QWEN_BASE_URL_ENV_KEY = "QWEN_BASE_URL";
export const QWEN_API_KEY_ENV_KEY = "QWEN_API_KEY";

export const DEFAULT_PROVIDER = "openrouter";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export type OpenWikiProvider =
  | "anthropic"
  | "baseten"
  | "bedrock"
  | "fireworks"
  | "gemini"
  | "gemini-enterprise"
  | "nebius"
  | "nvidia"
  | "openai"
  | "openai-chatgpt"
  | "openai-compatible"
  | "openrouter";

/**
 * How a provider authenticates. Providers default to `"api-key"` (a pasted
 * secret persisted to a `*_API_KEY` env var); `"oauth"` providers instead run a
 * browser login flow and persist short-lived access/refresh tokens.
 */
export type ProviderAuthMethod = "api-key" | "oauth";

// export type SelectableOpenWikiProvider = OpenWikiProvider;

// export type ProviderModelOption = {
//   id: string;
//   label: string;
// };

// /**
//  * Model options offered by OpenAI. Shared by the `openai` (API key) and
//  * `openai-chatgpt` (OAuth login) providers so the two always expose an
//  * identical model list.
//  */
// const OPENAI_MODEL_OPTIONS: ProviderModelOption[] = [
//   { id: "gpt-5.6-terra", label: "5.6 Terra" },
//   { id: "gpt-5.6-luna", label: "5.6 Luna" },
//   { id: "gpt-5.6-sol", label: "5.6 Sol" },
//   { id: "gpt-5.5", label: "5.5" },
//   { id: "gpt-5.4-mini", label: "5.4 mini" },
// ];

// /**
//  * Google's own Gemini models. Offered by the `gemini` (AI Studio) provider and,
//  * on Gemini Enterprise (Vertex AI), served over the native `generateContent`
//  * surface. The `gemini-enterprise` provider additionally reaches Claude and
//  * partner/open-weight Model Garden models by pasting those model IDs directly.
//  */
// const GEMINI_MODELS: ProviderModelOption[] = [
//   { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
//   { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
//   { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
//   { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
//   { id: "gemini-3-flash", label: "Gemini 3 Flash" },
//   { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
// ];

// type ProviderConfig = {
//   /**
//    * Environment variable holding the provider's API key. Absent when the
//    * provider authenticates without an API key (e.g. Google Application
//    * Default Credentials for Vertex AI).
//    */
//   apiKeyEnvKey?: string;
//   /**
//    * Authentication method for the provider. Omitted entries are implicitly
//    * {@link ProviderAuthMethod} `"api-key"`. `"oauth"` providers replace the
//    * pasted-key setup step with a browser login and store tokens instead.
//    */
//   authMethod?: ProviderAuthMethod;
//   baseURL?: string;
//   /**
//    * Environment variable that, when set, overrides {@link ProviderConfig.baseURL}
//    * with an alternative base URL (e.g. a self-hosted or proxied endpoint).
//    */
//   baseUrlEnvKey?: string;
//   /**
//    * When true, the provider has no default endpoint and requires a base URL to
//    * be supplied via {@link ProviderConfig.baseUrlEnvKey}.
//    */
//   requiresBaseUrl?: boolean;
//   /**
//    * Environment variable holding the cloud project identifier required to
//    * run the provider (e.g. a Google Cloud project ID).
//    */
//   projectEnvKey?: string;
//   /**
//    * Environment variable that overrides {@link ProviderConfig.defaultLocation}
//    * with an alternative cloud location/region.
//    */
//   locationEnvKey?: string;
//   defaultLocation?: string;
//   label: string;
//   modelOptions: ProviderModelOption[];
//   /**
//    * Environment variable holding a second required secret (e.g. an AWS secret
//    * access key paired with {@link ProviderConfig.apiKeyEnvKey} as an access key
//    * ID). Omitted for providers authenticated by a single API key.
//    */
//   secretKeyEnvKey?: string;
//   /**
//    * Environment variable holding the provider's region (e.g. an AWS region).
//    * Only relevant when {@link ProviderConfig.requiresRegion} is true.
//    */
//   regionEnvKey?: string;
//   /**
//    * When true, the provider has no default region and requires one to be
//    * supplied via {@link ProviderConfig.regionEnvKey}.
//    */
//   requiresRegion?: boolean;
// };

// export const SELECTABLE_OPENWIKI_PROVIDERS = [
//   "openai",
//   "openai-chatgpt",
//   "anthropic",
//   "gemini",
//   "gemini-enterprise",
//   "openrouter",
//   "openai-compatible",
//   "bedrock",
//   "fireworks",
//   "baseten",
//   "nebius",
//   "nvidia",
// ] as const satisfies readonly SelectableOpenWikiProvider[];

// export const PROVIDER_CONFIGS: Record<OpenWikiProvider, ProviderConfig> = {
//   anthropic: {
//     apiKeyEnvKey: CLAUDE_API_KEY_ENV_KEY,
//     baseUrlEnvKey: CLAUDE_BASE_URL_ENV_KEY,
//     label: "Anthropic",
//     modelOptions: [
//       { id: "claude-haiku-4-5", label: "Haiku" },
//       { id: "claude-sonnet-5", label: "Sonnet" },
//       { id: "claude-opus-4-8", label: "Opus" },
//     ],
//   },
//   gemini: {
//     apiKeyEnvKey: GEMINI_API_KEY_ENV_KEY,
//     label: "Gemini (AI Studio)",
//     modelOptions: GEMINI_MODELS,
//   },
//   openrouter: {
//     apiKeyEnvKey: OPENROUTER_API_KEY_ENV_KEY,
//     baseURL: OPENROUTER_BASE_URL,
//     label: "OpenRouter",
//     modelOptions: [
//       { id: "z-ai/glm-5.2", label: "GLM 5.2" },
//       { id: "openrouter/fusion", label: "OpenRouter Fusion" },
//       { id: "moonshotai/kimi-k2.7-code", label: "Kimi K2.7 Code" },
//       { id: "anthropic/claude-opus-4-8", label: "Claude Opus" },
//       { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet" },
//       { id: "openai/gpt-5.4-mini", label: "GPT 5.4 mini" },
//       { id: "openai/gpt-5.5", label: "GPT 5.5" },
//     ],
//   },
// };

// export const DEFAULT_MODEL_ID =
//   PROVIDER_CONFIGS[DEFAULT_PROVIDER].modelOptions[0]?.id ?? "gpt-5.6-terra";

// export const SUGGESTED_MODEL_IDS = PROVIDER_CONFIGS[
//   DEFAULT_PROVIDER
// ].modelOptions.map((model) => model.id);

// export function getProviderConfig(provider: OpenWikiProvider): ProviderConfig {
//   return PROVIDER_CONFIGS[provider];
// }

// export function getProviderLabel(provider: OpenWikiProvider): string {
//   return getProviderConfig(provider).label;
// }

// export function getProviderApiKeyEnvKey(
//   provider: OpenWikiProvider,
// ): string | undefined {
//   return getProviderConfig(provider).apiKeyEnvKey;
// }

// export function getProviderAuthMethod(
//   provider: OpenWikiProvider,
// ): ProviderAuthMethod {
//   return getProviderConfig(provider).authMethod ?? "api-key";
// }

// export function providerUsesOAuth(provider: OpenWikiProvider): boolean {
//   return getProviderAuthMethod(provider) === "oauth";
// }

// export function providerRequiresApiKey(provider: OpenWikiProvider): boolean {
//   return getProviderConfig(provider).apiKeyEnvKey !== undefined;
// }

// export function getProviderProjectEnvKey(
//   provider: OpenWikiProvider,
// ): string | undefined {
//   return getProviderConfig(provider).projectEnvKey;
// }

// export function getProviderLocationEnvKey(
//   provider: OpenWikiProvider,
// ): string | undefined {
//   return getProviderConfig(provider).locationEnvKey;
// }

// /**
//  * Returns the first required-but-unset environment variable for a provider
//  * (its API key, or its cloud project for providers that authenticate without
//  * one), or `null` when the provider has everything it needs to run. Base URL
//  * requirements are checked separately via {@link providerRequiresBaseUrl}.
//  */
// export function getMissingProviderEnvKey(
//   provider: OpenWikiProvider,
//   env: NodeJS.ProcessEnv = process.env,
// ): string | null {
//   const config = getProviderConfig(provider);

//   if (config.apiKeyEnvKey && !env[config.apiKeyEnvKey]) {
//     return config.apiKeyEnvKey;
//   }

//   if (config.projectEnvKey && !env[config.projectEnvKey]) {
//     return config.projectEnvKey;
//   }

//   return null;
// }

// /**
//  * Resolves the cloud location for a provider, preferring the provider's
//  * configured environment variable over its built-in default. Returns
//  * `undefined` for providers without a location concept.
//  */
// export function resolveProviderLocation(
//   provider: OpenWikiProvider,
//   env: NodeJS.ProcessEnv = process.env,
// ): string | undefined {
//   const config = getProviderConfig(provider);
//   const override = config.locationEnvKey
//     ? env[config.locationEnvKey]
//     : undefined;
//   const trimmedOverride = override?.trim();

//   if (trimmedOverride) {
//     return trimmedOverride;
//   }

//   return config.defaultLocation;
// }

// /**
//  * A human-readable hint for providers whose credentials live outside the
//  * OpenWiki env file, appended to missing-credential error messages.
//  */
// export function getProviderCredentialHint(
//   provider: OpenWikiProvider,
// ): string | null {
//   if (provider === "gemini-enterprise") {
//     return (
//       "Authenticate to Google Cloud with Application Default Credentials " +
//       "(gcloud auth application-default login) or set " +
//       `${GOOGLE_APPLICATION_CREDENTIALS_ENV_KEY} to a service account key file.`
//     );
//   }

//   return null;
// }

// /**
//  * Resolves the base URL for a provider, preferring an alternative base URL from
//  * the provider's configured environment variable over the built-in default.
//  * Returns `undefined` when neither is set, so callers fall back to the SDK's
//  * own default endpoint.
//  */
// export function resolveProviderBaseUrl(
//   provider: OpenWikiProvider,
//   env: NodeJS.ProcessEnv = process.env,
// ): string | undefined {
//   const config = getProviderConfig(provider);
//   const override = config.baseUrlEnvKey ? env[config.baseUrlEnvKey] : undefined;
//   const trimmedOverride = override?.trim();

//   if (trimmedOverride) {
//     return trimmedOverride;
//   }

//   return config.baseURL;
// }

// export function getProviderBaseUrlEnvKey(
//   provider: OpenWikiProvider,
// ): string | undefined {
//   return getProviderConfig(provider).baseUrlEnvKey;
// }

// export function providerRequiresBaseUrl(provider: OpenWikiProvider): boolean {
//   return getProviderConfig(provider).requiresBaseUrl === true;
// }

// export function getProviderSecretKeyEnvKey(
//   provider: OpenWikiProvider,
// ): string | undefined {
//   return getProviderConfig(provider).secretKeyEnvKey;
// }

// export function providerRequiresSecretKey(provider: OpenWikiProvider): boolean {
//   return getProviderConfig(provider).secretKeyEnvKey !== undefined;
// }

// export function getProviderRegionEnvKey(
//   provider: OpenWikiProvider,
// ): string | undefined {
//   return getProviderConfig(provider).regionEnvKey;
// }

// export function providerRequiresRegion(provider: OpenWikiProvider): boolean {
//   return getProviderConfig(provider).requiresRegion === true;
// }

// /**
//  * Resolves the configured region for a provider from its region environment
//  * variable. Returns `undefined` when unset, so callers fall back to the SDK's
//  * own region resolution (e.g. `~/.aws/config`).
//  */
// export function resolveProviderRegion(
//   provider: OpenWikiProvider,
//   env: NodeJS.ProcessEnv = process.env,
// ): string | undefined {
//   const regionEnvKey = getProviderRegionEnvKey(provider);
//   const region = regionEnvKey ? env[regionEnvKey]?.trim() : undefined;

//   return region ? region : undefined;
// }

// export function isValidBaseUrl(value: string): boolean {
//   const trimmed = value.trim();

//   if (trimmed.length === 0) {
//     return false;
//   }

//   try {
//     const url = new URL(trimmed);

//     return url.protocol === "http:" || url.protocol === "https:";
//   } catch {
//     return false;
//   }
// }

// export function getProviderBaseUrlWarnings(
//   provider: OpenWikiProvider,
//   value: string,
// ): string[] {
//   if (!isValidBaseUrl(value)) {
//     return ["invalid base URL"];
//   }

//   if (provider === "openai-compatible" && isChatCompletionsEndpointUrl(value)) {
//     return ["use API root URL, not /chat/completions endpoint"];
//   }

//   return [];
// }

// export function isValidProviderBaseUrl(
//   provider: OpenWikiProvider,
//   value: string,
// ): boolean {
//   return getProviderBaseUrlWarnings(provider, value).length === 0;
// }

// function isChatCompletionsEndpointUrl(value: string): boolean {
//   try {
//     const url = new URL(value.trim());
//     const normalizedPath = url.pathname.replace(/\/+$/u, "").toLowerCase();

//     return normalizedPath.endsWith("/chat/completions");
//   } catch {
//     return false;
//   }
// }

// export function getProviderModelOptions(
//   provider: OpenWikiProvider,
// ): ProviderModelOption[] {
//   return getProviderConfig(provider).modelOptions;
// }

// export function getDefaultModelId(provider: OpenWikiProvider): string {
//   return getProviderModelOptions(provider)[0]?.id ?? DEFAULT_MODEL_ID;
// }

// // Returns the list of built-in providers whose known model options include the
// // given model ID by exact match, excluding the provider passed in. Used to warn
// // when a saved model plainly belongs to a different provider (e.g. an Anthropic
// // model left over while the provider is now OpenAI). Exact matching avoids false
// // positives from namespaced overlaps such as OpenRouter's "anthropic/claude-...".
// // Returns an empty array for custom/unknown model IDs, so gateway and
// // OpenAI-compatible model names are never flagged.
// export function getProvidersForKnownModelId(
//   modelId: string,
//   excludeProvider: OpenWikiProvider,
// ): OpenWikiProvider[] {
//   const normalized = normalizeModelId(modelId);
//   const providers: OpenWikiProvider[] = [];

//   for (const provider of Object.keys(PROVIDER_CONFIGS) as OpenWikiProvider[]) {
//     if (provider === excludeProvider) {
//       continue;
//     }
//     if (
//       getProviderModelOptions(provider).some(
//         (option) => option.id === normalized,
//       )
//     ) {
//       providers.push(provider);
//     }
//   }

//   return providers;
// }

// // True when the model ID is a known model of some other provider and is NOT a
// // known model of the configured provider — a clear provider/model mismatch.
// export function isModelIdForOtherProvider(
//   modelId: string,
//   provider: OpenWikiProvider,
// ): boolean {
//   const normalized = normalizeModelId(modelId);
//   const isKnownForProvider = getProviderModelOptions(provider).some(
//     (option) => option.id === normalized,
//   );

//   if (isKnownForProvider) {
//     return false;
//   }

//   return getProvidersForKnownModelId(normalized, provider).length > 0;
// }

// export function normalizeProvider(
//   value: string | null | undefined,
// ): OpenWikiProvider | null {
//   if (value === undefined || value === null) {
//     return null;
//   }

//   const provider = value.trim().toLowerCase();

//   return isValidProvider(provider) ? provider : null;
// }

// export function isValidProvider(value: string): value is OpenWikiProvider {
//   return value in PROVIDER_CONFIGS;
// }

// export function resolveConfiguredProvider(
//   env: NodeJS.ProcessEnv = process.env,
// ): OpenWikiProvider {
//   return (
//     normalizeProvider(env[OPENWIKI_PROVIDER_ENV_KEY]) ??
//     (env[OPENAI_API_KEY_ENV_KEY]
//       ? "openai"
//       : env[OPENAI_COMPATIBLE_API_KEY_ENV_KEY]
//         ? "openai-compatible"
//         : env[OPENROUTER_API_KEY_ENV_KEY]
//           ? "openrouter"
//           : env[ANTHROPIC_API_KEY_ENV_KEY]
//             ? "anthropic"
//             : env[BASETEN_API_KEY_ENV_KEY]
//               ? "baseten"
//               : env[FIREWORKS_API_KEY_ENV_KEY]
//                 ? "fireworks"
//                 : env[NEBIUS_API_KEY_ENV_KEY]
//                   ? "nebius"
//                   : env[NVIDIA_API_KEY_ENV_KEY]
//                     ? "nvidia"
//                     : env[BEDROCK_AWS_ACCESS_KEY_ID_ENV_KEY]
//                       ? "bedrock"
//                       : DEFAULT_PROVIDER)
//   );
// }

// export function resolveProviderRetryAttempts(
//   env: NodeJS.ProcessEnv = process.env,
// ): number {
//   const rawRetryAttempts = env[OPENWIKI_PROVIDER_RETRY_ATTEMPTS_ENV_KEY];

//   if (rawRetryAttempts === undefined) {
//     return DEFAULT_PROVIDER_RETRY_ATTEMPTS;
//   }

//   const retryAttempts = rawRetryAttempts.trim();

//   if (!/^[1-9]\d*$/u.test(retryAttempts)) {
//     throw new Error(
//       `Invalid ${OPENWIKI_PROVIDER_RETRY_ATTEMPTS_ENV_KEY}. Expected a positive integer.`,
//     );
//   }

//   const parsedRetryAttempts = Number(retryAttempts);

//   if (!Number.isSafeInteger(parsedRetryAttempts)) {
//     throw new Error(
//       `Invalid ${OPENWIKI_PROVIDER_RETRY_ATTEMPTS_ENV_KEY}. Expected a positive integer.`,
//     );
//   }

//   return parsedRetryAttempts;
// }

// export function resolveOpenRouterProviderOnly(
//   env: NodeJS.ProcessEnv = process.env,
// ): string[] | undefined {
//   const rawProviderOnly = env[OPENWIKI_OPENROUTER_PROVIDER_ONLY_ENV_KEY];

//   if (rawProviderOnly === undefined) {
//     return undefined;
//   }

//   const providers = rawProviderOnly
//     .split(",")
//     .map((provider) => provider.trim())
//     .filter((provider) => provider.length > 0);

//   return providers.length > 0 ? providers : undefined;
// }

// export function normalizeModelId(value: string): string {
//   return value.trim();
// }

// export function isValidModelId(value: string): boolean {
//   const modelId = normalizeModelId(value);

//   return (
//     modelId.length > 0 &&
//     modelId.length <= 120 &&
//     // Leading @ for Cloudflare Workers AI ids (@cf/...); interior @ for
//     // Vertex AI @-versioned ids (e.g. claude-sonnet-4-5@20250929).
//     /^[@A-Za-z0-9][A-Za-z0-9._:/@+-]*$/u.test(modelId) &&
//     !modelId.includes("://")
//   );
// }

export const DEV_KIT_VERSION = "0.2.2";

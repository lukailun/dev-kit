import { env } from 'process';
import { ENV_PATH } from '@/env/env-path';

/**
 * 读取并验证单个环境变量，缺失时抛出错误（而非 process.exit）
 *
 * 使用懒加载模式：仅在首次访问时验证，避免模块加载时的级联退出。
 */
export function requireEnv(name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(
      `[错误]: 未配置 ${name} 环境变量，请在 ${ENV_PATH} 文件中配置`
    );
  }
  return value;
}

/**
 * 读取并验证多个环境变量中至少存在一个，缺失时抛出错误
 */
export function requireOneOfEnv(names: string[]): string {
  for (const name of names) {
    const value = env[name];
    if (value) return value;
  }
  throw new Error(
    `[错误]: 未配置 ${names.join(' 或 ')} 环境变量，请在 ${ENV_PATH} 文件中配置其中之一`
  );
}

/**
 * 读取可选环境变量，不存在时返回 undefined
 */
export function optionalEnv(name: string): string | undefined {
  return env[name] || undefined;
}

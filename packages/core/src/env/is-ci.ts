import { env } from 'process';

export const IS_CI = env.CI === 'true';
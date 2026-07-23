import { env } from 'process';

export const isCI = env.CI === 'true';
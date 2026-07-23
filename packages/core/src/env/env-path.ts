import { IS_CI } from '@/env/is-ci';

export const ENV_PATH = IS_CI ? 'CI/CD Settings > Variables' : '.claude/.env';

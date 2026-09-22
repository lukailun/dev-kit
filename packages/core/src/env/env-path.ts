import { IS_CI } from './is-ci.js';

export const ENV_PATH = IS_CI ? 'CI/CD Settings > Variables' : '.dev-kit/.env 或 ~/.dev-kit/.env';

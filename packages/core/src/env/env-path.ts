import { isCI } from './is-ci';

const envPath = isCI ? 'CI/CD Settings > Variables' : '.claude/.env';

// if (!isCI) {
//   config({ path: envPath });
// }

export { envPath };

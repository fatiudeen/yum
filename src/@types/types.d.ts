import { MESSAGES, OPTIONS } from '../../packages/core/src/config/config';

declare global {
  MESSAGES, OPTIONS, <z.infer<typeof EnvSchema>>ENV;
}

import { MESSAGES, OPTIONS } from '@yumm/core/src/config/_config';

declare global {
  MESSAGES, OPTIONS, <z.infer<typeof EnvSchema>>ENV;
}

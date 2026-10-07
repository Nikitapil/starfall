import { config } from '@vue/test-utils';
import { beforeEach } from 'vitest';
import { i18n } from '@/plugins/i18n';

config.global.plugins.push(i18n);

beforeEach(() => {
  i18n.global.locale.value = 'eng';
});

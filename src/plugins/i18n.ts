import { createI18n } from 'vue-i18n';
import { LANGS } from '@/plugins/domain.ts';
import { getLangFromStorage } from '@/plugins/locale-storage.ts';
import messages from '@/locales';

export const i18n = createI18n({
  availableLocales: LANGS,
  locale: getLangFromStorage(),
  fallbackLocale: LANGS[0],
  legacy: false,
  messages
});

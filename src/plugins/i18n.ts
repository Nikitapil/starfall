import { createI18n, useI18n as useI18nLib } from 'vue-i18n';
import { type Lang, LANGS } from '@/plugins/domain.ts';
import { getLangFromStorage } from '@/plugins/locale-storage.ts';
import messages from '@/locales';

export const i18n = createI18n({
  availableLocales: LANGS,
  locale: getLangFromStorage(),
  fallbackLocale: LANGS[0],
  legacy: false,
  messages
});

export const useI18n = useI18nLib<typeof messages, Lang>;

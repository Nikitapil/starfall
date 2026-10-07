import { createI18n, useI18n as useI18nLib } from 'vue-i18n';
import { type Lang, LANGS } from '@/plugins/domain.ts';
import { getLangFromStorage } from '@/plugins/locale-storage.ts';
import messages from '@/locales';

const russianPluralRules = new Intl.PluralRules('ru');

export const i18n = createI18n({
  availableLocales: LANGS,
  locale: getLangFromStorage(),
  fallbackLocale: LANGS[0],
  legacy: false,
  pluralRules: {
    rus: (count: number) => {
      const category = russianPluralRules.select(count);
      return category === 'one' ? 0 : category === 'few' ? 1 : 2;
    }
  },
  messages
});

export const useI18n = useI18nLib<{ message: typeof messages.eng }, Lang>;

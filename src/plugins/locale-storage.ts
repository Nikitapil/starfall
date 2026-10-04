import type { Lang } from '@/plugins/domain.ts';

const LANG_KEY = 'lang';

export const setLangToStorage = (lang: Lang): void => {
  localStorage.setItem(LANG_KEY, lang);
};

export const getLangFromStorage = (): Lang => {
  return (localStorage.getItem(LANG_KEY) as Lang) || 'eng';
};

export const LANGS = ['rus', 'eng'] as const;

export type Lang = (typeof LANGS)[number];

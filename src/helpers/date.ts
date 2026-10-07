import type { Lang } from '@/plugins/domain';

const options: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
};

const dateFormatters = {
  eng: new Intl.DateTimeFormat('en', options),
  rus: new Intl.DateTimeFormat('ru', options)
};

export const formatCreatedAt = (value: string, locale: Lang = 'eng') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatters[locale].format(date);
};

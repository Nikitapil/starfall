const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

export const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  return dateFormatter.format(date);
};

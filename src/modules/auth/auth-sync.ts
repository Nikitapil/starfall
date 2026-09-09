export const AUTH_CHANGE_KEY = 'starfall:auth-change';

export const notifyAuthChange = () => {
  localStorage.setItem(AUTH_CHANGE_KEY, crypto.randomUUID());
};

export const subscribeToAuthChanges = (onChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && event.key === AUTH_CHANGE_KEY && event.newValue !== null) {
      onChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};

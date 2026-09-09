export const ACCESS_TOKEN_KEY = 'a_token';

export const getAuthToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
};

export const setAuthToken = (token: string) => {
  return localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeAuthToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

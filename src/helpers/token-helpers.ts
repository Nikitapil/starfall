export const ACCESS_TOKEN_KEY = 'a_token';

export const getAuthToken = () => {
  return localStorage.getItem('a_token') || '';
};

export const setAuthToken = (token: string) => {
  return localStorage.setItem('a_token', token);
};

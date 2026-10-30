export const KEY_TOKEN = "access_token";

export const setToken = (token) => {
  sessionStorage.setItem(KEY_TOKEN, token);
};

export const getToken = () => {
  return sessionStorage.getItem(KEY_TOKEN);
};

export const removeToken = () => {
  sessionStorage.removeItem(KEY_TOKEN);
};
import Cookies from 'js-cookie';

export const LANGUAGE_COOKIE_NAME = 'sub-idler-me.language';

export const SetLanguageCookie = (language) => {
  Cookies.set(LANGUAGE_COOKIE_NAME, language, {
    expires: 365,
    sameSite: 'lax'
  });
}

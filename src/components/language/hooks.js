'use client';

import { useLocale as useNextIntlLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { UserLanguageSet } from '@/components/language/actions';
import { SetLanguageCookie } from '@/components/language/cookie';
import { ValidateLanguageCode } from '@/components/language/validate';

export const useLanguage = () => {
  const language = useNextIntlLocale();
  const router = useRouter();
  const {isAuthenticated} = useAuth();

  const setLanguage = async (update) => {
    try {
      const validatedLanguage = ValidateLanguageCode(update);
      if (!validatedLanguage) {
        throw new Error('invalid');
      }

      if (isAuthenticated) {
        const result = await UserLanguageSet(validatedLanguage);
        if (!result.success) {
          throw new Error(result.error || 'invalid');
        }
      }

      SetLanguageCookie(validatedLanguage);
      router.refresh();
    } catch (error) {
      throw new Error(error?.message || 'failed');
    }
  };

  return {
    language,
    setLanguage,
  };
}

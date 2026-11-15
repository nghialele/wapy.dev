'use server';

import { withAuth } from '@/lib/with-auth';
import { AccountSettings } from './account-container';
import { userGetSession } from '@/lib/user-session';
import { getTranslations } from 'next-intl/server';

const PageAccount = async () => {
  const { user } = await userGetSession();

  return (
    <div className='container flex flex-col items-center justify-center gap-6 text-center'>
      <AccountSettings
        user={user}
     />
    </div>
  );
};

export default withAuth(PageAccount);

export async function generateMetadata() {
  const t = await getTranslations('pages.account.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
};

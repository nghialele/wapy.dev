'use server';

import { getTranslations } from 'next-intl/server';
import { withAuth } from '@/lib/with-auth';
import { SubscriptionEdit } from '@/components/subscriptions/edit';
import { userGetSession } from '@/lib/user-session';

const PageNewSubscription = async () => {
  const { user } = await userGetSession();

  return (
      <div className='container flex flex-col items-center justify-center gap-6 text-center'>
        <SubscriptionEdit user={user} />
      </div>
  )
}

export default withAuth(PageNewSubscription);

export async function generateMetadata() {
  const t = await getTranslations('pages.edit.meta');

  return {
    title: t('new'),
  };
};
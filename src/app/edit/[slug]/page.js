'use server';

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { useAuthServer } from '@/lib/auth-server';
import { withAuth } from '@/lib/with-auth';
import { SubscriptionGet } from '@/components/subscriptions/actions';
import { SubscriptionEdit } from '@/components/subscriptions/edit';
import { userGetSession } from '@/lib/user-session';

const PageSubscriptionEdit = async ({ params }) => {
  const slug = (await params).slug;
  const { session, user } = await userGetSession();

  const subscription = await SubscriptionGet(slug, session?.user?.id);
  if (!subscription) {
    return notFound();
  }

  return (
      <div className='container flex flex-col items-center justify-center gap-6'>
        <SubscriptionEdit user={user} subscription={ subscription } />
      </div>
  );
};

export default withAuth(PageSubscriptionEdit);

export async function generateMetadata({ params }) {
  const { getUserId } = await useAuthServer();
  const userId = getUserId();
  const t = await getTranslations('pages');

  if (!userId) {
    return {
      title: t('edit.meta.unauthorized'),
    };
  }

  const subscriptionId = (await params).slug;
  const subscription = await SubscriptionGet(subscriptionId, userId);

  return {
    title: subscription?.name ? t('edit.meta.edit', { name: subscription.name }) : t('notFound.meta.title'),
  };
}
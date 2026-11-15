'use server';

import { getTranslations } from 'next-intl/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionReports } from '@/components/subscriptions/reports';
import { userGetSession } from '@/lib/user-session';

const PageReports = async () => {
  const { session } = await userGetSession();

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session?.user?.id,
    },
    include: {
      categories: {
        select: {
          name: true,
          color: true
        }
      },
      paymentMethods: {
        select: {
          name: true,
          icon: true
        }
      },
    },
    omit: {
      userId: true,
      createdAt: true,
      updatedAt: true,
      nextNotificationTime: true,
      nextNotificationDetails: true,
      notes: true,
    },
    orderBy: {
      paymentDate: 'asc'
    }
  });

  return (
      <div className='flex flex-col items-center w-full max-w-3xl gap-4'>
        <SubscriptionReports subscriptions={subscriptions} />
      </div>
  )
}

export default withAuth(PageReports);

export async function generateMetadata() {
  const t = await getTranslations('pages.reports.meta');
  return {
    title: t('title'),
  };
};
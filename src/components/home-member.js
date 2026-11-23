'use server';

import { prisma } from '@/lib/prisma';
import { userGetSession } from '@/lib/user-session';
import { withAuth } from '@/lib/with-auth';
import { SubscriptionList } from '@/components/subscriptions/list';

const HomeMember = async ({ userId, externalServices }) => {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: userId,
    },
    include: {
      categories: {
        select: {
          id: true,
          name: true,
          color: true
        }
      },
      paymentMethods: {
        select: {
          id: true,
          name: true,
          icon: true
        }
      },
      _count: {
        select: {
          pastPayments: true
        }
      }
    },
    omit: {
      userId: true,
    },
    orderBy: [
      {
        enabled: 'desc'
      },
      {
        paymentDate: 'asc'
      }
    ]
  });

  const { user } = await userGetSession();

  return (
    <div className='flex flex-col items-center w-full max-w-3xl gap-4'>
      <SubscriptionList subscriptions={subscriptions} externalServices={externalServices} user={{ currency: user?.currency, timezone: user?.timezone, notifications: user?.notifications, paymentMethods: [], categories: [] }} />
    </div>
  );
};

export default withAuth(HomeMember);
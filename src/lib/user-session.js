'use server';

import { useAuthServer } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export const userGetSession = async () => {
  const { isAuthenticated, getUserId, session } = await useAuthServer();

  if (!isAuthenticated()) {
    return {
      session,
      user: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: getUserId(),
    },
    omit: {
      id: true,
    },
    include: {
      categories: {
        select: {
          id: true,
          name: true,
          color: true,
        },
        orderBy: {
          name: 'asc'
        },
      },
      paymentMethods: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
        orderBy: {
          name: 'asc'
        },
      },
    },
  });

  // Hide sensitive ntfy token data from client
  if (user?.externalServices?.ntfy?.token) {
    user.externalServices.ntfy = {
      ...user.externalServices.ntfy,
      token: '*'.repeat(user.externalServices.ntfy.token.length)
    };
  }

  return {
    session,
    user,
  };
};

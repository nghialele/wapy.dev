'use server';

import { HomeVisitor } from '@/components/home-visitor';
import { userGetSession } from '@/lib/user-session';
import HomeMember from '@/components/home-member';

export default async function PageHome() {
  const { session } = await userGetSession();

  if (!session || !session.user) {
    return <HomeVisitor />;
  }

  return (
      <HomeMember userId={ session.user.id } externalServices={session.user?.externalServices || {}}/>
  );
}

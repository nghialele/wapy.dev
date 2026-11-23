'use server';

import { getTranslations } from 'next-intl/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionReports } from '@/components/subscriptions/reports';
import { userGetSession } from '@/lib/user-session';
import { convertAmount, PROVIDER } from '@/lib/currency';

const PageReports = async () => {
  const { session, user } = await userGetSession();
  const preferredCurrency = user?.currency || 'EUR';

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

  // Historical payments convert at their own payment-date rates (#81).
  const pastPayments = await prisma.pastPayment.findMany({
    where: {
      userId: session?.user?.id,
    },
    select: {
      price: true,
      currency: true,
      paymentDate: true,
    },
  });

  // Distinct (base, date) pairs so each rate is fetched once.
  const needed = new Set();
  subscriptions.forEach(sub => {
    if (sub.currency !== preferredCurrency) {
      needed.add(`${sub.currency}>latest`);
    }
  });
  pastPayments.forEach(p => {
    if (p.currency !== preferredCurrency) {
      const day = p.paymentDate.toISOString().slice(0, 10);
      needed.add(`${p.currency}>${day}`);
    }
  });

  // Convert a probe of 1 unit for each pair/date to resolve rates through
  // the provider/cache boundary; the client applies rates to real amounts.
  const fx = { preferredCurrency, provider: PROVIDER, rates: {}, unconverted: [], latest: {} };
  for (const key of needed) {
    const [base, datePart] = key.split('>');
    const date = datePart === 'latest' ? undefined : new Date(`${datePart}T00:00:00.000Z`);
    const result = await convertAmount(1, base, preferredCurrency, date);
    if (result.converted && result.rate) {
      const rateKey = datePart === 'latest' ? `${base}>latest` : `${base}>${datePart}`;
      fx.rates[rateKey] = { rate: result.rate, rateDate: result.rateDate ? result.rateDate.toISOString().slice(0, 10) : null, source: result.source };
      if (datePart === 'latest') {
        fx.latest[base] = fx.rates[rateKey];
      }
    } else {
      fx.unconverted.push(base);
    }
  }

  // Convert each past payment to the preferred currency with its own rate.
  fx.pastTotals = {};
  for (const payment of pastPayments) {
    let convertedAmount = payment.price;
    if (payment.currency !== preferredCurrency) {
      const rateInfo = fx.rates[`${payment.currency}>${payment.paymentDate.toISOString().slice(0, 10)}`];
      if (rateInfo) {
        convertedAmount = payment.price * rateInfo.rate;
      } else {
        const latest = fx.latest[payment.currency];
        if (latest) {
          convertedAmount = payment.price * latest.rate;
        } else {
          // Unconverted: aggregate under its own currency.
          fx.pastTotals[payment.currency] = (fx.pastTotals[payment.currency] || 0) + payment.price;
          continue;
        }
      }
    }
    fx.pastTotals[preferredCurrency] = (fx.pastTotals[preferredCurrency] || 0) + convertedAmount;
  }

  return (
      <div className='flex flex-col items-center w-full max-w-3xl gap-4'>
        <SubscriptionReports subscriptions={subscriptions} fx={fx} />
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

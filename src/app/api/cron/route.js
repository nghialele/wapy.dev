'use server';

import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { createFormatter } from 'use-intl/core';
import jsonwebtoken from 'jsonwebtoken';
import {
  isEqual,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInWeeks,
} from 'date-fns';
import { prisma } from '@/lib/prisma';
import {
  UserSubscriptionSendNotification,
  UserSubscriptionSendEmail,
} from '@/lib/notifications';
import { SubscriptionGetNextNotificationDate } from '@/components/subscriptions/lib';
import { siteConfig } from '@/components/config';
import { formatPrice } from '@/components/subscriptions/utils';
import {
  SendWebhook,
  SendNtfy,
  SendDiscord,
  SendSlack,
} from '@/components/subscriptions/external-services';

export async function GET() {
  const rightNow = new Date();

  const subscriptions = await prisma.subscription.findMany({
    where: {
      enabled: true,
      nextNotificationTime: {
        not: null,
        lte: rightNow,
      },
      user: {
        isBlocked: false,
      }
    },
    include: {
      user: {
        include: {
          push: true,
        }
      }
    }
  });

  const startTime = performance.now();
  const promises = [];
  for (const subscription of subscriptions) {
    const t = await getTranslations({ locale: subscription.user.language || 'en', namespace: 'notifications.subscription.payment' });
    const tExternal = await getTranslations({ locale: subscription.user.language || 'en', namespace: 'notifications.externalServices' });
    const tEmail = await getTranslations({ locale: subscription.user.language || 'en', namespace: 'components.notifications.email' });
    const formatter = await createFormatter({ locale: subscription.user.language || 'en' });

    const notificationTypes = subscription?.nextNotificationDetails?.type && Array.isArray(subscription?.nextNotificationDetails?.type)
      ? subscription.nextNotificationDetails.type
      : [];
    const isPushEnabled = notificationTypes.includes('PUSH');
    const isEmailEnabled = notificationTypes.includes('EMAIL');
    const isUserWebhookEnabled = !!(subscription.user?.externalServices?.webhook?.enabled
      && subscription.user?.externalServices?.webhook?.url);
    const isWebhookEnabled = isUserWebhookEnabled && notificationTypes.includes('WEBHOOK');
    const isUserNtfyEnabled = !!(subscription.user?.externalServices?.ntfy?.enabled
      && subscription.user?.externalServices?.ntfy?.url);
    const isNtfyEnabled = isUserNtfyEnabled && notificationTypes.includes('NTFY');
    const isUserDiscordEnabled = !!(subscription.user?.externalServices?.discord?.enabled
      && subscription.user?.externalServices?.discord?.url);
    const isDiscordEnabled = isUserDiscordEnabled && notificationTypes.includes('DISCORD');
    const isUserSlackEnabled = !!(subscription.user?.externalServices?.slack?.enabled
      && subscription.user?.externalServices?.slack?.url);
    const isSlackEnabled = isUserSlackEnabled && notificationTypes.includes('SLACK');

    const paymentDateRaw = subscription.nextNotificationDetails?.paymentDate;
    const paymentDate = paymentDateRaw?.$type === 'DateTime' ? new Date(paymentDateRaw.value) : paymentDateRaw;
    const isPaymentDueNow = isEqual(paymentDate, subscription.nextNotificationTime);
    const isPaymentReminder = subscription.nextNotificationDetails?.isRepeat ? true : false;

    const title = t(
      isPaymentDueNow
        ? 'title.due'
        : isPaymentReminder
          ? 'title.reminder'
          : 'title.upcoming',
      { name: subscription.name }
    );

    const message = t(
      isPaymentDueNow
        ? 'message.due'
        : isPaymentReminder
          ? 'message.reminder'
          : 'message.upcoming',
      {
        name: subscription.name,
        price: formatPrice(subscription.price, subscription.currency, subscription.user.language || 'en'),
        ...(!isPaymentDueNow && !isPaymentReminder && {
          dueText: formatter.relativeTime(paymentDate, {
            now: rightNow,
            unit: Math.abs(differenceInWeeks(paymentDate, rightNow)) >= 1
              ? 'week'
              : Math.abs(differenceInDays(paymentDate, rightNow)) >= 1
              ? 'day'
              : Math.abs(differenceInHours(paymentDate, rightNow)) >= 1
              ? 'hour'
              : Math.abs(differenceInMinutes(paymentDate, rightNow)) >= 1
              ? 'minute'
              : undefined,
          })
        })
      }
    );

    const token = jsonwebtoken.sign({
      id: subscription.id,
      userId: subscription.userId,
      paymentDate: subscription.paymentDate,
    }, process.env.SUBSCRIPTION_JWT_SECRET);
    const markAsPaidUrl = `${siteConfig.url}/api/mark-as-paid/?token=${token}`;

    // Send push notification if enabled
    if (isPushEnabled) {
      promises.push(UserSubscriptionSendNotification(subscription, title, message, markAsPaidUrl, isPaymentDueNow, {
        markAsPaid: t('markAsPaid'),
        dismiss: t('dismiss'),
      }));
    }

    // Send email notification if enabled
    if (isEmailEnabled) {
      promises.push(UserSubscriptionSendEmail(subscription, title, message, markAsPaidUrl, {
        header: tEmail('header'),
        markAsPaid: t('markAsPaid'),
        viewDetails: tExternal('viewDetails'),
        footer: tEmail('footer', { siteName: siteConfig.name }),
        thanks: tEmail('thanks'),
        madeBy: tEmail('madeBy', { siteLink: `<a href="${siteConfig.url}" target="_blank">${siteConfig.name}</a>` }),
      }));
    }

    // Send webhook notification if enabled
    if (isWebhookEnabled) {
      promises.push(SendWebhook(subscription.user?.externalServices?.webhook?.url, {
        event: isPaymentDueNow ? 'payment_due_now' : (isPaymentReminder ? 'payment_overdue' : 'payment_due_upcoming'),
        price: subscription.price,
        currency: subscription.currency,
        paymentDate: subscription.paymentDate,
        url: subscription.url,
        notes: subscription.notes,
        title: title,
        message: message,
        tags: ['sub.idler.me'],
        markAsPaidUrl: markAsPaidUrl,
        url: siteConfig.url,
        timestamp: rightNow.toISOString(),
      }));
    }

    if (isNtfyEnabled) {
      promises.push(SendNtfy(subscription.user?.externalServices?.ntfy, {
        title: title,
        message: message,
        actions: [
          {
            action: 'view',
            label: t('markAsPaid'),
            url: markAsPaidUrl,
            clear: true
          },
        ]
      }));
    }

    if (isDiscordEnabled) {
      promises.push(SendDiscord(subscription.user?.externalServices?.discord, {
        title: title,
        message: message,
        markAsPaidUrl: markAsPaidUrl,
        translations: {
          header: tExternal('header', { siteName: siteConfig.name }),
          paymentQuestion: tExternal('paymentQuestion'),
          markAsPaid: t('markAsPaid'),
          viewDetails: tExternal('viewDetails'),
          visitDashboard: tExternal('visitDashboard'),
          footer: tExternal('footer', { siteName: siteConfig.name }),
        },
      }));
    }

    if (isSlackEnabled) {
      promises.push(SendSlack(subscription.user?.externalServices?.slack, {
        title: title,
        message: message,
        markAsPaidUrl: markAsPaidUrl,
        translations: {
          header: tExternal('header', { siteName: siteConfig.name }),
          markAsPaid: t('markAsPaid'),
          visitDashboard: tExternal('visitDashboard'),
          footer: tExternal('footer', { siteName: siteConfig.name }),
        },
      }));
    }

    // Update subscription
    const nextNotificationDate = SubscriptionGetNextNotificationDate(subscription);
    promises.push(prisma.subscription.update({
      where: {
        id: subscription.id,
        userId: subscription.userId,
      },
      data: {
        nextNotificationTime: nextNotificationDate ? nextNotificationDate.date : null,
        nextNotificationDetails: nextNotificationDate ? nextNotificationDate.details : {},
      },
    }));

    promises.push(prisma.pastNotification.create({
      data: {
        userId: subscription.userId,
        title: title,
        message: message,
        type: 'PAYMENT_DUE',
        subscriptionId: subscription.id,
      },
    }));
  }

  await Promise.allSettled(promises);
  const endTime = performance.now();
  if ((endTime - startTime) > 1000) {
    console.log(`Notifications sent in ${endTime - startTime}ms`);
  }

  return NextResponse.json({ success: true });
}
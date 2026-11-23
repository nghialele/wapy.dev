'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Icons } from '@/components/icons';
import { SchemaSubscriptionEdit } from '@/components/subscriptions/schema';
import { SubscriptionActionEdit } from '@/components/subscriptions/actions';

// Quick add dialog (#9): name, price, next payment date only. Everything
// else defaults to the user's currency/timezone and a monthly cycle; the
// full form at /edit/new covers advanced details.
export const SubscriptionQuickAdd = ({ user, open, onOpenChange }) => {
  const t = useTranslations('components.subscriptions.edit');
  const tList = useTranslations('components.subscriptions.list');
  const tCommon = useTranslations('common');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(SchemaSubscriptionEdit.pick({ name: true, price: true, paymentDate: true })),
    defaultValues: {
      name: '',
      price: 9.99,
      paymentDate: addDays(toZonedTime(new Date(), user.timezone).setHours(9, 0, 0, 0), 1),
    },
  });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await SubscriptionActionEdit({
        name: values.name,
        price: values.price,
        paymentDate: fromZonedTime(values.paymentDate, user.timezone),
        enabled: true,
        currency: user.currency,
        timezone: user.timezone,
        cycle: { time: 'MONTHS', every: 1 },
        notifications: user.notifications,
        categories: [],
        paymentMethods: [],
      });
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error(t('toast.create.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tList('quickAdd.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription className='text-left'>
            {tList('quickAdd.description')}{' '}
            <a href='/edit/new' className='underline'>{tList('quickAdd.advanced')}</a>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4 text-left'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tList('quickAdd.name')}</FormLabel>
                  <FormControl>
                    <input
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                      placeholder={tList('quickAdd.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='price'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tList('quickAdd.price')}</FormLabel>
                  <FormControl>
                    <input
                      type='number'
                      step='0.01'
                      min='0.01'
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='paymentDate'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input
                      type='datetime-local'
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                      value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ResponsiveDialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type='submit' disabled={submitting}>
                <Icons.sparkles />
                {tList('quickAdd.submit')}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

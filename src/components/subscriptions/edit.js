'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { SchemaSubscriptionEdit } from '@/components/subscriptions/schema';
import { SubscriptionActionEdit, SubscriptionActionDelete } from '@/components/subscriptions/actions';
import { FormFieldName } from '@/components/subscriptions/form/field-name';
import { FormFieldLogo } from '@/components/subscriptions/form/form-logo';
import { FormFieldCurrency } from '@/components/subscriptions/form/field-currency';
import { FormFieldPrice } from '@/components/subscriptions/form/field-price';
import { FormFieldFirstPaymentDate } from '@/components/subscriptions/form/field-first-payment-date';
import { FormFieldPaymentDate } from '@/components/subscriptions/form/field-payment-date';
import { FormFieldCycle } from '@/components/subscriptions/form/field-cycle';
import { FormFieldUntilDate } from '@/components/subscriptions/form/field-until-date';
import { FormFieldUrl } from '@/components/subscriptions/form/field-url';
import { FormFieldCategory } from '@/components/subscriptions/form/field-category';
import { FormFieldPaymentMethod } from '@/components/subscriptions/form/field-payment-method';
import { FormFieldNotifications } from '@/components/subscriptions/form/field-notifications';
import { FormFieldNotes } from '@/components/subscriptions/form/field-notes';
import { FormFieldTimezone } from '@/components/subscriptions/form/field-timezone';
import { addDays } from 'date-fns';
import { GetPastScheduledPaymentDates } from '@/components/subscriptions/lib';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Icons } from '@/components/icons';
export const SubscriptionEdit = ({ user, subscription = undefined }) =>  {
  const t = useTranslations('components.subscriptions.edit');
  const tCommon = useTranslations('common');
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(SchemaSubscriptionEdit),
    defaultValues: {
      id: subscription?.id,
      name: subscription?.name || '',
      logo: subscription?.logo || '',
      enabled: subscription?.enabled !== undefined ? subscription?.enabled : true,
      price: subscription?.price || 9.99,
      currency: subscription?.currency || user.currency,
      paymentDate: subscription?.paymentDate ? toZonedTime(subscription.paymentDate, subscription.timezone) : addDays(toZonedTime(new Date(), user.timezone).setHours(9, 0, 0, 0), 1),
      firstPaymentDate: subscription?.firstPaymentDate ? toZonedTime(subscription.firstPaymentDate, subscription.timezone) : null,
      timezone: subscription?.timezone || user.timezone,
      untilDate: subscription?.untilDate ? toZonedTime(subscription.untilDate, subscription.timezone) : null,
      cycle: subscription?.cycle || { time: 'MONTHS', every: 1 },
      url: subscription?.url || '',
      notes: subscription?.notes || '',
      categories: subscription?.categories || [],
      paymentMethods: subscription?.paymentMethods || [],
      notifications: subscription?.notifications || user.notifications,
    }
  });

  // Historical payment preview (#105): when creating with a first payment date
  // earlier than the next due date, show a confirmation dialog before writing
  // any generated PastPayment rows. Cancel writes nothing.
  const [historyPreview, setHistoryPreview] = useState(null);
  const [selectedHistoryDates, setSelectedHistoryDates] = useState({});

  async function onSubmit(values) {
    if (values?.firstPaymentDate && !subscription?.id) {
      const zonedFirst = fromZonedTime(values.firstPaymentDate, values.timezone);
      const zonedPayment = fromZonedTime(values.paymentDate, values.timezone);
      if (zonedFirst.getTime() < zonedPayment.getTime()) {
        const dates = values.enabled
          ? GetPastScheduledPaymentDates(zonedFirst, values?.untilDate ? fromZonedTime(values.untilDate, values.timezone) : null, values.cycle.time, values.cycle.every)
          : [];
        setHistoryPreview({ values, dates });
        setSelectedHistoryDates(Object.fromEntries(dates.map(d => [d.toISOString(), true])));
        return;
      }
      values.firstPaymentDate = zonedFirst;
    }
    await submitSubscription(values);
  }

  async function submitSubscription(values, confirmedDates = undefined) {
    if (values?.untilDate) {
      values.untilDate.setHours(values.paymentDate.getHours(), values.paymentDate.getMinutes(), values.paymentDate.getSeconds());
      values.untilDate = fromZonedTime(values.untilDate, values.timezone);
    }
    values.paymentDate = fromZonedTime(values.paymentDate, values.timezone);
    if (values?.firstPaymentDate && !subscription?.id) {
      values.firstPaymentDate = fromZonedTime(values.firstPaymentDate, values.timezone);
    } else if (subscription?.id) {
      values.firstPaymentDate = undefined;
    }
    values.historyPaymentDates = confirmedDates;
    const result = await SubscriptionActionEdit(values);
    if (!result) {
      toast.error(t('toast.create.error'));
    } else {
      toast.success(t('toast.create.success'));
    }
  }

  async function onDelete() {
    const result = await SubscriptionActionDelete(subscription.id);
    if (result) {
      toast.success(t('toast.delete.success'));
    } else {
      toast.error(t('toast.delete.error'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full max-w-2xl flex flex-col gap-6 text-left'>
        <FormField
          control={form.control}
          name='enabled'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className='flex items-center gap-4'>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FormLabel className='inline-flex flex-row gap-2'>
                    <h3 className='text-lg font-semibold'>{t('sections.details')}</h3>
                  </FormLabel>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormFieldName field={field} />
          )}
        />

        {/* Logo */}
        <FormField
          control={form.control}
          name='logo'
          render={({ field }) => (
            <FormFieldLogo field={field} />
          )}
        />

        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Price */}
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormFieldPrice field={field} />
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name='currency'
            render={({ field }) => (
              <FormFieldCurrency field={field} />
            )}
          />
        </div>

        {/* Payment Date */}
        <FormField
          control={form.control}
          name='paymentDate'
          render={({ field }) => (
            <FormFieldPaymentDate field={field} />
          )}
        />

        {/* First Payment Date */}
        {!subscription?.id && (
          <FormField
            control={form.control}
            name='firstPaymentDate'
            render={({ field }) => (
              <FormFieldFirstPaymentDate field={field} />
            )}
          />
        )}

        {/* Cycle */}
        <FormField
          control={form.control}
          name='cycle'
          render={({ field }) => (
            <FormFieldCycle field={field} />
          )}
        />

        {/* URL */}
        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormFieldUrl field={field} />
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name='notes'
          render={({ field }) => (
            <FormFieldNotes field={field} />
          )}
        />

        {/* Payment Methods */}
        <FormField
          control={form.control}
          name='paymentMethods'
          render={({ field }) => (
            <FormFieldPaymentMethod field={field} paymentMethods={user.paymentMethods ? user.paymentMethods : []} />
          )}
        />

        {/* Categories */}
        <FormField
          control={form.control}
          name='categories'
          render={({ field }) => (
            <FormFieldCategory field={field} categories={user.categories ? user.categories : []} />
          )}
        />

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='advanced'>
            <AccordionTrigger>{t('sections.advanced')}</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-6 m-1'>
                <FormField
                  control={form.control}
                  name='untilDate'
                  render={({ field }) => (
                    <FormFieldUntilDate field={field} />
                  )}
                />

                <FormField
                  control={form.control}
                  name='timezone'
                  render={({ field }) => (
                    <FormFieldTimezone field={field} />
                  )}
                />

                <FormField
                  control={form.control}
                  name='notifications'
                  render={({ field }) => (
                    <FormFieldNotifications field={field} externalServices={user.externalServices || {}} />
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
          <Button
            type='submit'
            className='w-full sm:w-auto'
          >
            <Icons.save />
            {subscription ? t('title.update') : t('title.create')}
          </Button>
          {subscription?.id && (
            <Button
              type='button'
              className='w-full sm:w-auto'
              variant='destructive'
              onClick={() => setDialogOpen(true)}
            >
              <Icons.trash />
              {t('deleteDialog.title')}
            </Button>
          )}
        </div>
      </form>
      <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('deleteDialog.title')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription className='text-left'>
              {t('deleteDialog.description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialogOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={() => {setDialogOpen(false); onDelete();}}
              variant='destructive'
            >
              {tCommon('delete')}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <ResponsiveDialog open={!!historyPreview} onOpenChange={(open) => !open && setHistoryPreview(null)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('historyDialog.title')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription className='text-left'>
              {t('historyDialog.description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className='max-h-64 overflow-y-auto flex flex-col gap-2 text-left'>
            {historyPreview?.dates?.length === 0 && (
              <p className='text-sm text-muted-foreground'>{t('historyDialog.noPayments')}</p>
            )}
            {historyPreview?.dates?.map((date) => {
              const key = date.toISOString();
              return (
                <label key={key} className='flex items-center gap-3 text-sm'>
                  <Checkbox
                    checked={!!selectedHistoryDates[key]}
                    onCheckedChange={(checked) => setSelectedHistoryDates((prev) => ({ ...prev, [key]: !!checked }))}
                  />
                  <span>{new Intl.DateTimeFormat(user.language || 'en', { dateStyle: 'medium', timeStyle: 'short', timeZone: historyPreview.values.timezone }).format(date)}</span>
                </label>
              );
            })}
          </div>
          <ResponsiveDialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setHistoryPreview(null)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type='button'
              onClick={() => {
                const confirmed = historyPreview.dates
                  .filter((d) => selectedHistoryDates[d.toISOString()])
                  .map((d) => new Date(d.getTime()));
                const values = historyPreview.values;
                setHistoryPreview(null);
                submitSubscription(values, confirmed);
              }}
            >
              {t('historyDialog.confirm')}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Form>
  )
}

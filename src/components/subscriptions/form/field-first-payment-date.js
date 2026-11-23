'use client';

import { useTranslations } from 'next-intl';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

export const FormFieldFirstPaymentDate = ({ field }) => {
  const t = useTranslations('components.subscriptions.form.fields.firstPaymentDate');

  return (
    <FormItem className='flex flex-col'>
      <FormLabel>{t('label')}</FormLabel>
      <FormControl>
        <DateTimePicker
          clearable
          value={field.value ?? undefined}
          onChange={(value) => field.onChange(value ?? null)}
        />
      </FormControl>
      <FormMessage />
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
    </FormItem>
  )
}

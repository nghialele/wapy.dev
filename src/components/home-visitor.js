'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/components/config';

export const HomeVisitor = () => {
  const t = useTranslations('home.visitor');
  return (
    <div className='flex flex-col grow mx-auto gap-24 w-full justify-center items-center'>
      {/* Hero Section */}
      <div className='flex flex-col items-center text-center gap-6'>
        <p className='eyebrow'>{t('hero.badge')}</p>
        <h1 className='text-3xl md:text-6xl font-bold tracking-tight'>
          {t('hero.title')}
        </h1>
        <h2 className='text-xl text-muted-foreground-light max-w-4xl'>
          {t('hero.subtitle', { appName: siteConfig.name })}
        </h2>
        <h3 className='text-xl text-muted-foreground-light font-semibold max-w-4xl'>
          {t('hero.tagline')}
        </h3>
        <div className='w-full max-w-3xl rounded-lg border bg-card p-6 text-left sm:p-8'>
          <p className='eyebrow'>{t('free.eyebrow')}</p>
          <h2 className='mt-4 text-2xl font-bold'>{t('free.title')}</h2>
          <p className='mt-3 text-muted-foreground'>{t('free.description')}</p>
          <div className='mt-4 flex items-baseline gap-2'>
            <span className='text-4xl font-bold'>{t('free.price')}</span>
            <span className='text-sm text-muted-foreground'>{t('free.period')}</span>
          </div>
          <ul className='mt-6 grid gap-2 text-sm sm:grid-cols-2'>
            {['unlimited', 'notifications', 'reports', 'export', 'noAds', 'bestEffort'].map((key) => (
              <li key={key} className='flex items-center gap-2'>
                <Icons.check className='size-4 shrink-0 text-primary' />
                <span>{t(`free.features.${key}`)}</span>
              </li>
            ))}
          </ul>
          <div className='mt-6 flex flex-wrap items-center gap-3'>
            <Button asChild><Link href='/login'>{t('free.button')}</Link></Button>
            <Button variant='outline' asChild>
              <Link href={siteConfig.links.github} target='_blank' rel='noopener noreferrer'>{t('free.selfHostButton')}</Link>
            </Button>
          </div>
          <p className='mt-4 text-sm text-muted-foreground'>{t('free.selfHostNote')}</p>
        </div>
        <Image src='/images/banner.png' alt={t('hero.imageAlt')} width={960} height={600} />
      </div>

      <div className='flex flex-col gap-6'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold mb-4'>{t('features.title')}</h2>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            {t('features.subtitle')}
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='p-6 rounded-lg border bg-card shadow-lg'>
            <div className='flex flex-col items-center gap-4 mb-4'>
              <Icons.repeat className='size-5 text-primary' />
              <h3 className='font-semibold text-xl'>{t('features.billingCycles.title')}</h3>
            </div>
            <p className='text-muted-foreground'>
              {t('features.billingCycles.description')}
            </p>
          </div>

          <div className='p-6 rounded-lg border bg-card shadow-lg'>
            <div className='flex flex-col items-center gap-4 mb-4'>
              <Icons.bell className='size-5 text-primary' />
              <h3 className='font-semibold text-xl'>{t('features.notifications.title')}</h3>
            </div>
            <p className='text-muted-foreground'>
              {t('features.notifications.description')}
            </p>
          </div>

          <div className='p-6 rounded-lg border bg-card shadow-lg'>
            <div className='flex flex-col items-center gap-4 mb-4'>
              <Icons.pieChart className='size-5 text-primary' />
              <h3 className='font-semibold text-xl'>{t('features.reports.title')}</h3>
            </div>
            <p className='text-muted-foreground'>
              {t('features.reports.description')}
            </p>
          </div>

          <div className='p-6 rounded-lg border bg-card shadow-lg'>
            <div className='flex flex-col items-center gap-4 mb-4'>
              <Icons.currency className='size-5 text-primary' />
              <h3 className='font-semibold text-xl'>{t('features.currencies.title')}</h3>
            </div>
            <p className='text-muted-foreground'>
              {t('features.currencies.description')}
            </p>
          </div>

          <div className='p-6 rounded-lg border bg-card shadow-lg'>
            <div className='flex flex-col items-center gap-4 mb-4'>
              <Icons.globe className='size-5 text-primary' />
              <h3 className='font-semibold text-xl'>{t('features.timezone.title')}</h3>
            </div>
            <p className='text-muted-foreground'>
              {t('features.timezone.description')}
            </p>
          </div>

          <div className='p-6 rounded-lg border bg-card shadow-lg'>
            <div className='flex flex-col items-center gap-4 mb-4'>
              <Icons.tag className='size-5 text-primary' />
              <h3 className='font-semibold text-xl'>{t('features.categories.title')}</h3>
            </div>
            <p className='text-muted-foreground'>
              {t('features.categories.description')}
            </p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-6'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold mb-4'>{t('howItWorks.title')}</h2>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            {t('howItWorks.subtitle')}
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='text-center space-y-4'>
            <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold'>
              1
            </div>
            <h3 className='font-semibold text-xl'>{t('howItWorks.step1.title')}</h3>
            <p className='text-muted-foreground'>
              {t('howItWorks.step1.description')}
            </p>
          </div>
          <div className='text-center space-y-4'>
            <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold'>
              2
            </div>
            <h3 className='font-semibold text-xl'>{t('howItWorks.step2.title')}</h3>
            <p className='text-muted-foreground'>
              {t('howItWorks.step2.description')}
            </p>
          </div>
          <div className='text-center space-y-4'>
            <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold'>
              3
            </div>
            <h3 className='font-semibold text-xl'>{t('howItWorks.step3.title')}</h3>
            <p className='text-muted-foreground'>
              {t('howItWorks.step3.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

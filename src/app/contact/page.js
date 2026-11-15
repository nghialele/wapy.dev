import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/components/config';
import { Icons } from '@/components/icons';

const COMING_SOON = ['Signal', 'Telegram', 'Discord'];

export default async function PageContact() {
  const t = await getTranslations('pages.contact');

  return (
    <div className='flex flex-col grow justify-center items-center gap-8 max-w-md w-full'>
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('description')}</p>
      </div>

      <a
        href={`https://matrix.to/#/${t('matrix.handle')}`}
        className='w-full flex items-center gap-3 rounded-lg border bg-card p-4 text-left hover:bg-accent transition-colors'
        target='_blank'
        rel='noopener noreferrer'
      >
        <Icons.matrix className='size-5 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='text-sm font-medium'>{t('matrix.label')}</p>
          <p className='text-sm text-muted-foreground truncate'>{t('matrix.handle')}</p>
        </div>
      </a>

      <div className='w-full text-center'>
        <p className='eyebrow'>{t('moreChannels.title')}</p>
        <div className='mt-3 flex flex-wrap items-center justify-center gap-2'>
          {COMING_SOON.map((channel) => (
            <span
              key={channel}
              className='inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground'
            >
              {channel}
            </span>
          ))}
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>{t('moreChannels.note')}</p>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations('common');

  return {
    title: t('contact'),
  };
}

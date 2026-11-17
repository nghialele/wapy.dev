'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth, authClient } from '@/lib/auth-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Icons } from '@/components/icons';
import { siteConfig } from '@/components/config';


const SecurityCard = ({ user }) => {
  const t = useTranslations('pages.account.security');
  const { refetch } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [totpURI, setTotpURI] = useState(null);
  const [backupCodes, setBackupCodes] = useState(null);
  const [codesSaved, setCodesSaved] = useState(false);
  const [code, setCode] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);
  const backupCodesRef = useRef(null);

  const twoFactorEnabled = !!user?.twoFactorEnabled;

  const startEnable = async () => {
    setIsPending(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({ method: 'totp', issuer: siteConfig.name });
      if (error || !data) {
        toast.error(t('error'));
        return;
      }
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);
      setCodesSaved(false);
      setCode('');
      setSetupOpen(true);
    } catch {
      toast.error(t('error'));
    } finally {
      setIsPending(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error(t('invalidCode'));
      return;
    }
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        toast.error(t('invalidCode'));
        return;
      }
      setSetupOpen(false);
      setTotpURI(null);
      setBackupCodes(null);
      await refetch();
      toast.success(t('enabled'));
    } catch {
      toast.error(t('error'));
    } finally {
      setIsPending(false);
    }
  };

  const confirmDisable = async () => {
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.disable({});
      if (error) {
        toast.error(t('error'));
        return;
      }
      setDisableOpen(false);
      await refetch();
      toast.success(t('disabled'));
    } catch {
      toast.error(t('error'));
    } finally {
      setIsPending(false);
    }
  };

  const copyBackupCodes = () => {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success(t('copied'));
  };

  if (twoFactorEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.shieldCheck className='size-5 text-primary' />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('enabledDescription')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant='outline'
            onClick={() => setDisableOpen(true)}
            disabled={isPending}
          >
            {isPending
              ? <Icons.spinner className='me-2 size-4 animate-spin' />
              : <Icons.shieldOff className='me-2 size-4' />
            }
            {t('disableButton')}
          </Button>
        </CardFooter>

        <ResponsiveDialog open={disableOpen} onOpenChange={setDisableOpen}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{t('disableTitle')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('disableDescription')}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogFooter>
              <Button variant='outline' onClick={() => setDisableOpen(false)} disabled={isPending}>
                {t('cancel')}
              </Button>
              <Button variant='destructive' onClick={confirmDisable} disabled={isPending}>
                {isPending && <Icons.spinner className='me-2 size-4 animate-spin' />}
                {t('disableButton')}
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.shieldCheck className='size-5 text-primary' />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          onClick={startEnable}
          disabled={isPending || setupOpen}
        >
          {isPending
            ? <Icons.spinner className='me-2 size-4 animate-spin' />
            : <Icons.shieldCheck className='me-2 size-4' />
          }
          {t('enableButton')}
        </Button>
      </CardFooter>

      <ResponsiveDialog open={setupOpen} onOpenChange={(open) => {
        if (!open && !codesSaved && backupCodes) return;
        setSetupOpen(open);
        if (!open) {
          setTotpURI(null);
          setBackupCodes(null);
          setCode('');
        }
      }}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('setupTitle')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('setupDescription')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className='space-y-4'>
            {totpURI && (
              <div className='flex flex-col items-center gap-2'>
                <QRCodeSVG value={totpURI} size={180} />
                <button
                  type='button'
                  onClick={() => navigator.clipboard.writeText(totpURI)}
                  className='text-xs text-muted-foreground underline break-all text-center'
                >
                  {t('copyUri')}
                </button>
              </div>
            )}
            {backupCodes && (
              <div className='space-y-2'>
                <Label>{t('backupCodes')}</Label>
                <div ref={backupCodesRef} className='grid grid-cols-2 gap-1 rounded-md border p-3 font-mono text-sm'>
                  {backupCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <Button variant='outline' size='sm' onClick={copyBackupCodes}>
                  <Icons.copy className='me-2 size-4' />
                  {t('copyCodes')}
                </Button>
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='totp-code'>{t('codeLabel')}</Label>
              <Input
                id='totp-code'
                inputMode='numeric'
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder='123456'
                disabled={isPending}
              />
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                if (backupCodes && !codesSaved) return;
                setSetupOpen(false);
                setTotpURI(null);
                setBackupCodes(null);
                setCode('');
              }}
              disabled={isPending || (!!backupCodes && !codesSaved)}
            >
              {t('cancel')}
            </Button>
            <div className='flex items-center gap-2'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={codesSaved}
                  onChange={(e) => setCodesSaved(e.target.checked)}
                  disabled={isPending}
                />
                {t('savedCodes')}
              </label>
            </div>
            <Button onClick={verifyCode} disabled={isPending || code.length !== 6}>
              {isPending && <Icons.spinner className='me-2 size-4 animate-spin' />}
              {t('verifyButton')}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Card>
  );
};

export { SecurityCard };

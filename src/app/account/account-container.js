'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslations, useFormatter } from 'next-intl';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserLoadDefaultCategories,
  UserRemoveCategory,
  UserSaveCategory,
  UserLoadDefaultPaymentMethods,
  UserRemovePaymentMethod,
  UserSavePaymentMethod,
  UserUpdateTimezone,
  UserUpdateCurrency,
  UserUpdateNotifications,
  UserUpdateName,
  UserExportData,
  UserSaveNtfy,
  UserTestNtfy,
  UserSaveWebhook,
  UserTestWebhook,
  UserSaveDiscord,
  UserTestDiscord,
  UserSaveSlack,
  UserTestSlack,
} from './actions';
import {
  SchemaCategory,
  SchemaPaymentMethod,
  SchemaUserNotifications,
  SchemaNtfyService,
  SchemaWebhookService,
  SchemaDiscordService,
  SchemaSlackService,
} from './schema';
import { DefaultColors } from '@/config/colors';
import { CurrencyFieldManager } from '@/components/subscriptions/form/field-currency';
import { TimezoneFieldManager } from '@/components/subscriptions/form/field-timezone';
import { NotificationsFieldManager } from '@/components/subscriptions/form/field-notifications';
import { cn } from '@/lib/utils';
import { LogoIcon, IconPicker } from '@/components/ui/icon-picker';

const TimezoneManager = ({ user }) => {
  const t = useTranslations('pages.account.defaultSettings.timezone');
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone);
  const [loading, setLoading] = useState(false);

  const handleTimezoneChange = async (value) => {
    try {
      setLoading(true);
      setSelectedTimezone(value);
      const { success } = await UserUpdateTimezone(value);
      if (success) {
        toast.success(t('success'));
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Label>{t('label')}</Label>
      <TimezoneFieldManager field={{ value: selectedTimezone, onChange: handleTimezoneChange }} loading={loading} />
    </div>
  );
};

const CurrencyManager = ({ user }) => {
  const t = useTranslations('pages.account.defaultSettings.currency');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'EUR');
  const [loading, setLoading] = useState(false);

  const handleCurrencyChange = async (currency) => {
    try {
      setLoading(true);
      setSelectedCurrency(currency);
      const { success } = await UserUpdateCurrency(currency);
      if (success) {
        toast.success(t('success'));
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Label>{t('label')}</Label>
      <CurrencyFieldManager field={{ value: selectedCurrency, onChange: handleCurrencyChange }} loading={loading} />
    </div>
  );
};

const DefaultSettings = ({ user }) => {
  const t = useTranslations('pages.account.defaultSettings');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <TimezoneManager user={user} />
        <CurrencyManager user={user} />
      </CardContent>
    </Card>
  );
};

const NotificationManager  = ({user, externalServices}) => {
  const t = useTranslations('pages.account.notifications');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(user?.notifications);

  const handleSave = async () => {
    try {
      setLoading(true);
      const validated = SchemaUserNotifications.parse(notifications);
      if (!validated) {
        throw new Error('Invalid notifications data');
      }
      const { success } = await UserUpdateNotifications(notifications);
      if (success) {
        toast.success(t('success'));
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const field = { value: notifications, onChange: (notifications) => {
    setNotifications(notifications);
  } };

  return (
    <NotificationsFieldManager field={field} externalServices={externalServices} isLoading={loading} >
      <Button
        onClick={handleSave}
        className='w-full sm:w-auto'
        disabled={loading}
        title={t('saveButtonTitle')}
      >
        <Icons.save />
        {t('saveButton')}
      </Button>
    </NotificationsFieldManager>
  );
};

const UserProfile = ({ user }) => {
  const t = useTranslations('pages.account.profile');
  const tCommon = useTranslations('common');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || user.email.split('@')[0] || '');
  const [loading, setLoading] = useState(false);
  const formatter = useFormatter();

  const handleSave = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { success } = await UserUpdateName(name);
      if (success) {
        setIsEditing(false);
        toast.success(t('success'));
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 text-2xl font-bold tracking-tight'>
          <Avatar className='size-20 border-2 border-primary'>
            <AvatarImage src={user.image} alt={name} />
            <AvatarFallback className='bg-primary/10 text-2xl'>{name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col items-center sm:items-start w-full'>
            {isEditing ? (
              <div className='flex flex-col sm:flex-row items-center gap-2 w-full'>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('namePlaceholder')}
                  className='w-full font-normal'
                  disabled={loading}
                />
                <div className='flex gap-2 w-full sm:w-auto justify-center'>
                  <Button
                    onClick={handleSave}
                    size='sm'
                    className='w-full sm:w-auto'
                    disabled={loading}
                    title={tCommon('save')}
                  >
                    {loading ? (
                      <Icons.spinner className='animate-spin' />
                    ) : (
                      <Icons.save />
                    )}
                    {tCommon('save')}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant='outline'
                    size='sm'
                    className='w-full sm:w-auto'
                    disabled={loading}
                    title={tCommon('cancel')}
                  >
                    <Icons.x />
                    {tCommon('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-center sm:justify-start gap-2 w-full'>
                <span className='line-clamp-1 break-all text-center sm:text-left'>
                  {name || t('addNamePrompt')}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsEditing(true)}
                  title={tCommon('edit')}
                >
                  <Icons.edit />
                </Button>
              </div>
            )}
            <div className='flex flex-col gap-2 mt-2 w-full'>
              <div className='text-sm text-muted-foreground flex items-center gap-2 text-left'>
                <Icons.mail className='size-4 shrink-0' />
                <span className='truncate'>{user.email}</span>
              </div>
              <div className='text-sm text-muted-foreground flex items-center gap-2 text-left'>
                <Icons.calendar className='size-4 shrink-0' />
                <span className='line-clamp-2 wrap-break-word'>
                  {t('memberSince', {
                    date: formatter.dateTime(user.createdAt, 'short'),
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

const CategorySkeleton = () => (
  <div className='flex items-center justify-start gap-2 px-4 py-2 border rounded-md'>
    <Skeleton className='size-4 rounded-full' />
    <Skeleton className='w-64 h-5 my-0.5' />
  </div>
);

const CategorySkeletons = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <CategorySkeleton key={index} />
    ))}
  </>
);

const CategoryItemEdit = ({ name, color, onCancel, onSave, onDelete }) => {
  const t = useTranslations('pages.account.categories');
  const tCommon = useTranslations('common');
  const [editedColor, setEditedColor] = useState(color);
  const [editedName, setEditedName] = useState(name);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className='flex flex-col sm:flex-row items-start justify-between gap-2 w-full'>
      <div className='flex items-center gap-2 w-full'>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='ghost'
              className='p-2'
              title={t('selectColor')}
            >
              <div
                className='size-6 rounded-full'
                style={{ backgroundColor: editedColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-40'>
            <div className='grid grid-cols-3 gap-4'>
              {Object.values(DefaultColors).map((c, i) => (
                <Button
                  key={i}
                  className={`size-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                    editedColor === c ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setEditedColor(c)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          className='flex-1'
          placeholder={t('namePlaceholder')}
        />
      </div>
      <div className='flex items-center gap-2 w-full sm:w-auto'>
        <Button
          onClick={onCancel}
          variant='outline'
          size='icon'
          className='flex-1 sm:flex-none'
          title={tCommon('cancel')}
        >
          <Icons.x className='size-4' />
        </Button>
        <Button
          onClick={() => onSave(editedName, editedColor)}
          size='icon'
          className='flex-1 sm:flex-none'
          title={tCommon('save')}
        >
          <Icons.save className='size-4' />
        </Button>
        <Button
          onClick={() => setDialogOpen(true)}
          variant='destructive'
          size='icon'
          className='flex-1 sm:flex-none'
          title={tCommon('delete')}
        >
          <Icons.trash className='size-4' />
        </Button>
      </div>
      <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('delete.title')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription className='text-left'>
              {t('delete.description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialogOpen(false)}
              title={tCommon('cancel')}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={() => {setDialogOpen(false); onDelete();}}
              variant='destructive'
              title={tCommon('delete')}
            >
              {tCommon('delete')}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
};

const CategoryItem = ({ category, onSave, onDelete, edit = false }) => {
  const t = useTranslations('pages.account.categories');
  const [editingName, setEditingName] = useState(category.name);
  const [editingColor, setEditingColor] = useState(category.color);
  const [isEditing, setIsEditing] = useState(edit);
  const [isSkeleton, setIsSkeleton] = useState(false);

  const handleDoubleClick = () => {
    setEditingName(category.name);
    setEditingColor(category.color);
    setIsEditing(true);
  };

  const handleSave = async (name, color) => {
    const validatedData = SchemaCategory.parse({ name: name, color: color });
    if (!validatedData) {
      toast.error(t('invalid'));
      return;
    }

    setIsSkeleton(true);
    setEditingName(name);
    setEditingColor(color);
    const updated = await onSave({ ...category, ...validatedData });
    if (updated) {
      setIsEditing(false);
    }
    setIsSkeleton(false);
  };

  const handleDelete = () => {
    setIsEditing(false);
    setIsSkeleton(true);
    onDelete(category, category?.temporaryId ? false : true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsSkeleton(false);
    if (category?.temporaryId) {
      onDelete(category, false);
    }
  };

  if (isSkeleton) {
    return <CategorySkeleton />;
  }

  return (
    <div className='group relative flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors'>
      {isEditing ? (
        <CategoryItemEdit
          color={editingColor}
          name={editingName}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      ) : (
        <>
          <div className='flex items-center gap-3 text-sm'>
            <div
              className='size-6 rounded-full flex-none ring-1 ring-border transition-transform group-hover:scale-110'
              style={{ backgroundColor: category.color }}
            />
            <span className='line-clamp-2 break-all'>{category.name}</span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleDoubleClick}
            title={t('edit')}
          >
            <Icons.edit />
            <span className='sr-only'>{t('edit')}</span>
          </Button>
        </>
      )}
    </div>
  );
};

const CategoryManager = ({ user }) => {
  const t = useTranslations('pages.account.categories');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(user.categories ? [...user.categories] : []);

  const loadDefaultCategories = async () => {
    try {
      setLoading(true);
      await UserLoadDefaultCategories().then((defaultCategories) => {
        setCategories([...categories, ...defaultCategories]);
        setLoading(false);
        toast.success(t('default.success'));
      });
    } catch (error) {
      toast.error(t('default.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category, isToast = true) => {
    try {
      if (category?.temporaryId) {
        setCategories(categories.filter((c) => c.temporaryId !== category.temporaryId));
      } else {
        await UserRemoveCategory(category.id).then((deletedCategory) => {
          setCategories(categories.filter((c) => c.id !== deletedCategory.id));
        });
      }
      if (isToast) {
        toast.success(t('delete.success'));
      }
    } catch (error) {
      toast.error(t('delete.error'));
    }
  };

  const handleSave = async (category) => {
    try {
      await UserSaveCategory(category).then((updatedCategory) => {
        setCategories(categories.map((c) => {
          if (c?.temporaryId && c?.temporaryId === category?.temporaryId) {
            return updatedCategory;
          }
          return c.id === updatedCategory.id ? updatedCategory : c;
        }));
      });
      toast.success(t('save.success'));
      return true;
    } catch (error) {
      toast.error(t('save.error'));
    }

    return false;
  };

  const handleAdd = async () => {
    setCategories([...categories, {
      id: null,
      temporaryId: Math.random().toString(16) + '0'.repeat(16) + Date.now().toString(16),
      name: '',
      color: '#9E9E9E'
    }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {loading && <CategorySkeletons />}
        {!loading && categories.map((category) => (
          <CategoryItem key={category.id ? category.id : category.temporaryId} category={category} onSave={handleSave} onDelete={handleDelete} edit={category?.temporaryId} />
        ))}
      </CardContent>
      <CardFooter className='gap-2 flex-col sm:flex-row justify-start items-start sm:items-center'>
        <Button disabled={loading} onClick={handleAdd} title={t('addButtonTitle')} className='w-full sm:w-auto'>
          <Icons.add />
          {tCommon('add')}
        </Button>
        <Button disabled={loading} onClick={loadDefaultCategories} variant='outline' title={t('default.load')} className='w-full sm:w-auto whitespace-normal h-auto min-h-9'>
          <Icons.categories />
          {t('default.load')}
        </Button>
      </CardFooter>
    </Card>
  );
};

const PaymentMethodSkeleton = () => (
  <div className='flex items-center justify-start gap-2 px-4 py-2 border rounded-md'>
    <Skeleton className='size-4 rounded-full' />
    <Skeleton className='w-64 h-5 my-0.5' />
  </div>
);

const PaymentMethodSkeletons = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <PaymentMethodSkeleton key={index} />
    ))}
  </>
);

const PaymentMethodItemEdit = ({ name, icon, onCancel, onSave, onDelete }) => {
  const t = useTranslations('pages.account.paymentMethods');
  const tCommon = useTranslations('common');
  const [editedIcon, setEditedIcon] = useState(icon);
  const [editedName, setEditedName] = useState(name);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className='flex flex-col items-start w-full gap-2'>
      <div className='w-full'>
        <IconPicker
          icon={icon}
          onChange={(c) => setEditedIcon(c)}
        />
      </div>

      <div className='flex flex-col sm:flex-row items-start justify-between gap-2 w-full'>
        <div className='flex items-center gap-2 w-full'>
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className='flex-1'
            placeholder={t('placeholder')}
          />
        </div>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <Button
            onClick={onCancel}
            variant='outline'
            size='icon'
            className='flex-1 sm:flex-none'
            title={tCommon('cancel')}
          >
            <Icons.x className='size-4' />
          </Button>
          <Button
            onClick={() => onSave(editedName, editedIcon)}
            size='icon'
            className='flex-1 sm:flex-none'
            title={tCommon('save')}
          >
            <Icons.save className='size-4' />
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            variant='destructive'
            size='icon'
            className='flex-1 sm:flex-none'
            title={tCommon('delete')}
          >
            <Icons.trash className='size-4' />
          </Button>
        </div>
        <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{t('delete.title')}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription className='text-left'>
                {t('delete.description')}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogFooter>
              <Button
                variant='outline'
                onClick={() => setDialogOpen(false)}
                title={tCommon('cancel')}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={() => {setDialogOpen(false); onDelete();}}
                variant='destructive'
                title={tCommon('delete')}
              >
                {tCommon('delete')}
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>
    </div>
  );
};

const PaymentMethodItem = ({ paymentMethod, onSave, onDelete, edit = false }) => {
  const t = useTranslations('pages.account.paymentMethods');
  const [editingName, setEditingName] = useState(paymentMethod.name);
  const [editingIcon, setEditingIcon] = useState(paymentMethod.icon);
  const [isEditing, setIsEditing] = useState(edit);
  const [isSkeleton, setIsSkeleton] = useState(false);

  const handleDoubleClick = () => {
    setEditingName(paymentMethod.name);
    setEditingIcon(paymentMethod.icon);
    setIsEditing(true);
  };

  const handleSave = async (name, icon) => {
    const validatedData = SchemaPaymentMethod.parse({ name: name, icon: icon });
    if (!validatedData) {
      toast.error(t('invalid'));
      return;
    }

    setIsSkeleton(true);
    setEditingName(name);
    setEditingIcon(icon);
    const updated = await onSave({ ...paymentMethod, ...validatedData });
    if (updated) {
      setIsEditing(false);
    }
    setIsSkeleton(false);
  };

  const handleDelete = () => {
    setIsEditing(false);
    setIsSkeleton(true);
    onDelete(paymentMethod, paymentMethod?.temporaryId ? false : true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsSkeleton(false);
    if (paymentMethod?.temporaryId) {
      onDelete(paymentMethod, false);
    }
  };

  if (isSkeleton) {
    return <PaymentMethodSkeleton />;
  }

  return (
    <div className='group relative flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors'>
      {isEditing ? (
        <PaymentMethodItemEdit
          icon={editingIcon}
          name={editingName}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      ) : (
        <>
          <div className='flex items-center gap-3 text-sm'>
            <LogoIcon icon={paymentMethod.icon ? JSON.parse(paymentMethod.icon) : false} placeholder className='size-6' />
            <span className='line-clamp-2 break-all'>{paymentMethod.name}</span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleDoubleClick}
            title={t('edit')}
          >
            <Icons.edit />
            <span className='sr-only'>{t('edit')}</span>
          </Button>
        </>
      )}
    </div>
  );
};

const PaymentMethodManager = ({ user }) => {
  const t = useTranslations('pages.account.paymentMethods');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(user.paymentMethods ? [...user.paymentMethods] : []);

  const loadDefaultPaymentMethods = async () => {
    try {
      setLoading(true);
      await UserLoadDefaultPaymentMethods().then((defaultPaymentMethods) => {
        setPaymentMethods([...paymentMethods, ...defaultPaymentMethods]);
        setLoading(false);
        toast.success(t('load.success'));
      });
    } catch (error) {
      toast.error(t('load.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentMethod, isToast = true) => {
    try {
      if (paymentMethod?.temporaryId) {
        setPaymentMethods(paymentMethods.filter((c) => c.temporaryId !== paymentMethod.temporaryId));
      } else {
        await UserRemovePaymentMethod(paymentMethod.id).then((deletedPaymentMethod) => {
          setPaymentMethods(paymentMethods.filter((c) => c.id !== deletedPaymentMethod.id));
        });
      }
      if (isToast) {
        toast.success(t('delete.success'));
      }
    } catch (error) {
      toast.error(t('delete.error'));
    }
  };

  const handleSave = async (paymentMethod) => {
    try {
      await UserSavePaymentMethod(paymentMethod).then((updatedPaymentMethod) => {
        setPaymentMethods(paymentMethods.map((c) => {
          if (c?.temporaryId && c?.temporaryId === paymentMethod?.temporaryId) {
            return updatedPaymentMethod;
          }
          return c.id === updatedPaymentMethod.id ? updatedPaymentMethod : c;
        }));
      });
      toast.success(t('save.success'));
      return true;
    } catch (error) {
      toast.error(t('save.error'));
    }

    return false;
  };

  const handleAdd = async () => {
    setPaymentMethods([...paymentMethods, {
      id: null,
      temporaryId: Math.random().toString(16) + '0'.repeat(16) + Date.now().toString(16),
      name: '',
      color: '#9E9E9E'
    }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {loading && <PaymentMethodSkeletons />}
        {!loading && paymentMethods.map((paymentMethod) => (
          <PaymentMethodItem key={paymentMethod.id ? paymentMethod.id : paymentMethod.temporaryId} paymentMethod={paymentMethod} onSave={handleSave} onDelete={handleDelete} edit={paymentMethod?.temporaryId} />
        ))}
      </CardContent>
      <CardFooter className='gap-2 flex-col sm:flex-row justify-start items-start sm:items-center'>
        <Button disabled={loading} onClick={handleAdd} title={t('add')} className='w-full sm:w-auto'>
          <Icons.add />
          {tCommon('add')}
        </Button>
        <Button
          disabled={loading}
          onClick={loadDefaultPaymentMethods}
          variant='outline'
          title={t('load.title')}
          className='w-full sm:w-auto whitespace-normal h-auto min-h-9'
        >
          <Icons.paymentMethods />
          {t('load.title')}
        </Button>
      </CardFooter>
    </Card>
  );
};

const ExternalServiceNtfy = ( {ntfy, onUpdate} ) => {
  const t = useTranslations('pages.account.externalServices.ntfy');
  const [ntfyEnabled, setNtfyEnabled] = useState(ntfy?.enabled || false);
  const [ntfyServerUrl, setNtfyServerUrl] = useState(ntfy?.url || '');
  const [ntfyTopic, setNtfyTopic] = useState(ntfy?.topic || 'sub-idler-me');
  const [ntfyAccessToken, setNtfyAccessToken] = useState(ntfy?.token || '');
  const [ntfyLoading, setNtfyLoading] = useState(false);

  const handleToggle = async (checked) => {
    if (!checked) {
      setNtfyLoading(true);
      try {
        const { success } = await UserSaveNtfy({ enabled: false });
        if (success) {
          setNtfyEnabled(false);
          toast.success(t('toast.disable.success'));
          onUpdate?.({ enabled: false });
        } else {
          toast.error(t('toast.disable.error'));
        }
      } catch (error) {
        toast.error(t('toast.disable.error'));
      } finally {
        setNtfyLoading(false);
      }
    } else {
      // If enabling, just update state - save happens on Save button click
      setNtfyEnabled(true);
    }
  };

  const handleSave = async () => {
    setNtfyLoading(true);

    try {
      if (!ntfyEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaNtfyService.safeParse({
        enabled: ntfyEnabled,
        url: ntfyServerUrl,
        topic: ntfyTopic,
        ...(ntfyAccessToken ? { token: ntfyAccessToken } : {}),
      });
      if (!result.success) {
        throw new Error(t('toast.invalidParams'));
      }

      const { success } = await UserSaveNtfy(result.data);

      if (success) {
        toast.success(t('toast.save.success'));
        onUpdate?.(result.data);
      } else {
        toast.error(t('toast.save.error'));
      }
    } catch (error) {
      toast.error(t('toast.save.error'));
    } finally {
      setNtfyLoading(false);
    }
  };

  const handleTest = async () => {
    setNtfyLoading(true);

    try {
      if (!ntfyEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaNtfyService.safeParse({
        enabled: ntfyEnabled,
        url: ntfyServerUrl,
        topic: ntfyTopic,
        ...(ntfyAccessToken ? { token: ntfyAccessToken } : {}),
      });
      if (!result.success) {
        throw new Error(t('toast.testInvalidParams'));
      }

      const { success } = await UserTestNtfy(result.data);

      if (success) {
        toast.success(t('toast.test.success'));
      } else {
        toast.error(t('toast.test.error'));
      }
    } catch (error) {
      toast.error(t('toast.test.error'));
    } finally {
      setNtfyLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex gap-3 flex-1'>
            <div className='space-y-1'>
              <CardTitle className='flex items-center gap-2'>
                <Switch
                  checked={ntfyEnabled}
                  onCheckedChange={handleToggle}
                  disabled={ntfyLoading}
                  className='shrink-0'
                />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
          </div>
          <Icons.ntfy className='size-8 shrink-0'/>
        </div>
      </CardHeader>

      {ntfyEnabled && (
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='ntfy-server-url'>{t('fields.serverUrl.label')}</Label>
            <Input
              id='ntfy-server-url'
              value={ntfyServerUrl}
              onChange={(e) => setNtfyServerUrl(e.target.value)}
              placeholder={t('fields.serverUrl.placeholder')}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='ntfy-topic-name'>{t('fields.topic.label')}</Label>
            <Input
              id='ntfy-topic-name'
              value={ntfyTopic}
              onChange={(e) => setNtfyTopic(e.target.value)}
              placeholder='sub-idler-me'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='ntfy-access-token'>{t('fields.token.label')}</Label>
            <Input
              id='ntfy-access-token'
              type='password'
              value={ntfyAccessToken}
              onChange={(e) => setNtfyAccessToken(e.target.value)}
              placeholder={t('fields.token.placeholder')}
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-4 w-full'>
            <Button onClick={handleSave} disabled={ntfyLoading} className='w-full sm:w-auto'>
              {ntfyLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.save className='me-2' />
              )}
              {t('buttons.save')}
            </Button>
            <Button onClick={handleTest} variant='secondary' disabled={ntfyLoading} className='w-full text-left sm:w-auto'>
              {ntfyLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.send className='me-2' />
              )}
              {t('buttons.test')}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const ExternalServiceWebhook = ( {webhook, onUpdate} ) => {
  const t = useTranslations('pages.account.externalServices.webhook');
  const [webhookEnabled, setWebhookEnabled] = useState(webhook?.enabled || false);
  const [webhookUrl, setWebhookUrl] = useState(webhook?.url || '');
  const [webhookLoading, setWebhookLoading] = useState(false);

  const handleToggle = async (checked) => {
    if (!checked) {
      setWebhookLoading(true);
      try {
        const { success } = await UserSaveWebhook({ enabled: false });
        if (success) {
          setWebhookEnabled(false);
          toast.success(t('toast.disable.success'));
          onUpdate?.({ enabled: false });
        } else {
          toast.error(t('toast.disable.error'));
        }
      } catch (error) {
        toast.error(t('toast.disable.error'));
      } finally {
        setWebhookLoading(false);
      }
    } else {
      // If enabling, just update state - save happens on Save button click
      setWebhookEnabled(true);
    }
  };

  const handleSave = async () => {
    setWebhookLoading(true);

    try {
      if (!webhookEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaWebhookService.safeParse({
        enabled: webhookEnabled,
        url: webhookUrl,
      });
      if (!result.success) {
        throw new Error(t('toast.invalidParams'));
      }

      const { success } = await UserSaveWebhook(result.data);

      if (success) {
        toast.success(t('toast.save.success'));
        onUpdate?.(result.data);
      } else {
        toast.error(t('toast.save.error'));
      }
    } catch (error) {
      toast.error(t('toast.save.error'));
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleTest = async () => {
    setWebhookLoading(true);

    try {
      if (!webhookEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaWebhookService.safeParse({
        enabled: webhookEnabled,
        url: webhookUrl,
      });
      if (!result.success) {
        throw new Error(t('toast.testInvalidParams'));
      }

      const { success } = await UserTestWebhook(result.data);

      if (success) {
        toast.success(t('toast.test.success'));
      } else {
        toast.error(t('toast.test.error'));
      }
    } catch (error) {
      toast.error(t('toast.test.error'));
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex gap-3 flex-1'>
            <div className='space-y-1'>
              <CardTitle className='flex items-center gap-2'>
                <Switch
                  checked={webhookEnabled}
                  onCheckedChange={handleToggle}
                  disabled={webhookLoading}
                  className='shrink-0'
                />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
          </div>
          <Icons.webhook className='size-8 shrink-0'/>
        </div>
      </CardHeader>

      {webhookEnabled && (
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='webhook-server-url'>{t('fields.url.label')}</Label>
            <Input
              id='webhook-server-url'
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder={t('fields.url.placeholder')}
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-4 w-full'>
            <Button onClick={handleSave} disabled={webhookLoading} className='w-full sm:w-auto'>
              {webhookLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.save className='me-2' />
              )}
              {t('buttons.save')}
            </Button>
            <Button onClick={handleTest} variant='secondary' disabled={webhookLoading} className='w-full text-left sm:w-auto'>
              {webhookLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.send className='me-2' />
              )}
              {t('buttons.test')}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const ExternalServiceDiscord = ( {discord, onUpdate} ) => {
  const t = useTranslations('pages.account.externalServices.discord');
  const [discordEnabled, setDiscordEnabled] = useState(discord?.enabled || false);
  const [discordUrl, setDiscordUrl] = useState(discord?.url || '');
  const [discordLoading, setDiscordLoading] = useState(false);

  const handleToggle = async (checked) => {
    if (!checked) {
      setDiscordLoading(true);
      try {
        const { success } = await UserSaveDiscord({ enabled: false });
        if (success) {
          setDiscordEnabled(false);
          toast.success(t('toast.disable.success'));
          onUpdate?.({ enabled: false });
        } else {
          toast.error(t('toast.disable.error'));
        }
      } catch (error) {
        toast.error(t('toast.disable.error'));
      } finally {
        setDiscordLoading(false);
      }
    } else {
      // If enabling, just update state - save happens on Save button click
      setDiscordEnabled(true);
    }
  };

  const handleSave = async () => {
    setDiscordLoading(true);

    try {
      if (!discordEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaDiscordService.safeParse({
        enabled: discordEnabled,
        url: discordUrl,
      });
      if (!result.success) {
        throw new Error(t('toast.invalidParams'));
      }

      const { success } = await UserSaveDiscord(result.data);

      if (success) {
        toast.success(t('toast.save.success'));
        onUpdate?.(result.data);
      } else {
        toast.error(t('toast.save.error'));
      }
    } catch (error) {
      toast.error(t('toast.save.error'));
    } finally {
      setDiscordLoading(false);
    }
  };

  const handleTest = async () => {
    setDiscordLoading(true);

    try {
      if (!discordEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaDiscordService.safeParse({
        enabled: discordEnabled,
        url: discordUrl,
      });
      if (!result.success) {
        throw new Error(t('toast.testInvalidParams'));
      }

      const { success } = await UserTestDiscord(result.data);

      if (success) {
        toast.success(t('toast.test.success'));
      } else {
        toast.error(t('toast.test.error'));
      }
    } catch (error) {
      toast.error(t('toast.test.error'));
    } finally {
      setDiscordLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex gap-3 flex-1'>
            <div className='space-y-1'>
              <CardTitle className='flex items-center gap-2'>
                <Switch
                  checked={discordEnabled}
                  onCheckedChange={handleToggle}
                  disabled={discordLoading}
                  className='shrink-0'
                />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
          </div>
          <Icons.discord className='size-8 shrink-0'/>
        </div>
      </CardHeader>

      {discordEnabled && (
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='discord-server-url'>{t('fields.url.label')}</Label>
            <Input
              id='discord-server-url'
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              placeholder={t('fields.url.placeholder')}
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-4 w-full'>
            <Button onClick={handleSave} disabled={discordLoading} className='w-full sm:w-auto'>
              {discordLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.save className='me-2' />
              )}
              {t('buttons.save')}
            </Button>
            <Button onClick={handleTest} variant='secondary' disabled={discordLoading} className='w-full text-left sm:w-auto'>
              {discordLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.send className='me-2' />
              )}
              {t('buttons.test')}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const ExternalServiceSlack = ( {slack, onUpdate} ) => {
  const t = useTranslations('pages.account.externalServices.slack');
  const [slackEnabled, setSlackEnabled] = useState(slack?.enabled || false);
  const [slackUrl, setSlackUrl] = useState(slack?.url || '');
  const [slackLoading, setSlackLoading] = useState(false);

  const handleToggle = async (checked) => {
    if (!checked) {
      setSlackLoading(true);
      try {
        const { success } = await UserSaveSlack({ enabled: false });
        if (success) {
          setSlackEnabled(false);
          toast.success(t('toast.disable.success'));
          onUpdate?.({ enabled: false });
        } else {
          toast.error(t('toast.disable.error'));
        }
      } catch (error) {
        toast.error(t('toast.disable.error'));
      } finally {
        setSlackLoading(false);
      }
    } else {
      // If enabling, just update state - save happens on Save button click
      setSlackEnabled(true);
    }
  };

  const handleSave = async () => {
    setSlackLoading(true);

    try {
      if (!slackEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaSlackService.safeParse({
        enabled: slackEnabled,
        url: slackUrl,
      });
      if (!result.success) {
        throw new Error(t('toast.invalidParams'));
      }

      const { success } = await UserSaveSlack(result.data);

      if (success) {
        toast.success(t('toast.save.success'));
        onUpdate?.(result.data);
      } else {
        toast.error(t('toast.save.error'));
      }
    } catch (error) {
      toast.error(t('toast.save.error'));
    } finally {
      setSlackLoading(false);
    }
  };

  const handleTest = async () => {
    setSlackLoading(true);

    try {
      if (!slackEnabled) {
        throw new Error(t('toast.notEnabled'));
      }

      const result = SchemaSlackService.safeParse({
        enabled: slackEnabled,
        url: slackUrl,
      });
      if (!result.success) {
        throw new Error(t('toast.testInvalidParams'));
      }

      const { success } = await UserTestSlack(result.data);

      if (success) {
        toast.success(t('toast.test.success'));
      } else {
        toast.error(t('toast.test.error'));
      }
    } catch (error) {
      toast.error(t('toast.test.error'));
    } finally {
      setSlackLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex gap-3 flex-1'>
            <div className='space-y-1'>
              <CardTitle className='flex items-center gap-2'>
                <Switch
                  checked={slackEnabled}
                  onCheckedChange={handleToggle}
                  disabled={slackLoading}
                  className='shrink-0'
                />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
          </div>
          <Icons.slack className='size-8 shrink-0'/>
        </div>
      </CardHeader>

      {slackEnabled && (
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='slack-server-url'>{t('fields.url.label')}</Label>
            <Input
              id='slack-server-url'
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder={t('fields.url.placeholder')}
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-4 w-full'>
            <Button onClick={handleSave} disabled={slackLoading} className='w-full sm:w-auto'>
              {slackLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.save className='me-2' />
              )}
              {t('buttons.save')}
            </Button>
            <Button onClick={handleTest} variant='secondary' disabled={slackLoading} className='w-full text-left sm:w-auto'>
              {slackLoading ? (
                <Icons.spinner className='me-2 animate-spin' />
              ) : (
                <Icons.send className='me-2' />
              )}
              {t('buttons.test')}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const ExternalServices = ({ externalServices, onUpdate }) => {
  const t = useTranslations('pages.account.externalServices');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-6'>
        <ExternalServiceNtfy
          ntfy={externalServices?.ntfy || {}}
          onUpdate={(data) => {
            onUpdate?.({
              ...externalServices,
              ntfy: data,
            });
          }}
        />
        <ExternalServiceWebhook
          webhook={externalServices?.webhook || {}}
          onUpdate={(data) => {
            onUpdate?.({
              ...externalServices,
              webhook: data,
            });
          }}
        />
        <ExternalServiceDiscord
          discord={externalServices?.discord || {}}
          onUpdate={(data) => {
            onUpdate?.({
              ...externalServices,
              discord: data,
            });
          }}
        />
        <ExternalServiceSlack
          slack={externalServices?.slack || {}}
          onUpdate={(data) => {
            onUpdate?.({
              ...externalServices,
              slack: data,
            });
          }}
        />
      </CardContent>
    </Card>
  );
};

const ExportActions = () => {
  const t = useTranslations('pages.account.dataExport');
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sub-idler-me-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('toast.success'));
    } catch (error) {
      toast.error(t('toast.error'));
    } finally {
      setLoading(false);
    }
  }, [UserExportData, setLoading, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Button
          onClick={handleExport}
          variant='outline'
          disabled={loading}
          className='w-full sm:w-auto'
          title={t('button')}
        >
          {loading ? (
            <Icons.spinner className='me-2 size-4 animate-spin' />
          ) : (
            <Icons.download className='me-2 size-4' />
          )}
          {t('button')}
        </Button>
      </CardContent>
    </Card>
  );
};

export const AccountSettings = ({ user }) => {
  const [externalServices, setExternalServices] = useState(user?.externalServices || {});

  const handleExternalServicesUpdate = useCallback((data) => {
    setExternalServices(data);
  }, [setExternalServices]);

  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <UserProfile user={user} />
      <DefaultSettings user={user} />
      <NotificationManager user={user} externalServices={externalServices} />
      <CategoryManager user={user} />
      <PaymentMethodManager user={user} />
      <ExternalServices externalServices={externalServices} onUpdate={handleExternalServicesUpdate} />
      <ExportActions />
    </div>
  );
};

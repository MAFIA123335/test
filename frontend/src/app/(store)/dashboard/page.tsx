'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tAuth = useTranslations('auth');
  const { user, refreshUser } = useAuth();

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' },
  });

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: passwordSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      await api.patch('/auth/profile', data);
      await refreshUser();
      toast({ title: tAuth('profileUpdated') });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await api.post('/auth/change-password', data);
      resetPassword();
      toast({ title: tAuth('passwordChanged') });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('profile')}</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t('editProfile')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{tAuth('firstName')}</Label>
                <Input {...regProfile('firstName')} />
                {profileErrors.firstName && <p className="text-xs text-destructive">{profileErrors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{tAuth('lastName')}</Label>
                <Input {...regProfile('lastName')} />
                {profileErrors.lastName && <p className="text-xs text-destructive">{profileErrors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tAuth('email')}</Label>
              <Input value={user?.email ?? ''} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label>{tAuth('phone')}</Label>
              <Input {...regProfile('phone')} />
            </div>
            <Button type="submit" disabled={profileSubmitting}>
              {profileSubmitting ? '...' : t('editProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {t('changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{tAuth('currentPassword')}</Label>
              <Input type="password" {...regPassword('currentPassword')} />
              {passwordErrors.currentPassword && <p className="text-xs text-destructive">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{tAuth('newPassword')}</Label>
              <Input type="password" {...regPassword('newPassword')} />
              {passwordErrors.newPassword && <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>}
            </div>
            <Button type="submit" disabled={passwordSubmitting}>
              {passwordSubmitting ? '...' : t('changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

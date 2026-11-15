'use server';

import { auth } from '@/lib/auth';
import { signInSchema, signInOTPSchema } from './schema';

export const signInOTPAction = async (data) => {
  const parsedCode = signInOTPSchema.safeParse(data);
  if (!parsedCode.success) {
    return { error: 'Invalid code. Please re-check the 6 digits.' };
  }

  const parsedEmail = signInSchema.safeParse(data);
  if (!parsedEmail.success) {
    return { error: 'Invalid email. Request a new code to continue.' };
  }

  try {
    const result = await auth.api.signInEmailOTP({
      body: {
        email: parsedEmail.data.email,
        otp: parsedCode.data.code,
      },
    });

    if (result?.token) {
      return { success: true };
    }
  } catch (error) {
    if (error.type === 'AccessDenied') {
      return { error: error.type };
    }
  }

  return { error: 'Unable to verify your code right now. Try again shortly.' };
};

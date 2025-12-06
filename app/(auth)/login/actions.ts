'use server'

import prisma from '@/lib/prisma';
import {createClient} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
import {parse} from 'path';
import z from 'zod';

const loginSchema = z.object({
  email: z.email('Provide Valid Eamil'),
  password: z.string().min(6, 'Must Input a password')
})


export type LoginState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
    _prevState: LoginState, formData: FormData): Promise<LoginState> {
  const input = {
    email: formData.get('email'),
    password: formData.get('password')
  };
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {fieldErrors: z.flattenError(parsed.error).fieldErrors};
  }

  const parsedData = parsed.data;
  const supabase = await createClient();

  const {data, error} = await supabase.auth.signInWithPassword(
      {email: parsedData.email, password: parsedData.password})
  if (error) {
    return {formError: 'Invalid Username or Password'};
  }

  const authUser = data.user;
  if (!authUser) {
    return { formError: 'Could not login' };
  }

  const user = await prisma.user.findUnique({
    where: {
      authId: authUser.id,
    },
  });

  if (!user) {
    // User exists in Supabase Auth but not in your DB → sign them out + show error
    await supabase.auth.signOut();
    return {
      formError: 'This account no longer exists. Please contact support or sign up again.',
    };
  }

  redirect('/home')
}

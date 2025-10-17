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
    return {formError: 'Could not login'};
  }

  redirect('/home')
}

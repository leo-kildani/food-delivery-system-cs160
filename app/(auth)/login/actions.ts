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
  values?: {
    email?: string;
  }
};

export async function loginAction(
    _prevState: LoginState, formData: FormData): Promise<LoginState> {
  const input = {
    email: formData.get('email'),
    password: formData.get('password')
  };
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten(); 
    return {
      fieldErrors,
      values: {
        email: (input.email as string) ?? "",
      },
    };
  }

  const parsedData = parsed.data;
  const supabase = await createClient();

  const {data, error} = await supabase.auth.signInWithPassword(
      {email: parsedData.email, password: parsedData.password})

  if (error) {
    return {
      formError: 'Invalid Username or Password',
      values: {
        email: parsedData.email,   
      },
    };
  }

  const authUser = data.user;
  if (!authUser) {
    return {
      formError: 'Could not login',
      values: {
        email: parsedData.email,   
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      authId: authUser.id,
    },
  });

  if (!user) {
    await supabase.auth.signOut();
    return {
      formError:
        'This account no longer exists.',
      values: {
        email: parsedData.email,  
      },
    };
  }

  redirect('/home')
}

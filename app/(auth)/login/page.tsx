'use server'

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from './page-client';

export default async function LoginSeverPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/home'); 
  }

  return <LoginForm />;
}
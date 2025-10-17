- Actions.ts:

  - any type or serializing object

- to get current logged in user:

- const { data } = await supabase.auth.getUser();

- npx prisma generate to update prisma

- For now, leave components in the directory in which they're used, not in /components

- Server actions: use `_prevState: LogoutState, formData: FormData` in the function declaration even if they're not used, just to distinguish server actions

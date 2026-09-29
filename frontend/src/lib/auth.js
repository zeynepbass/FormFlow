import 'server-only';
import { cache } from 'react';
import { serverApi } from './api/server';

export const getCurrentUser = cache(async () => {
  const { data } = await serverApi('/auth/me');
  return data;
});

import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { serverApi } from '@/lib/api/server';

export const getOwnedForm = cache(async (id) => {
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  try {
    const { data } = await serverApi(`/forms/${id}`);
    return data;
  } catch (error) {
    if (error.status === 404) notFound();
    throw error;
  }
});

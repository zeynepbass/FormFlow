'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button-variants';
import { api } from '@/lib/api/client';

export function VerifyEmailPanel() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState({ pending: false, done: false, error: '' });

  if (!token) {
    return <Alert tone="error" title="This verification link is incomplete." />;
  }

  if (state.done) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Your email address is confirmed." />
        <Link href="/dashboard" className={buttonVariants({ className: 'w-full' })}>
          Go to dashboard
        </Link>
      </div>
    );
  }

  async function confirm() {
    setState({ pending: true, done: false, error: '' });
    try {
      await api('/auth/verify-email', { method: 'POST', body: { token } });
      setState({ pending: false, done: true, error: '' });
    } catch (error) {
      setState({ pending: false, done: false, error: error.message });
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        confirm();
      }}
    >
      <FormStatus error={state.error} />
      <SubmitButton pending={state.pending} pendingText="Confirming…" className="w-full">
        Confirm email
      </SubmitButton>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';

export function VerifyEmailBanner({ email }) {
  const [state, setState] = useState('idle');

  async function resend() {
    setState('sending');
    try {
      await api('/auth/resend-verification', { method: 'POST' });
      setState('sent');
    } catch {
      setState('error');
    }
  }

  const messages = {
    sent: 'A new confirmation link is on its way.',
    error: 'Could not send the email. Please try again later.',
  };

  return (
    <Alert tone="info" title="Confirm your email address" className="mb-8">
      <p>
        We sent a confirmation link to{' '}
        <strong className="font-medium text-foreground">{email}</strong>.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3" aria-live="polite">
        <Button variant="link" onClick={resend} disabled={state === 'sending' || state === 'sent'}>
          Resend link
        </Button>
        {messages[state] ? <span>{messages[state]}</span> : null}
      </div>
    </Alert>
  );
}

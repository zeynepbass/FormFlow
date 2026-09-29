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
    sent: 'Yeni doğrulama bağlantısı gönderildi.',
    error: 'E-posta gönderilemedi. Lütfen daha sonra tekrar dene.',
  };

  return (
    <Alert tone="info" title="E-posta adresini doğrula" className="mb-8">
      <p>
        <strong className="font-medium text-foreground">{email}</strong> adresine bir doğrulama
        bağlantısı gönderdik.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3" aria-live="polite">
        <Button variant="link" onClick={resend} disabled={state === 'sending' || state === 'sent'}>
          Bağlantıyı tekrar gönder
        </Button>
        {messages[state] ? <span>{messages[state]}</span> : null}
      </div>
    </Alert>
  );
}

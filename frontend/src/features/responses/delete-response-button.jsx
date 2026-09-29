'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';

export function DeleteResponseButton({ formId, responseId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setPending(true);
    setError('');
    try {
      await api(`/forms/${formId}/responses/${responseId}`, { method: 'DELETE' });
      setOpen(false);
      router.push(`/formlar/${formId}/yanitlar`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <p role="alert" className="text-sm text-error-text">
          {error}
        </p>
      ) : null}
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden="true" />
        Sil
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Bu yanıt silinsin mi?"
        description="Yanıt ve yüklenen dosyalar kalıcı olarak silinecek."
        confirmLabel="Yanıtı sil"
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

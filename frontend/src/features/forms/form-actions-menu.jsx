'use client';

import {
  Archive,
  ArchiveRestore,
  ChartColumn,
  Copy,
  Ellipsis,
  ExternalLink,
  Inbox,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api/client';

export function FormActionsMenu({ form }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  function run(request, afterSuccess) {
    setError('');
    startTransition(async () => {
      try {
        const result = await request();
        if (afterSuccess) afterSuccess(result);
        else router.refresh();
      } catch (error) {
        setError(error.message);
      }
    });
  }

  const statusAction = (action) => () =>
    run(() => api(`/forms/${form.id}/${action}`, { method: 'POST' }));

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <p role="alert" className="max-w-56 text-right text-xs text-error-text">
          {error}
        </p>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`${form.title} için işlemler`}
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/formlar/${form.id}`}>
              <Pencil aria-hidden="true" />
              Düzenle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/formlar/${form.id}/yanitlar`}>
              <Inbox aria-hidden="true" />
              Yanıtlar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/formlar/${form.id}/analiz`}>
              <ChartColumn aria-hidden="true" />
              Analiz
            </Link>
          </DropdownMenuItem>
          {form.status === 'published' || form.status === 'paused' ? (
            <DropdownMenuItem asChild>
              <a href={`/f/${form.slug}`} target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" />
                Formu görüntüle
              </a>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          {form.status === 'draft' || form.status === 'paused' ? (
            <DropdownMenuItem onSelect={statusAction('publish')}>
              <Play aria-hidden="true" />
              Yayınla
            </DropdownMenuItem>
          ) : null}
          {form.status === 'published' ? (
            <DropdownMenuItem onSelect={statusAction('pause')}>
              <Pause aria-hidden="true" />
              Duraklat
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onSelect={() =>
              run(
                () => api(`/forms/${form.id}/duplicate`, { method: 'POST' }),
                ({ data }) => router.push(`/formlar/${data.id}`),
              )
            }
          >
            <Copy aria-hidden="true" />
            Kopyala
          </DropdownMenuItem>
          {form.status === 'archived' ? (
            <DropdownMenuItem onSelect={statusAction('restore')}>
              <ArchiveRestore aria-hidden="true" />
              Taslağa geri al
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={statusAction('archive')}>
              <Archive aria-hidden="true" />
              Arşivle
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`“${form.title}” silinsin mi?`}
        description="Form, yanıtları ve yüklenen dosyalar kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Formu sil"
        onConfirm={() => {
          setConfirmDelete(false);
          run(
            () => api(`/forms/${form.id}`, { method: 'DELETE' }),
            () => {
              router.push('/formlar');
              router.refresh();
            },
          );
        }}
      />
    </div>
  );
}

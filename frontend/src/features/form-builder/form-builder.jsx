'use client';

import { Check, ExternalLink, Link2, Save, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useReducer, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import { builderReducer, findProblems, initBuilderState } from './builder-reducer';
import { FieldList } from './field-list';
import { FieldPalette } from './field-palette';

function toPayload(state) {
  return {
    version: state.version,
    title: state.title,
    description: state.description,
    fields: state.fields,
  };
}

export function FormBuilder({ form }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(builderReducer, form, initBuilderState);
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [copied, setCopied] = useState(false);

  const problems = findProblems(state);
  const problemIds = new Set(problems.map((problem) => problem.fieldId).filter(Boolean));
  const publicUrl = `/f/${form.slug}`;

  async function save() {
    if (problems.length > 0) {
      setFeedback({ tone: 'error', title: 'Kaydetmeden önce bunları düzelt', items: problems });
      return null;
    }
    setPending('save');
    setFeedback(null);
    try {
      const { data } = await api(`/forms/${form.id}`, { method: 'PATCH', body: toPayload(state) });
      dispatch({ type: 'saved', form: data });
      router.refresh();
      return data;
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: error.message,
        items: error.details.map((detail) => ({ message: detail.message })),
      });
      return null;
    } finally {
      setPending(null);
    }
  }

  async function publish() {
    if (state.fields.length === 0) {
      setFeedback({ tone: 'error', title: 'Yayınlamadan önce en az bir alan ekle.' });
      return;
    }
    if (state.dirty && !(await save())) return;

    setPending('publish');
    try {
      await api(`/forms/${form.id}/publish`, { method: 'POST' });
      setFeedback({ tone: 'success', title: 'Formun yayında.', link: publicUrl });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: error.message,
        items: error.details.map((detail) => ({ message: detail.message })),
      });
    } finally {
      setPending(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(publicUrl, window.location.origin).toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function move(from, to, { announce = true } = {}) {
    if (to < 0 || to >= state.fields.length) return;
    const field = state.fields[from];
    dispatch({ type: 'move', from, to });
    if (announce) {
      setAnnouncement(
        `${field.label.trim() || 'Alan'}, ${state.fields.length} alan içinde ${to + 1}. sıraya taşındı.`,
      );
    }
  }

  const onShortcut = useEffectEvent((event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (state.dirty && !pending) save();
    }
  });

  useEffect(() => {
    const handler = (event) => onShortcut(event);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!state.dirty) return undefined;
    const handler = (event) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.dirty]);

  const isLive = form.status === 'published' || form.status === 'paused';
  const canPublish = form.status === 'draft' || form.status === 'paused';

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <p className="text-sm text-muted-strong" aria-live="polite">
          {pending === 'save'
            ? 'Kaydediliyor…'
            : state.dirty
              ? 'Kaydedilmemiş değişiklikler var'
              : 'Tüm değişiklikler kaydedildi'}
        </p>
        <div className="flex flex-wrap gap-2">
          {isLive ? (
            <>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
                {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
              </Button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                <ExternalLink aria-hidden="true" />
                Görüntüle
              </a>
            </>
          ) : null}
          <Button
            variant={canPublish ? 'secondary' : 'primary'}
            size="sm"
            onClick={save}
            disabled={!state.dirty || pending !== null}
          >
            <Save aria-hidden="true" />
            Kaydet
            <kbd className="hidden text-xs text-muted-strong sm:inline">⌘S</kbd>
          </Button>
          {canPublish ? (
            <Button size="sm" onClick={publish} disabled={pending !== null}>
              <Send aria-hidden="true" />
              {form.status === 'paused' ? 'Devam ettir' : 'Yayınla'}
            </Button>
          ) : null}
        </div>
      </div>

      <div role="alert" aria-live="assertive">
        {feedback ? (
          <Alert tone={feedback.tone} title={feedback.title} className="mb-6">
            {feedback.items?.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {feedback.items.map((item, index) => (
                  <li key={index}>
                    {item.fieldId ? (
                      <button
                        type="button"
                        className="text-left underline underline-offset-2"
                        onClick={() => dispatch({ type: 'select', id: item.fieldId })}
                      >
                        {item.message}
                      </button>
                    ) : (
                      item.message
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {feedback.link ? (
              <a
                href={feedback.link}
                target="_blank"
                rel="noopener"
                className="font-medium text-primary-dark underline"
              >
                {feedback.link} adresini aç
              </a>
            ) : null}
          </Alert>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {form.status === 'archived' ? (
        <Alert tone="info" title="Bu form arşivlendi." className="mb-6">
          Tekrar yayınlamak için işlemler menüsünden taslağa geri al.
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="form-title">Form başlığı</Label>
              <Input
                id="form-title"
                value={state.title}
                maxLength={120}
                onChange={(event) =>
                  dispatch({ type: 'set_meta', key: 'title', value: event.target.value })
                }
                aria-invalid={state.title.trim() ? undefined : true}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-description">Açıklama</Label>
              <Textarea
                id="form-description"
                rows={2}
                maxLength={1000}
                value={state.description}
                placeholder="Bu formun ne için olduğunu anlat"
                onChange={(event) =>
                  dispatch({ type: 'set_meta', key: 'description', value: event.target.value })
                }
              />
            </div>
          </Card>

          <section aria-labelledby="fields-heading">
            <h2 id="fields-heading" className="mb-3 text-sm font-semibold">
              Alanlar <span className="font-normal text-muted-strong">({state.fields.length})</span>
            </h2>
            {state.fields.length > 0 ? (
              <FieldList
                fields={state.fields}
                selectedId={state.selectedId}
                problemIds={problemIds}
                dispatch={dispatch}
                onMove={move}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted-strong">
                Henüz alan yok. İlk sorunu eklemek için bir alan türü seç.
              </p>
            )}
          </section>
        </div>

        <aside>
          <div className="lg:sticky lg:top-24">
            <FieldPalette
              fieldCount={state.fields.length}
              fileFieldCount={state.fields.filter((field) => field.type === 'file').length}
              onAdd={(fieldType) => dispatch({ type: 'add', fieldType })}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

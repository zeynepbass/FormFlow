import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { siteConfig } from '@/config/site';
import { PublicForm } from '@/features/public-form/public-form';
import { getPublicForm, isValidSlug } from '@/features/public-form/queries';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const form = isValidSlug(slug) ? await getPublicForm(slug) : null;

  if (!form) {
    return { title: 'Form bulunamadı', robots: { index: false, follow: false } };
  }

  const description = form.description?.slice(0, 160) || `“${form.title}” formunu doldur.`;
  const indexable = form.status === 'published' && form.settings.allowIndexing;
  const path = `/f/${form.slug}`;

  return {
    title: form.title,
    description,
    robots: indexable ? { index: true, follow: false } : { index: false, follow: false },
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      url: path,
      title: form.title,
      description,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: form.title,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

async function FormContent({ params }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const form = await getPublicForm(slug);
  if (!form) notFound();

  return (
    <article>
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {form.title}
        </h1>
        {form.description ? (
          <p className="mt-3 whitespace-pre-line text-muted-strong">{form.description}</p>
        ) : null}
        {form.fields.some((field) => field.required) ? (
          <p className="mt-4 text-sm text-muted-strong">
            <span className="text-error-text">*</span> ile işaretli sorular zorunludur.
          </p>
        ) : null}
      </header>
      <div className="pt-8">
        {form.status === 'published' ? (
          <PublicForm form={form} />
        ) : (
          <Alert tone="info" title="Bu form şu anda yanıt kabul etmiyor.">
            Daha sonra tekrar dene ya da formu seninle paylaşan kişiyle iletişime geç.
          </Alert>
        )}
      </div>
    </article>
  );
}

function FormSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Form yükleniyor" className="space-y-6">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <div className="space-y-6 pt-4">
        {[0, 1, 2].map((key) => (
          <div key={key} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublicFormPage({ params }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-10">
          <Suspense fallback={<FormSkeleton />}>
            <FormContent params={params} />
          </Suspense>
        </div>
      </main>
      <footer className="pb-8 text-center text-sm text-muted-strong">
        <Link href="/" className="font-medium text-foreground hover:underline">
          FormFlow
        </Link>{' '}
        ile oluşturuldu
      </footer>
    </div>
  );
}

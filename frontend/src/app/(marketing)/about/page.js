import Link from 'next/link';
import { JsonLd, breadcrumbList } from '@/components/common/json-ld';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/metadata';

const description =
  'Why FormFlow exists and the principles behind it: simple by default, private by default, fast on every device and accessible to everyone.';

export const metadata = pageMetadata({ title: 'About', description, path: '/about' });

const principles = [
  {
    title: 'Simple by default',
    body: 'A form should take minutes, not an afternoon. Every screen does one job and hides what you do not need yet.',
  },
  {
    title: 'Private by default',
    body: 'Forms stay out of search engines unless you opt in. Responses and uploads are visible only to the form owner.',
  },
  {
    title: 'Fast everywhere',
    body: 'Public forms ship very little JavaScript and render on the server, so they open quickly on slow phones and networks.',
  },
  {
    title: 'Accessible to everyone',
    body: 'Labels, keyboard support, visible focus and clear error messages are part of every form, not an extra setting.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', url: siteConfig.url },
          { name: 'About', url: `${siteConfig.url}/about` },
        ])}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="text-4xl font-semibold tracking-tight">About FormFlow</h1>
        <div className="mt-6 space-y-4 text-lg text-muted-strong">
          <p>
            Most form tools are built for large organisations. They come with workflows, permissions
            and pricing tiers that a freelancer or a small team never touches.
          </p>
          <p>
            FormFlow keeps the essential loop and makes it pleasant: build a form, share a link,
            read the responses and understand how the form is doing.
          </p>
        </div>

        <section aria-labelledby="principles-heading" className="mt-16">
          <h2 id="principles-heading" className="text-2xl font-semibold tracking-tight">
            Principles
          </h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {principles.map((principle) => (
              <div key={principle.title} className="rounded-lg border border-border bg-surface p-6">
                <dt className="font-semibold">{principle.title}</dt>
                <dd className="mt-2 text-sm text-muted-strong">{principle.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-16 text-muted-strong">
          Ready to try it?{' '}
          <Link
            href="/register"
            className="font-medium text-primary-dark underline-offset-4 hover:underline"
          >
            Create a free account
          </Link>
          .
        </p>
      </article>
    </>
  );
}

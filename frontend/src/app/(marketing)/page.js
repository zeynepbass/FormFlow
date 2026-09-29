import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/common/json-ld';
import { buttonVariants } from '@/components/ui/button-variants';
import { siteConfig } from '@/config/site';
import { highlights, steps } from '@/features/marketing/content';
import { pageMetadata } from '@/lib/metadata';

const homeTitle = `${siteConfig.name} — Simple form builder for small teams`;

export const metadata = {
  ...pageMetadata({ description: siteConfig.description, path: '/', socialTitle: homeTitle }),
  title: { absolute: homeTitle },
};

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteConfig.url,
    description: siteConfig.description,
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-24">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Create forms. Collect responses.{' '}
            <span className="text-primary-dark">Understand your data.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-strong">{siteConfig.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonVariants({ size: 'lg' })}>
              Create your first form
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/features" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              See features
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-strong">Free to use. No credit card, no setup.</p>
        </div>

        <Image
          src="/assets/illustrations/hero-builder.svg"
          alt="The FormFlow builder with a field list, a form preview and a response chart"
          width={640}
          height={440}
          priority
          className="h-auto w-full"
        />
      </section>

      <section aria-labelledby="highlights-heading" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="highlights-heading" className="text-3xl font-semibold tracking-tight">
            Everything a form needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-strong">
            FormFlow covers the whole loop, from the first field to the final spreadsheet, and stays
            out of your way.
          </p>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-lg border border-border bg-background p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-soft-purple text-primary-dark">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-strong">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 id="steps-heading" className="text-3xl font-semibold tracking-tight">
          From idea to insight in three steps
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-border bg-surface p-6">
              <span className="text-sm font-semibold text-primary-dark">Step {index + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-strong">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-lg bg-foreground px-6 py-12 text-center sm:px-12">
          <h2 id="cta-heading" className="text-2xl font-semibold text-surface sm:text-3xl">
            Your next form is a few minutes away
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-border">
            Sign up, add a few fields and share the link today.
          </p>
          <Link href="/register" className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
            Get started
          </Link>
        </div>
      </section>
    </>
  );
}

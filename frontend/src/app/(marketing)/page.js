import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/common/json-ld';
import { buttonVariants } from '@/components/ui/button-variants';
import { siteConfig } from '@/config/site';
import { highlights, steps } from '@/features/marketing/content';
import { pageMetadata } from '@/lib/metadata';

const homeTitle = `${siteConfig.name} — Küçük ekipler için sade form oluşturucu`;

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
            Form oluştur. Yanıtları topla. <span className="text-primary-dark">Verini anla.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-strong">{siteConfig.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kayit" className={buttonVariants({ size: 'lg' })}>
              İlk formunu oluştur
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/ozellikler"
              className={buttonVariants({ variant: 'secondary', size: 'lg' })}
            >
              Özellikleri gör
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-strong">Ücretsiz. Kredi kartı yok, kurulum yok.</p>
        </div>

        <Image
          src="/assets/illustrations/hero-builder.svg"
          alt="Alan listesi, form önizlemesi ve yanıt grafiği içeren FormFlow form oluşturucu"
          width={640}
          height={440}
          priority
          className="h-auto w-full"
        />
      </section>

      <section aria-labelledby="highlights-heading" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="highlights-heading" className="text-3xl font-semibold tracking-tight">
            Bir formun ihtiyacı olan her şey. Fazlası değil.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-strong">
            FormFlow ilk alandan son tabloya kadar tüm süreci kapsar ve işini zorlaştırmaz.
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
          Üç adımda fikirden içgörüye
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-border bg-surface p-6">
              <span className="text-sm font-semibold text-primary-dark">Adım {index + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-strong">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-lg bg-foreground px-6 py-12 text-center sm:px-12">
          <h2 id="cta-heading" className="text-2xl font-semibold text-surface sm:text-3xl">
            Yeni formun birkaç dakika uzağında
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-border">
            Kayıt ol, birkaç alan ekle ve bağlantıyı bugün paylaş.
          </p>
          <Link href="/kayit" className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
            Ücretsiz başla
          </Link>
        </div>
      </section>
    </>
  );
}

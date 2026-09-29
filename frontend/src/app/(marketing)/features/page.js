import Link from 'next/link';
import { JsonLd, breadcrumbList } from '@/components/common/json-ld';
import { buttonVariants } from '@/components/ui/button-variants';
import { siteConfig } from '@/config/site';
import { faqs } from '@/features/marketing/content';
import { pageMetadata } from '@/lib/metadata';

const description =
  'Explore the FormFlow builder, public form links, response inbox, analytics and CSV export, plus answers to common questions.';

export const metadata = pageMetadata({ title: 'Features', description, path: '/features' });

const sections = [
  {
    id: 'builder',
    title: 'Builder',
    points: [
      'Eleven field types, from short text to file uploads.',
      'Labels, placeholders, help text and required toggles on every field.',
      'Reorder by drag and drop, by keyboard, or with move buttons.',
      'Duplicate fields and whole forms to start faster.',
      'Explicit saving with an unsaved-changes warning, so nothing is lost by accident.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing',
    points: [
      'Short, readable links like /f/customer-feedback.',
      'Draft, published, paused and archived states you control.',
      'Forms load quickly because they are rendered on the server and cached.',
      'Spam protection with rate limits and a hidden trap field.',
    ],
  },
  {
    id: 'responses',
    title: 'Responses',
    points: [
      'Search across answers and filter by date.',
      'Open any response to see every field with its submission time.',
      'Uploaded files are checked, stored privately and downloadable only by you.',
      'CSV export that neutralises spreadsheet formulas in answers.',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    points: [
      'Views, starts and submissions for the last 7, 30 or 90 days.',
      'Completion rate, so you can see where people drop off.',
      'No third-party trackers and no cookies on your public forms.',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbList([
            { name: 'Home', url: siteConfig.url },
            { name: 'Features', url: `${siteConfig.url}/features` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight">Features</h1>
          <p className="mt-4 text-lg text-muted-strong">
            A focused set of tools for building forms, sharing them and making sense of the answers.
          </p>
        </header>

        <nav aria-label="On this page" className="mt-10">
          <ul className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-primary"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`} className="text-2xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3 text-muted-strong">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section aria-labelledby="faq-heading" className="mt-20">
          <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                  <h3 className="inline">{faq.question}</h3>
                </summary>
                <p className="mt-2 text-muted-strong">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-16">
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>
            Start building
          </Link>
        </div>
      </div>
    </>
  );
}

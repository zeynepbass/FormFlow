import Link from 'next/link';
import { JsonLd, breadcrumbList } from '@/components/common/json-ld';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/metadata';

const description =
  'FormFlow neden var ve hangi ilkelere dayanıyor: varsayılan olarak sade, varsayılan olarak gizli, her cihazda hızlı ve herkes için erişilebilir.';

export const metadata = pageMetadata({ title: 'Hakkında', description, path: '/hakkinda' });

const principles = [
  {
    title: 'Varsayılan olarak sade',
    body: 'Bir form bir öğleden sonra değil, birkaç dakika sürmeli. Her ekran tek bir iş yapar ve henüz ihtiyacın olmayanı gizler.',
  },
  {
    title: 'Varsayılan olarak gizli',
    body: 'Sen izin vermedikçe formlar arama motorlarında görünmez. Yanıtları ve yüklenen dosyaları yalnızca form sahibi görür.',
  },
  {
    title: 'Her yerde hızlı',
    body: 'Formlar çok az JavaScript yükler ve sunucuda oluşturulur; bu yüzden yavaş telefon ve bağlantılarda da hızlı açılır.',
  },
  {
    title: 'Herkes için erişilebilir',
    body: 'Etiketler, klavye desteği, görünür odak ve anlaşılır hata mesajları ek bir ayar değil, her formun parçasıdır.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbList([
          { name: 'Ana sayfa', url: siteConfig.url },
          { name: 'Hakkında', url: `${siteConfig.url}/hakkinda` },
        ])}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="text-4xl font-semibold tracking-tight">FormFlow hakkında</h1>
        <div className="mt-6 space-y-4 text-lg text-muted-strong">
          <p>
            Çoğu form aracı büyük kurumlar için tasarlanır. Bir serbest çalışanın ya da küçük bir
            ekibin hiç kullanmayacağı iş akışları, yetkiler ve fiyat paketleriyle gelir.
          </p>
          <p>
            FormFlow yalnızca temel akışa odaklanır ve onu keyifli hale getirir: form oluştur,
            bağlantıyı paylaş, yanıtları oku ve formunun nasıl gittiğini anla.
          </p>
        </div>

        <section aria-labelledby="principles-heading" className="mt-16">
          <h2 id="principles-heading" className="text-2xl font-semibold tracking-tight">
            İlkeler
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
          Denemeye hazır mısın?{' '}
          <Link
            href="/kayit"
            className="font-medium text-primary-dark underline-offset-4 hover:underline"
          >
            Ücretsiz hesap oluştur
          </Link>
          .
        </p>
      </article>
    </>
  );
}

import Link from 'next/link';
import { JsonLd, breadcrumbList } from '@/components/common/json-ld';
import { buttonVariants } from '@/components/ui/button-variants';
import { siteConfig } from '@/config/site';
import { faqs } from '@/features/marketing/content';
import { pageMetadata } from '@/lib/metadata';

const description =
  'FormFlow form oluşturucu, paylaşılabilir form bağlantıları, yanıt kutusu, analiz ve CSV dışa aktarma hakkında bilgi al; sık sorulan soruların yanıtlarını oku.';

export const metadata = pageMetadata({ title: 'Özellikler', description, path: '/ozellikler' });

const sections = [
  {
    id: 'olusturucu',
    title: 'Form oluşturucu',
    points: [
      'Kısa metinden dosya yüklemeye kadar on bir alan türü.',
      'Her alanda başlık, yer tutucu, yardım metni ve zorunlu seçeneği.',
      'Sürükle-bırak, klavye ya da taşıma butonlarıyla sıralama.',
      'Daha hızlı başlamak için alanları ve formların tamamını kopyalama.',
      'Kaydedilmemiş değişiklik uyarısıyla bilinçli kaydetme; hiçbir şey yanlışlıkla kaybolmaz.',
    ],
  },
  {
    id: 'paylasim',
    title: 'Paylaşım',
    points: [
      '/f/musteri-geri-bildirimi gibi kısa ve okunabilir bağlantılar.',
      'Senin yönettiğin taslak, yayında, duraklatıldı ve arşivlendi durumları.',
      'Sunucuda oluşturulup önbelleğe alındıkları için hızlı açılan formlar.',
      'İstek sınırları ve gizli tuzak alanıyla spam koruması.',
    ],
  },
  {
    id: 'yanitlar',
    title: 'Yanıtlar',
    points: [
      'Yanıtlarda arama ve tarihe göre filtreleme.',
      'Her yanıtı tüm alanları ve gönderim zamanıyla görüntüleme.',
      'Yüklenen dosyalar kontrol edilir, gizli saklanır ve yalnızca sen indirebilirsin.',
      'Yanıtlardaki tablo formüllerini etkisiz hale getiren CSV dışa aktarma.',
    ],
  },
  {
    id: 'analiz',
    title: 'Analiz',
    points: [
      'Son 7, 30 veya 90 gün için görüntülenme, başlama ve gönderim sayıları.',
      'Kişilerin nerede vazgeçtiğini görmen için tamamlama oranı.',
      'Formlarında üçüncü taraf izleyici ve çerez yok.',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbList([
            { name: 'Ana sayfa', url: siteConfig.url },
            { name: 'Özellikler', url: `${siteConfig.url}/ozellikler` },
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
          <h1 className="text-4xl font-semibold tracking-tight">Özellikler</h1>
          <p className="mt-4 text-lg text-muted-strong">
            Form oluşturmak, paylaşmak ve yanıtları anlamak için odaklı bir araç seti.
          </p>
        </header>

        <nav aria-label="Bu sayfada" className="mt-10">
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
            Sık sorulan sorular
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
          <Link href="/kayit" className={buttonVariants({ size: 'lg' })}>
            Hemen başla
          </Link>
        </div>
      </div>
    </>
  );
}

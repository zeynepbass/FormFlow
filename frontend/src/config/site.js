export const siteConfig = {
  name: 'FormFlow',
  tagline: 'Form oluştur. Yanıtları topla. Verini anla.',
  description:
    'FormFlow; serbest çalışanlar, içerik üreticileri ve küçük ekipler için sade bir form oluşturucu. Birkaç dakikada form hazırla, bağlantıyı paylaş ve tüm yanıtları tek yerden takip et.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ogImage: '/assets/og/og-default.png',
  locale: 'tr_TR',
};

export const marketingNav = [
  { href: '/ozellikler', label: 'Özellikler' },
  { href: '/hakkinda', label: 'Hakkında' },
];

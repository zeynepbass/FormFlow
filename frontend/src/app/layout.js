import { Instrument_Sans } from 'next/font/google';
import { siteConfig } from '@/config/site';
import '@/styles/globals.css';

const instrumentSans = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-instrument-sans',
});

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.tagline }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [siteConfig.ogImage],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport = {
  themeColor: '#F7F3EE',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={instrumentSans.variable}>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-surface px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          İçeriğe geç
        </a>
        {children}
      </body>
    </html>
  );
}

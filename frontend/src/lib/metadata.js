import { siteConfig } from '@/config/site';

export function pageMetadata({ title, description, path, socialTitle: customTitle }) {
  const socialTitle = customTitle ?? (title ? `${title} · ${siteConfig.name}` : siteConfig.name);
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      url: path,
      title: socialTitle,
      description,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.tagline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export const privatePageRobots = { index: false, follow: false };

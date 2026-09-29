export const siteConfig = {
  name: 'FormFlow',
  tagline: 'Create forms. Collect responses. Understand your data.',
  description:
    'FormFlow is a simple form builder for freelancers, creators and small teams. Build a form in minutes, share a link, and read every response in one place.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ogImage: '/assets/og/og-default.png',
};

export const marketingNav = [
  { href: '/features', label: 'Features' },
  { href: '/about', label: 'About' },
];

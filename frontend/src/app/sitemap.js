import { siteConfig } from '@/config/site';

const routes = [
  { path: '', priority: 1, changeFrequency: 'monthly' },
  { path: '/features', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

'use client';

import { Download, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SEARCH_DELAY = 300;

export function ResponseFilters({ formId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const timer = useRef();

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  function update(changes) {
    const params = new URLSearchParams(searchParams);
    params.delete('cursor');
    params.delete('dir');
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const search = params.toString();
    startTransition(() =>
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }),
    );
  }

  function onSearch(value) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value.trim() }), SEARCH_DELAY);
  }

  const exportParams = new URLSearchParams();
  for (const key of ['q', 'from', 'to']) {
    const value = searchParams.get(key);
    if (value) exportParams.set(key, value);
  }
  const exportQuery = exportParams.toString();
  const hasFilters = Boolean(query || from || to);

  return (
    <div
      role="search"
      aria-label="Filter responses"
      aria-busy={isPending}
      className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_auto_auto] lg:items-end"
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="response-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-strong"
            aria-hidden="true"
          />
          <Input
            id="response-search"
            type="search"
            className="pl-9"
            placeholder="Search answers"
            value={query}
            maxLength={100}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="response-from">From</Label>
        <Input
          id="response-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => update({ from: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="response-to">To</Label>
        <Input
          id="response-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => update({ to: event.target.value })}
        />
      </div>
      <Button
        variant="ghost"
        className="h-11"
        disabled={!hasFilters}
        onClick={() => {
          clearTimeout(timer.current);
          setQuery('');
          update({ q: '', from: '', to: '' });
        }}
      >
        <X aria-hidden="true" />
        Clear
      </Button>
      <a
        href={`/api/forms/${formId}/export${exportQuery ? `?${exportQuery}` : ''}`}
        download
        className={buttonVariants({ variant: 'secondary', className: 'h-11' })}
      >
        <Download aria-hidden="true" />
        Export CSV
      </a>
    </div>
  );
}

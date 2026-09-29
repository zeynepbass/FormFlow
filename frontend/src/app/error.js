'use client';

import { buttonVariants } from '@/components/ui/button-variants';

export default function Error({ reset }) {
  return (
    <main
      id="main"
      className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted-strong">
        An unexpected error stopped this page from loading. Please try again.
      </p>
      <button
        type="button"
        className={buttonVariants({ className: 'mt-8' })}
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}

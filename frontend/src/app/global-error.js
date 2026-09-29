'use client';

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body
        style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F3EE', color: '#211F2B' }}
      >
        <main style={{ maxWidth: 480, margin: '20vh auto', padding: 16, textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>FormFlow could not load. Please try again.</p>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

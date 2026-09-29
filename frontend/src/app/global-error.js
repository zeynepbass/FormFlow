'use client';

export default function GlobalError({ reset }) {
  return (
    <html lang="tr">
      <body
        style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F3EE', color: '#211F2B' }}
      >
        <main style={{ maxWidth: 480, margin: '20vh auto', padding: 16, textAlign: 'center' }}>
          <h1>Bir şeyler ters gitti</h1>
          <p>FormFlow yüklenemedi. Lütfen tekrar dene.</p>
          <button type="button" onClick={() => reset()}>
            Tekrar dene
          </button>
        </main>
      </body>
    </html>
  );
}

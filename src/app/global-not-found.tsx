export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{margin: 0, fontFamily: 'sans-serif', background: '#111', color: '#fafafa'}}>
        <main style={{minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24}}>
          <section style={{maxWidth: 680}}>
            <h1 style={{fontSize: '2rem', marginBottom: 12}}>404</h1>
            <p style={{lineHeight: 1.6, marginBottom: 16}}>
              The requested route does not match the locale-prefixed routing contract.
            </p>
            <a href="/en" style={{color: '#8ee8d1'}}>
              Go to /en
            </a>
          </section>
        </main>
      </body>
    </html>
  );
}

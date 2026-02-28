import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="nf-shell">
          <h1>Global Not Found</h1>
          <p>The requested path is outside the supported route contract.</p>
          <Link href="/en">Return home</Link>
        </main>
      </body>
    </html>
  );
}

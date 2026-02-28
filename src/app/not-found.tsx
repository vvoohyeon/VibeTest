import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="nf-shell">
      <h1>Segment Not Found</h1>
      <p>This route exists, but the requested resource could not be found.</p>
      <Link href="/en">Return home</Link>
    </main>
  );
}

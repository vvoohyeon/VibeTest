import {defaultLocale} from '@/config/site';
import {buildLocalizedPath, RouteBuilder} from '@/lib/routes/route-builder';

export default function NotFound() {
  return (
    <main className="nf-shell">
      <h1>Segment Not Found</h1>
      <p>This route exists, but the requested resource could not be found.</p>
      <a href={buildLocalizedPath(RouteBuilder.landing(), defaultLocale)}>Return home</a>
    </main>
  );
}

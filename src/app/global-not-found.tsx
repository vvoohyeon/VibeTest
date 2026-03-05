import {defaultLocale} from '@/config/site';
import {buildLocalizedPath, RouteBuilder} from '@/lib/routes/route-builder';

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="nf-shell">
          <h1>Global Not Found</h1>
          <p>The requested path is outside the supported route contract.</p>
          <a href={buildLocalizedPath(RouteBuilder.landing(), defaultLocale)}>Return home</a>
        </main>
      </body>
    </html>
  );
}

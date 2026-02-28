import {getTranslations} from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <main style={{padding: '48px 20px', maxWidth: 720, margin: '0 auto'}}>
      <h1 style={{fontSize: '2rem', marginBottom: 12}}>{t('title')}</h1>
      <p style={{marginBottom: 20}}>{t('body')}</p>
      <a href="/en">{t('home')}</a>
    </main>
  );
}

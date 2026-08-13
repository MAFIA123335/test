import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('products') };
}

export default function Page() {
  return (
    <Suspense>
      <ProductsClient />
    </Suspense>
  );
}

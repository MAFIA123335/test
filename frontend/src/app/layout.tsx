import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Beauty Center — Luxury Beauty Store', template: '%s | Beauty Center' },
  description: 'Discover premium skincare, makeup, fragrance, and beauty products at Beauty Center.',
  keywords: ['beauty', 'skincare', 'makeup', 'fragrance', 'luxury beauty'],
  openGraph: {
    type: 'website',
    siteName: 'Beauty Center',
    title: 'Beauty Center — Luxury Beauty Store',
    description: 'Discover premium skincare, makeup, fragrance, and beauty products.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

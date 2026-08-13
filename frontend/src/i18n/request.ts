import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Priority: cookie → Accept-Language header → default 'en'
  const cookieLocale = cookieStore.get('locale')?.value;
  const acceptLang = headersList.get('accept-language')?.split(',')[0]?.split('-')[0];
  const locale = (['en', 'ar'].includes(cookieLocale ?? '') ? cookieLocale : null)
    ?? (['en', 'ar'].includes(acceptLang ?? '') ? acceptLang : null)
    ?? 'en';

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

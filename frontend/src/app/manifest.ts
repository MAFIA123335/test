import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beauty Center',
    short_name: 'Beauty Center',
    description: 'Luxury beauty products — skincare, makeup, fragrance',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e8547a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

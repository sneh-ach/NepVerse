import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NepVerse - The Home of Nepali Stories',
    short_name: 'NepVerse',
    description: 'Unlimited Nepali Movies, Originals & Web Series',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#e50914',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['entertainment', 'video', 'streaming'],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
      },
      {
        src: '/screenshot-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
      },
    ],
  }
}



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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    categories: ['entertainment', 'video', 'streaming'],
    screenshots: [],
  }
}



import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localloop.app'

    // Static pages
    const staticPages = [
        '',
        '/auth/login',
        '/auth/signup',
        '/demo',
        '/demo/lists',
    ]

    const staticSitemapEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
        url: `${baseUrl}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
    }))

    // TODO: Add dynamic event pages when we have real data
    // const eventSitemapEntries = await getEventSitemapEntries(baseUrl)

    return [
        ...staticSitemapEntries,
        // ...eventSitemapEntries,
    ]
} 
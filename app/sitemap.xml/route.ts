import { courseService } from '@/lib/services/course'
import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

const STATIC_PATHS = [
    '',
    '/ai',
    '/landing',
    '/ai/search',
]

async function fetchAllCourseSlugs() {
    const data = await courseService.getAllSlugs();
    return data.map((c) => c.slug)
}

export async function GET() {
    // 1) Build static URLs
    const staticUrls = STATIC_PATHS.map(
        (path) => `<url><loc>${BASE_URL}${path}</loc></url>`
    )

    // 2) Fetch dynamic course slugs
    const slugs = await fetchAllCourseSlugs()
    const courseUrls = slugs.map(
        (slug) => `<url><loc>${BASE_URL}/ai/${slug}</loc></url>`
    )

    // 3) Combine & wrap in <urlset>
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
        >
        ${[...staticUrls, ...courseUrls].join('\n  ')}
        </urlset>`

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml',
            // cache for 10 minutes; adjust as needed
            'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
        },
    })
}

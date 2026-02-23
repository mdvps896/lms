import { NextResponse } from 'next/server';
import { GET as getCategories } from '../academic-categories/route';

export const dynamic = 'force-dynamic';

/**
 * Proxy route for /api/categories to /api/academic-categories
 * to maintain compatibility with mobile app.
 */
export async function GET(request) {
    return getCategories(request);
}

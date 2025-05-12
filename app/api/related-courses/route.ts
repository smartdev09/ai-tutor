import { NextResponse } from 'next/server';
import { initModel, getRelated } from '@/lib/recommend';

let initialized = false;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  if (!initialized) {
    await initModel();
    initialized = true;
  }

  const related = getRelated(slug, 3);
  return NextResponse.json(related);
}

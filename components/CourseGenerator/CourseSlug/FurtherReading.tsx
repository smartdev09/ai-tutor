'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
type Related = { slug: string; title?: string };

export default function FurtherReading({ slug }: { slug: string }) {
  const [isHovering, setIsHovering] = useState<string | null>(null);
  
  const { data: related = [] } = useSWR<Related[]>(
    `/api/related-courses?slug=${slug}`,
    fetcher
  );

  if (!related.length) return null;

  const formatTitle = (slug: string) => {
    return slug.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <aside className="mt-10 rounded-xl overflow-hidden shadow-lg border border-purple-100 bg-gradient-to-br from-white to-purple-50">
      <div className="bg-purple-400 py-4 px-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Further Reading
          <Sparkles className="h-4 w-4 ml-2 text-purple-200" />
        </h2>
      </div>
      
      <div className="p-5">
        <ul className="space-y-3">
          {related.map((course) => (
            <li 
              key={course.slug}
              className="transition-all duration-200 ease-in-out"
              onMouseEnter={() => setIsHovering(course.slug)}
              onMouseLeave={() => setIsHovering(null)}
            >
              <Link
                href={`/ai/${course.slug}`}
                className={`
                  flex items-center p-3 rounded-lg transition-all duration-200
                  ${isHovering === course.slug 
                    ? 'bg-purple-100 text-purple-700 transform translate-x-1' 
                    : 'text-purple-700 hover:bg-purple-50'}
                `}
              >
                <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-purple-700 font-medium">
                    {formatTitle(course.slug).charAt(0)}
                  </span>
                </div>
                <span className="font-medium">
                  {course.title || formatTitle(course.slug)}
                </span>
                <ChevronRight 
                  className={`
                    ml-auto h-4 w-4 transition-all duration-200
                    ${isHovering === course.slug ? 'opacity-100' : 'opacity-0'}
                  `} 
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="bg-purple-50 px-6 py-3 border-t border-purple-100">
        <p className="text-sm text-purple-600 font-medium">
          Expand your knowledge with related topics
        </p>
      </div>
    </aside>
  );
}

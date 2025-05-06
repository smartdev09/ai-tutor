'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiCourse } from '@/types';
import { AICourseContent } from './AICourseContent';
import { courseService } from '@/lib/services/course';

interface GetAICourseProps {
  courseSlug: string;
}

export function GetAICourse({ courseSlug }: GetAICourseProps) {
  const router = useRouter();
  const [course, setCourse] = useState<AiCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseSlug) {
      router.push('/ai');
      return;
    }

    setIsLoading(true);
    
    // Fetch the course from storage
    const fetchCourse = async () => {
      const fetchedCourse = await courseService.getCourse(courseSlug);
      if (fetchedCourse) {
        setCourse(fetchedCourse);
        setIsLoading(false);
      } else {
        setError('Course not found');
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseSlug, router]);

  // If course is still loading or not found
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">Error Loading Course</h3>
          <p>{error || 'Course not found'}</p>
        </div>
        <button
          onClick={() => router.push('/ai')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to AI Tutor
        </button>
      </div>
    );
  }

  return (
    <AICourseContent
      courseSlug={courseSlug}
      course={course}
      isLoading={false}
      error=""
      onRegenerateOutline={() => {
        // For regeneration, redirect to the search page with the topic and difficulty
        router.push(`/ai/search?term=${encodeURIComponent(course.title)}&difficulty=${course.difficulty}`);
      }}
    />
  );
}
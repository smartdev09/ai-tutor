'use client';

import { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { useSearchParams } from 'next/navigation';
import { ModuleList } from './CourseDisplay/ModuleList';
import { ErrorState } from './CourseStates/ErrorState';
import { AiCourse, Faqs } from '@/types';
import { useLocale } from 'next-intl';
interface Module {
  title: string;
  lessons: string[];
}

export function GenerateAICourse() {
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<AiCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const lang = useLocale();

  // Get parameters from URL
  const term = searchParams.get('term') || '';
  const difficulty = searchParams.get('difficulty') || 'beginner';
  const instructions = searchParams.get('instructions') || '';
  const goal = searchParams.get('goal') || '';
  const about = searchParams.get('about') || '';

  // Use the completion hook for streaming course generation
  const {
    completion,
    complete,
    isLoading
  } = useCompletion({
    api: '/api/generate-course',
    body: {
      term,
      difficulty,
      instructions,
      goal,
      about,
      lang
    },
    onFinish: (prompt, completion) => {
      try {
        const parsedCourse = parseCourseFromMarkdown(completion);
        if (parsedCourse) {
          setCourse(parsedCourse);
        }
      } catch {
        setError('Failed to parse course content');
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Update course state as new content streams in
  useEffect(() => {
    if (completion) {
      try {
        const parsedCourse = parseCourseFromMarkdown(completion);
        if (parsedCourse && (parsedCourse.title || parsedCourse.modules?.length > 0)) {
          setCourse(parsedCourse);
        }
      } catch {
        console.error('Error parsing streaming content');
      }
    }
  }, [completion]);

  // Start course generation when component mounts
  useEffect(() => {
    if (term && !hasStarted) {
      setHasStarted(true);
      complete('');
    }
  }, [term, hasStarted, complete]);

  // Handle regeneration with optional custom prompt
  const handleRegenerate = (prompt?: string) => {
    setError(null);
    complete(prompt || '');
  };

  // Parse markdown into course structure
  const parseCourseFromMarkdown = (markdown: string): AiCourse | null => {
    try {
      const lines = markdown.split('\n');
      const currentCourse: AiCourse = { title: '', modules: [], difficulty: '', done: [] };
      let currentModule: Module | null = null;
      let processingFAQs = false;
      let currentFaq: Faqs | null = null;

      for (const line of lines) {
        if (processingFAQs) {
          const faqMatch = line.match(/^\d+\.\s+\*\*(.*?)\*\*\s*$/);
          if (faqMatch) {
            if (currentFaq) {
              currentCourse.faqs!.push(currentFaq);
            }
            currentFaq = {
              question: faqMatch[1].trim(),
              answer: ''
            };
          } else {
            if (currentFaq) {
              currentFaq.answer += (currentFaq.answer ? '\n' : '') + line.trim();
            }
          }
        } else if (line.startsWith('**FAQs**')) {
          processingFAQs = true;
          currentCourse.faqs = [];
          currentFaq = null;
        } else if (line.startsWith('# ')) {
          currentCourse.title = line.substring(2).trim();
          currentCourse.slug = currentCourse.title.toLowerCase().replace(/\s+/g, '-');
          currentCourse.difficulty = difficulty;
        } else if (line.startsWith('**Meta Description:**')) {
          currentCourse.metaDescription = line.substring(21).trim();
        } else if (line.startsWith('## ')) {
          if (currentModule) {
            currentCourse.modules.push(currentModule);
          }
          currentModule = {
            title: line.substring(3).trim(),
            lessons: []
          };
        } else if (line.startsWith('- ')) {
          if (currentModule) {
            const cleanedLesson = line.substring(2).replace(/\*/g, '').trim();
            currentModule.lessons.push(cleanedLesson);
          }
        }
      }

      if (currentModule) {
        currentCourse.modules.push(currentModule);
      }

      if (processingFAQs && currentFaq) {
        currentCourse.faqs!.push(currentFaq);
      }

      return currentCourse;
    } catch {
      console.error('Error parsing markdown');
      return null;
    }
  };

  if (error) {
    return <ErrorState error={error} onRetry={() => handleRegenerate()} />;
  }

  if (!course) {
    return null;
  }

  return (
    <div className="w-full">
      <ModuleList isLoading={isLoading} course={course} handleRegenerate={handleRegenerate} />
    </div>
  );
}

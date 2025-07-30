'use client';

import { useState, useEffect, useRef } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { useSearchParams } from 'next/navigation';
import { ModuleList } from './CourseDisplay/ModuleList';
import { ErrorState } from './CourseStates/ErrorState';
import { AiCourse, Faqs, Module } from '@/types';
import { useLocale } from 'next-intl';

export function GenerateAICourse() {
  const buffer=useRef<AiCourse|null>(null)
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<AiCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const lang = useLocale();
  
  // Track the highest module count we've seen to prevent fluctuations
  const highestModuleCountRef = useRef(0);
  const previousCompletionRef = useRef('');

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
          //buffer.current=parsedCourse
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
        // Only process if we have new content
        if (completion.length > previousCompletionRef.current.length) {
          previousCompletionRef.current = completion;
          const parsedCourse = parseCourseFromMarkdown(completion);
          
          if (parsedCourse && (parsedCourse.title || parsedCourse.modules?.length > 0)) {
            // Ensure we never reduce the number of modules
            if (parsedCourse.modules.length >= highestModuleCountRef.current) {
              highestModuleCountRef.current = parsedCourse.modules.length;
              setCourse(parsedCourse);
            } else {
              // If the new parsed course has fewer modules, preserve the previous modules count
              if (course && course.modules.length > parsedCourse.modules.length) {
                // Create a merged course that preserves existing modules
                const mergedModules = [...course.modules];
                
                // Update only the modules that we have in the new parsed course
                for (let i = 0; i < parsedCourse.modules.length; i++) {
                  mergedModules[i] = parsedCourse.modules[i];
                }
                
                const mergedCourse = {
                  ...parsedCourse,
                  modules: mergedModules
                };
                
                setCourse(mergedCourse);
              } else {
                setCourse(parsedCourse);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error parsing streaming content', err);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Reset our tracking variables
    highestModuleCountRef.current = 0;
    previousCompletionRef.current = '';
    complete(prompt || '');
  };

  // Parse markdown into course structure
  const parseCourseFromMarkdown = (markdown: string): AiCourse | null => {
    try {
      const lines = markdown.split('\n');
      const currentCourse: AiCourse = { title: '', modules: [], difficulty: '', done: [], owners: [] };
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
            currentModule.lessons.push({
              title: cleanedLesson,
              content: ""
            });
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
    } catch (err) {
      console.error('Error parsing markdown', err);
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
      <ModuleList 
        isLoading={isLoading} 
        course={course} 
        handleRegenerate={handleRegenerate} 
        streamingModuleIndex={isLoading ? course.modules.length - 1 : -1}
      />
    </div>
  );
}
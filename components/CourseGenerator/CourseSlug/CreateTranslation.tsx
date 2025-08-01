'use client';

import { useState, useEffect, useRef } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { AiCourse, Faqs, Module } from '@/types';

// Standalone utility function to parse markdown into a course object
const parseCourseFromMarkdown = (markdown: string, difficulty: string): AiCourse | null => {
  try {
    const lines = markdown.split('\n');
    const currentCourse: AiCourse = { title: '', modules: [], difficulty: '', done: [], owners: [],language_code:useLocale()==''?'en':useLocale() };
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

/**
 * A custom hook to translate an existing course into a new language.
 * @param {AiCourse | null} initialCourse - The existing course object to translate.
 * @param {string} targetLang - The language code for the translation (e.g., 'es').
 * @returns {{ course: AiCourse | null, isLoading: boolean, error: string | null, handleRegenerate: (prompt?: string) => void }}
 */
export function useGenerateAICourse(initialCourse: AiCourse | null, targetLang: string) {
  const [course, setCourse] = useState<AiCourse | null>(initialCourse);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const highestModuleCountRef = useRef(0);
  const previousCompletionRef = useRef('');

  // The hook now receives the difficulty from the initial course
  const difficulty = initialCourse?.difficulty || 'beginner';

  const {
    completion,
    complete,
    isLoading
  } = useCompletion({
    api: '/api/generate-course', // Assuming this API can handle translation requests
    body: {
      course: initialCourse,
      lang: targetLang
    },
    onFinish: (prompt, completion) => {
      try {
        const parsedCourse = parseCourseFromMarkdown(completion, difficulty);
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

  useEffect(() => {
    if (completion) {
      try {
        if (completion.length > previousCompletionRef.current.length) {
          previousCompletionRef.current = completion;
          const parsedCourse = parseCourseFromMarkdown(completion, difficulty);

          if (parsedCourse && (parsedCourse.title || parsedCourse.modules?.length > 0)) {
            if (parsedCourse.modules.length >= highestModuleCountRef.current) {
              highestModuleCountRef.current = parsedCourse.modules.length;
              setCourse(parsedCourse);
            } else {
              if (course && course.modules.length > parsedCourse.modules.length) {
                const mergedModules = [...course.modules];

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
  }, [completion, course, difficulty]);

  // The trigger for generation is now based on the existence of a course and target language
  useEffect(() => {
    if (initialCourse && targetLang && !hasStarted) {
      setHasStarted(true);
      complete('');
    }
  }, [initialCourse, targetLang, hasStarted, complete]);

  const handleRegenerate = (prompt?: string) => {
    setError(null);
    highestModuleCountRef.current = 0;
    previousCompletionRef.current = '';
    complete(prompt || '');
  };

  return { course, isLoading, error, handleRegenerate };
}

// Example of how a component would use the custom hook
export function GenerateAICourse({ initialCourse, targetLang }: { initialCourse: AiCourse | null, targetLang: string }) {
  const { course, isLoading, error, handleRegenerate } = useGenerateAICourse(initialCourse, targetLang);

  if (error) {
    // Assuming ErrorState is a component you have defined
    // return <ErrorState error={error} onRetry={() => handleRegenerate()} />;
    return <div>Error: {error}</div>;
  }

  if (!course && isLoading) {
    return <div>Loading...</div>; // Placeholder for a loading state
  }
  
  if (!course) {
    return null;
  }

  // Assuming ModuleList is a component that renders the course
  // return (
  //   <div className="w-full">
  //     <ModuleList
  //       isLoading={isLoading}
  //       course={course}
  //       handleRegenerate={handleRegenerate}
  //       streamingModuleIndex={isLoading ? course.modules.length - 1 : -1}
  //     />
  //   </div>
  // );

  // Placeholder for rendering the course content
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{course.title}</h1>
      <p>{course.metaDescription}</p>
      <div className="mt-4">
        {course.modules?.map((module, index) => (
          <div key={index} className="border-b py-2">
            <h2 className="text-xl font-semibold">{module.title}</h2>
            <ul className="list-disc pl-5">
              {module.lessons.map((lesson, lessonIndex) => (
                <li key={lessonIndex}>{lesson.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

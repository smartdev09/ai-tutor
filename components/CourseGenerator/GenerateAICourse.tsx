'use client';

import { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { useSearchParams } from 'next/navigation';
import { ModuleList } from './CourseDisplay/ModuleList';
import { ErrorState } from './CourseStates/ErrorState';
import { AiCourse } from '@/types';
interface Module {
  title: string;
  lessons: string[];
}

export function GenerateAICourse() {
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<AiCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Get parameters from URL
  const term = searchParams.get('term') || '';
  const difficulty = searchParams.get('difficulty') || 'beginner';
  const instructions = searchParams.get('instructions') || '';
  const goal = searchParams.get('goal') || '';
  const about = searchParams.get('about') || '';

  // Use the completion hook for streaming course generation
  const {
    completion,
    complete
  } = useCompletion({
    api: '/api/generate-course',
    body: {
      term,
      difficulty,
      instructions,
      goal,
      about
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

      for (const line of lines) {
        if (line.startsWith('# ')) {
          currentCourse.title = line.substring(2).trim();
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
            currentModule.lessons.push(line.substring(2).trim());
          }
        }
      }

      if (currentModule) {
        currentCourse.modules.push(currentModule);
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
      <ModuleList course={course} handleRegenerate={handleRegenerate}/>
    </div>
  );
}

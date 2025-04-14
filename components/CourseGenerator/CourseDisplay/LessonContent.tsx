import { Module } from '@/types';
import { useCompletion } from '@ai-sdk/react';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { parseContentFromMarkdown } from '@/lib/utils';

interface LessonContentProps {
  module: Module;
}

export function LessonContent({ module }: LessonContentProps) {
  const {
    completion,
    complete,
    isLoading
  } = useCompletion({
    api: '/api/generate-lesson',
    body: {
      moduleTitle: module.title,
      lessons: module.lessons
    }
  });

  useEffect(() => {
    if (!completion) {
      complete('');
    }
  }, [module.title, complete, completion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const parsedContent = parseContentFromMarkdown(completion);

  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: parsedContent }}
    />
  );
} 
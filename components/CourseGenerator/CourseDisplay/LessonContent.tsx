import { Module } from '@/types';
import { useCompletion } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { parseContentFromMarkdown } from '@/lib/utils';

interface LessonContentProps {
  module: Module;
  onModuleProcessed: () => void;
  viewMode: boolean;
}

export function LessonContent({ module, onModuleProcessed, viewMode }: LessonContentProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  const {
    completion,
    complete,
    isLoading,
    error
  } = useCompletion({
    api: '/api/generate-lesson',
    body: {
      moduleTitle: module?.title,
      lessonTitle: module?.lessons[currentLessonIndex] || ''
    }
  });

  // Reset state when module changes
  useEffect(() => {
    setCurrentLessonIndex(0);
    // setProcessedContents([]);
    setIsProcessing(true);
    
    // Start processing the first lesson of the selected module
    complete('');
  }, [module?.title, complete]);

  // Handle completion response
  useEffect(() => {
    if (completion && !isLoading && isProcessing) {
      
      // Add delay before moving to next lesson
      const timer = setTimeout(() => {
        if (currentLessonIndex < module?.lessons?.length - 1) {
          // Move to next lesson in the module
          setCurrentLessonIndex(prevIndex => prevIndex + 1);
          // Trigger API call for the next lesson
          complete('');
        } else {
          // All lessons in this module are processed
          setIsProcessing(false);
          onModuleProcessed();
        }
      }, 1500); // Adjust timing as needed
      
      return () => clearTimeout(timer);
    }
  }, [completion, isLoading, currentLessonIndex, module?.lessons?.length, onModuleProcessed, complete, isProcessing]);

  // Parse the completion for display
  const parsed = parseContentFromMarkdown(completion || '');

  return (
    <div className="space-y-4">
      <div className="bg-muted/20 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">{module?.title}</h2>
        <p className="text-sm text-muted-foreground">
          {`Processing Lesson ${currentLessonIndex + 1} of ${module?.lessons?.length}: ${module?.lessons[currentLessonIndex] || ''}`}
        </p>
        {!viewMode && (
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentLessonIndex + (isLoading ? 0 : 1)) / module?.lessons?.length) * 100}%` }}
            />
          </div>
        )}
      </div>
      
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: parsed }}
      />
      
      {error && (
        <div className="text-destructive p-4 border border-destructive/20 rounded-lg">
          Error loading lesson content. Please try again.
        </div>
      )}
    </div>
  );
}
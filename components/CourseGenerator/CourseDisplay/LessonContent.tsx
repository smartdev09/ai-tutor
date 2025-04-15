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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedLessons, setProcessedLessons] = useState<Record<number, string>>({});

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

  // Parse content for current lesson
  const currentContent = processedLessons[currentLessonIndex] || '';
  const parsedContent = parseContentFromMarkdown(viewMode ? currentContent : (completion || ''));

  // Reset state when module changes
  useEffect(() => {
    setCurrentLessonIndex(0);
    
    // Only start processing if not in view mode
    if (!viewMode) {
      setIsProcessing(true);
      complete('');
    }
  }, [module?.title, complete, viewMode]);

  // Handle completion response and lesson processing
  useEffect(() => {
    if (!isLoading && completion && isProcessing && !viewMode) {
      // Store processed lesson content
      setProcessedLessons(prev => ({
        ...prev,
        [currentLessonIndex]: completion
      }));
      
      // Wait a moment after streaming completes before moving to next lesson
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
          setCurrentLessonIndex(0)
        }
      }, 1500); // Adjust timing as needed
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, completion, currentLessonIndex, module?.lessons?.length, onModuleProcessed, complete, isProcessing, viewMode]);

  // Handle lesson navigation in view mode
  const navigateToLesson = (index: number) => {
    if (viewMode && index >= 0 && index < module?.lessons?.length) {
      setCurrentLessonIndex(index);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/20 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">{module?.title}</h2>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {`Lesson ${currentLessonIndex} of ${module?.lessons?.length}: ${module?.lessons[currentLessonIndex - 1] || ''}`}
          </p>
          {isLoading && !viewMode && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
              <span>Streaming content...</span>
            </div>
          )}
        </div>
        
        {/* Lesson navigation in view mode */}
        {viewMode && module?.lessons?.length > 1 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {module?.lessons?.map((lesson, index) => (
              <button
                key={index}
                onClick={() => navigateToLesson(index)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  currentLessonIndex === index 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className="prose prose-sm max-w-none relative min-h-[200px]"
        dangerouslySetInnerHTML={{ __html: parsedContent }}
      />
      
      {error && !viewMode && (
        <div className="text-destructive p-4 border border-destructive/20 rounded-lg mt-4">
          Error loading lesson content. Please try again.
        </div>
      )}
      
      {/* Lesson navigation buttons */}
      {viewMode && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => navigateToLesson(currentLessonIndex - 1)}
            disabled={currentLessonIndex === 0}
            className={`px-4 py-2 rounded-md text-sm ${
              currentLessonIndex === 0 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Previous Lesson
          </button>
          
          <button
            onClick={() => navigateToLesson(currentLessonIndex + 1)}
            disabled={currentLessonIndex === module?.lessons?.length - 1}
            className={`px-4 py-2 rounded-md text-sm ${
              currentLessonIndex === module?.lessons?.length - 1 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            Next Lesson
          </button>
        </div>
      )}
    </div>
  );
}
import { AiCourse } from '@/types';
import { generateAiCourseStructure, generateSlug } from './ai';
import { storeCourse, getCourseBySlug } from './storage';

export async function generateCourse({
  term,
  difficulty,
  slug = '',
  onCourseIdChange,
  onCourseSlugChange,
  onCourseChange,
  onLoadingChange,
  onError,
  instructions = '',
  goal = '',
  about = '',
  isForce = false,
  prompt = '',
}: {
  term: string;
  difficulty: string;
  slug?: string;
  onCourseIdChange?: (id: string) => void;
  onCourseSlugChange?: (slug: string) => void;
  onCourseChange?: (course: AiCourse) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
  instructions?: string;
  goal?: string;
  about?: string;
  isForce?: boolean;
  prompt?: string;
}): Promise<AiCourse | null> {
  try {
    onLoadingChange?.(true);

    // Check if we already have this course
    if (slug && !isForce) {
      const existingCourse = getCourseBySlug(slug);
      if (existingCourse) {
        onCourseIdChange?.(existingCourse.id || '');
        onCourseSlugChange?.(existingCourse.slug || '');
        onCourseChange?.(existingCourse);
        onLoadingChange?.(false);
        return existingCourse;
      }
    }

    // Construct our API request body
    const body = {
      term,
      difficulty,
      instructions,
      goal,
      about,
      prompt,
    };

    // Call our course generation API
    const response = await fetch('/api/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate course');
    }

    // Get the generated course content
    const data = await response.text();
    
    // Parse the course structure
    const courseStructure = generateAiCourseStructure(data);
    
    // Create the complete course object
    const course: AiCourse = {
      ...courseStructure,
      difficulty,
      done: [],
      slug: slug || generateSlug(courseStructure.title)
    };

    // Store the course
    const savedCourse = storeCourse(course);
    
    // Update state through callbacks
    onCourseIdChange?.(savedCourse.id || '');
    onCourseSlugChange?.(savedCourse.slug || '');
    onCourseChange?.(savedCourse);
    
    return savedCourse;
  } catch (error) {
    console.error('Error generating course:', error);
    onError?.(error instanceof Error ? error.message : 'An unexpected error occurred');
    return null;
  } finally {
    onLoadingChange?.(false);
  }
}

export async function generateLessonContent({
  courseId,
  moduleTitle,
  lessonTitle,
  onContentChange,
  onLoadingChange,
  onError,
}: {
  courseId: string;
  moduleTitle: string;
  lessonTitle: string;
  onContentChange?: (content: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
}): Promise<string | null> {
  try {
    onLoadingChange?.(true);

    // Construct our API request body
    const body = {
      courseId,
      moduleTitle,
      lessonTitle,
    };

    // Call our lesson content generation API
    const response = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate lesson content');
    }

    // Get the generated lesson content
    const content = await response.text();
    
    // Update state through callback
    onContentChange?.(content);
    
    return content;
  } catch (error) {
    console.error('Error generating lesson content:', error);
    onError?.(error instanceof Error ? error.message : 'An unexpected error occurred');
    return null;
  } finally {
    onLoadingChange?.(false);
  }
}
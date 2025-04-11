// hooks/use-course-generator.ts
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface Topic {
  title: string;
  description: string;
  sequenceNumber: number;
}

interface CourseData {
  title: string;
  description: string;
  subject: string;
  subCategory: string;
  difficultyLevel: string;
}

export function useCourseGenerator() {
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<Topic[]>([]);
  
  // Generate course topics
  const generateTopics = async (courseData: CourseData) => {
    try {
      setIsGeneratingTopics(true);
      setGeneratedTopics([]);
      
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate topics');
      }
      
      const data = await response.json();
      setGeneratedTopics(data.topics);
      
      toast({
        title: 'Topics Generated',
        description: `Successfully generated ${data.topics.length} topics for your course.`,
      });
      
      return data.topics;
    } catch (error: any) {
      console.error('Error generating topics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate topics. Please try again.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsGeneratingTopics(false);
    }
  };
  
  // Save course to database
  const saveCourse = async (courseData: CourseData): Promise<string | null> => {
    try {
      if (generatedTopics.length === 0) {
        toast({
          title: 'No Topics',
          description: 'Please generate top
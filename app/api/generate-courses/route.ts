import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/lib/services/course';
import { Owner } from '@/types';

// Types for the request payload
type CoursePayload = {
  id?: string;
  metaDescription?: string;
  title: string;
  keywords:string|string[]|undefined,
  modules: {
    id?: string;
    title: string;
    position: number;
    lessons: {
      id?: string;
      title: string;
      content?: string;
      position: number;
    }[];
  }[];
  difficulty: string;
  done?: string[];
  slug?: string;
  faqs?: {
    question: string;
    answer: string;
  }[];
  owners: Owner[];
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const course: CoursePayload = await request.json();
    course.owners = [Owner.USER]
    
    // Validate the required fields
    if (!course.title) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
    }
    
    if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      return NextResponse.json({ error: 'Course must have at least one module' }, { status: 400 });
    }
    
    if (!course.difficulty) {
      return NextResponse.json({ error: 'Course difficulty is required' }, { status: 400 });
    }
    
    // Create the course using the courseService
    const createdCourse = await courseService.createCourse(course);
    
    // Return the created course
    return NextResponse.json({ 
      success: true,
      message: 'Course created successfully',
      course: createdCourse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create course',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}
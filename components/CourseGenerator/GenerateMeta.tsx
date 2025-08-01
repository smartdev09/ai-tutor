'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { courseService } from "@/lib/services/course"
import {  Owner, } from '@/types';
import { DBCourse, DBModule, DBLesson } from '@/types';

type CourseProcessingStatus = {
  course: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  metadata?: DBCourse;
};

export default function GenerateMeta() {
  const searchParams = useSearchParams();
  const [coursesStatus, setCoursesStatus] = useState<CourseProcessingStatus[]>([]);
  const [overallLoading, setOverallLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function processCourses() {
      // Get courses from URL params - could be single or multiple
      const term = searchParams.get('term');
      const difficulty = searchParams.get('difficulty');
      const coursesParam = searchParams.get('courses'); // JSON string of courses array
      
      let coursesToProcess: string[] = [];
      
      if (coursesParam) {
        // Multiple courses sent as JSON
        try {
          coursesToProcess = JSON.parse(coursesParam);
        } catch (err) {
          console.error('Failed to parse courses parameter:', err);
          return;
        }
      } else if (term) {
        // Single course (backwards compatibility)
        coursesToProcess = [term];
      }

      if (!coursesToProcess.length || !difficulty) {
        console.log("No courses or difficulty provided");
        return;
      }

      // Initialize status for all courses
      const initialStatus: CourseProcessingStatus[] = coursesToProcess.map(course => ({
        course,
        status: 'pending'
      }));
      
      setCoursesStatus(initialStatus);
      setOverallLoading(true);
      setCompletedCount(0);

      // Process each course
      for (let i = 0; i < coursesToProcess.length; i++) {
        const course = coursesToProcess[i];
        
        // Update status to processing
        setCoursesStatus(prev => prev.map(item => 
          item.course === course 
            ? { ...item, status: 'processing' }
            : item
        ));

        try {
          await processSingleCourse(course, difficulty);
          
          // Update status to completed
          setCoursesStatus(prev => prev.map(item => 
            item.course === course 
              ? { ...item, status: 'completed' }
              : item
          ));
          
          setCompletedCount(prev => prev + 1);
          
        } catch (error) {
          console.error(`Error processing course "${course}":`, error);
          
          // Update status to error
          setCoursesStatus(prev => prev.map(item => 
            item.course === course 
              ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
              : item
          ));
        }
      }

      setOverallLoading(false);
    }

    processCourses();
  }, []);

  const processSingleCourse = async (course: string, difficulty: string): Promise<void> => {
    const prompt = `${course} difficulty:${difficulty}`;

    try {
      // Fetch metadata from API
      const res = await fetch('../../api/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch metadata for "${course}"`);
      }

      const metadata = await res.json();
      const jsonstring = JSON.stringify(metadata.metadata);
      
      console.log(`Metadata for "${course}":`, metadata);
      
      // Parse the course data
      const DBcourse = parseCourseJSON(jsonstring);
      
      // Update the status with metadata
      setCoursesStatus(prev => prev.map(item => 
        item.course === course 
          ? { ...item, metadata: DBcourse }
          : item
      ));

      // Save to database
      console.log(`Creating course "${course}" in database...`);
      console.log(`Difficulty: ${difficulty} -> ${DBcourse.difficulty}`);
      
      const result = await courseService.createMeta(DBcourse);
      console.log(`Course "${course}" created successfully:`, result);

    } catch (error) {
      console.error(`Error processing "${course}":`, error);
      throw error;
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Course Metadata Generator</h1>
      
      {/* Overall Progress */}
      {overallLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Processing Courses...</span>
            <span className="text-sm text-gray-600">
              {completedCount} / {coursesStatus.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / coursesStatus.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {!overallLoading && coursesStatus.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-semibold text-green-800">Processing Complete!</h2>
          <p className="text-green-700">
            Successfully processed {coursesStatus.filter(c => c.status === 'completed').length} out of {coursesStatus.length} courses.
          </p>
        </div>
      )}

      {/* Individual Course Status */}
      <div className="space-y-4">
        {coursesStatus.map((courseStatus, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{courseStatus.course}</h3>
              <StatusBadge status={courseStatus.status} />
            </div>

            {courseStatus.status === 'processing' && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Generating metadata...</span>
              </div>
            )}

            {courseStatus.status === 'error' && (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{courseStatus.error}</p>
              </div>
            )}

            {courseStatus.status === 'completed' && courseStatus.metadata && (
              <div className="bg-gray-50 p-4 rounded mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Slug:</strong> <code>{courseStatus.metadata.slug}</code>
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Difficulty:</strong> {courseStatus.metadata.difficulty}
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Description:</strong> {courseStatus.metadata.metaDescription}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm mb-1"><strong>Modules ({courseStatus.metadata.modules?.length || 0}):</strong></p>
                    <ul className="list-disc list-inside text-sm text-gray-700 mb-2">
                      {courseStatus.metadata.modules?.slice(0, 3).map((mod: DBModule, i: number) => (
                        <li key={i}>{mod.title}</li>
                      ))}
                      {(courseStatus.metadata.modules?.length || 0) > 3 && (
                        <li className="text-gray-500">...and {(courseStatus.metadata.modules?.length || 0) - 3} more</li>
                      )}
                    </ul>

                    <p className="text-sm mb-1"><strong>Keywords:</strong></p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(courseStatus.metadata.keywords) ? (
                        courseStatus.metadata.keywords.slice(0, 4).map((keyword, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {courseStatus.metadata.keywords}
                        </span>
                      )}
                      {Array.isArray(courseStatus.metadata.keywords) && courseStatus.metadata.keywords.length > 4 && (
                        <span className="text-gray-500 text-xs px-2 py-1">
                          +{courseStatus.metadata.keywords.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

// Status Badge Component
const StatusBadge = ({ status }: { status: CourseProcessingStatus['status'] }) => {
  const statusConfig = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' }
  };

  const config = statusConfig[status];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

/**
 * Parses AI-generated course JSON into a DBCourse object.
 */
export function parseCourseJSON(jsonString: string): DBCourse {
  try {
    const parsed = JSON.parse(jsonString);

    if (
      !parsed.title ||
      !parsed.slug ||
      !parsed.modules ||
      !Array.isArray(parsed.modules)
    ) {
      throw new Error("Missing required fields in course JSON");
    }

    const dbModules: DBModule[] = parsed.modules.map((mod: any, modIndex: number) => ({
      title: mod.title,
      position: modIndex + 1,
      lessons: (mod.lessons || []).map((lesson: any, lessonIndex: number): DBLesson => ({
        title: lesson.title,
        content: lesson.content || '',
        position: lessonIndex + 1,
      })),
    }));

    const dbCourse: DBCourse = {
      title: parsed.title,
      slug: parsed.slug,
      keywords: parsed.keywords || [],
      metaDescription: parsed.description || '',
      difficulty: parsed.difficulty || 'Intermediate',
      modules: dbModules,
      owners: parsed.owners || [Owner.STAFF],
      done: parsed.done || [],
      faqs: parsed.faqs || [],
    };

    return dbCourse;
  } catch (err) {
    console.error("(parse course json:) Failed to parse course JSON:", err);
    throw err;
  }
}
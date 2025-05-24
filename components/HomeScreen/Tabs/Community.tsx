import React, { useEffect, useState } from 'react';
import CourseCard from '../CourseCard';
import SearchHeader from '../SearchHeader';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';
import { Loader } from 'lucide-react';

const ExploreCourses: React.FC = () => {

  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true)
      const data = await courseService.getAllCourses("COMMUNITY");
      setLoading(false)
      setCourses(data);
    }

    fetchCourses();
  }, []);

  return (
    <div className="w-full max-w-screen p-4">
      <SearchHeader title="Explore Courses" />


      {loading ? (
        <div className="flex justify-center items-center h-[80vh] w-full">
          <Loader size={60} className="animate-spin text-purple-500" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[70vh] w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 9.75h.008v.008H9.75V9.75zM3 3h18v18H3V3zm4.5 13.5h9m-9-3h6"
            />
          </svg>
          <p className="text-gray-600 text-xl font-semibold mb-1">No Courses Found</p>
          <p className="text-gray-500 text-sm">Check back later</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id ?? ''}
            slug={course.slug || ''}
            level={course.difficulty}
            title={course.title}
            modules={course.modules.length}
            progress={50}
          />
        ))}
      </div>
      )}
    </div>
  );
};

export default ExploreCourses;
import React, { useEffect, useState } from 'react';
import CourseCard from '../CourseCard';
import SearchHeader from '../SearchHeader';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';
import { Loader } from 'lucide-react';

const YourCourses: React.FC = () => {
  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true)
      const data = await courseService.getAllCourses("USER");
      setLoading(false)
      setCourses(data);
    }

    fetchCourses();
  }, []);

  return (
    <div className="w-full max-w-screen p-4">
      <SearchHeader title="Your Courses" />

      {loading ? (
        <div className="flex justify-center items-center h-[80vh] w-full">
          <Loader size={60} className="animate-spin text-purple-500" />
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

export default YourCourses;
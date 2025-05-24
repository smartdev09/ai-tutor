import React, { useEffect, useState } from 'react';
import CourseCard from '../CourseCard';
import SearchHeader from '../SearchHeader';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';
import { ArrowRight, Loader, User } from 'lucide-react';
import { getCookie } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const YourCourses: React.FC = () => {
  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [loading, setLoading] = useState(false)
  const router = useRouter();

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true)
      const id = getCookie('user_id');
      if (id) {
        const data = await courseService.getAllCourses("USER", id);
        setCourses(data);
      }
      setLoading(false)
    }

    fetchCourses();
  }, []);

  const handleLoginClick = () => {
    router.push('/auth');
  };

  return (
    <div className="w-full max-w-screen p-4">
      <SearchHeader title="Your Courses" />

      {loading ? (
        <div className="flex justify-center items-center h-[80vh] w-full">
          <Loader size={60} className="animate-spin text-purple-500" />
        </div>
      ) : !getCookie('user_id') ? (
        <div className="flex flex-col justify-center items-center min-h-[70vh] w-full px-4">
          <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardContent className="flex flex-col items-center text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-100 rounded-full blur-xl opacity-60"></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-full shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back!</h2>
                <p className="text-gray-600 leading-relaxed">
                  Please sign in to access your courses and continue your learning journey.
                </p>
              </div>

              <Button
                onClick={handleLoginClick}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                Sign In to Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                {"Don't have an account? "}
                <button onClick={handleLoginClick} className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2">
                  Sign up here
                </button>
              </p>
            </CardContent>
          </Card>
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

export default YourCourses;
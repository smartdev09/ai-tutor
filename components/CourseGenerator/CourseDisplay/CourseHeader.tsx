import { AiCourse } from '@/types';

interface CourseHeaderProps {
  course: AiCourse;
}

export function CourseHeader({ course }: CourseHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
    </div>
  );
} 
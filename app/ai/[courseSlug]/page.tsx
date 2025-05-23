import { GetAICourse } from '@/components/CourseGenerator/GetAICourse';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';

type PageParams = {
  params: Promise<{ courseSlug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const resolvedParams = await params;
  const fetchedCourse: AiCourse = await courseService.getCourse(
    decodeURIComponent(resolvedParams.courseSlug)
  );
  
  return {
    title: fetchedCourse.title,
    description: fetchedCourse.metaDescription,
  };
}

export default async function AICourseDynamicPage({ params }: PageParams) {
  const resolvedParams = await params;
  
  return (
    <main className="min-h-screen bg-gray-50">
      <GetAICourse courseSlug={decodeURIComponent(resolvedParams.courseSlug)} />
    </main>
  );
}
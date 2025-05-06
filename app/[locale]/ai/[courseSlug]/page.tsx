import { GetAICourse } from '@/components/CourseGenerator/GetAICourse';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';

interface AICourseDynamicPageProps {
  params: {
    courseSlug: string;
  };
}

export async function generateMetadata(
  { params }: { params: Promise<AICourseDynamicPageProps['params']> }
) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.courseSlug);
  const fetchedCourse: AiCourse = await courseService.getCourse(slug);
  return {
    title: `${fetchedCourse.title}`,
    description: `${fetchedCourse.metaDescription}`,
  };
}


export default async function AICourseDynamicPage({ params }: AICourseDynamicPageProps) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.courseSlug);
  return (
    <main className="min-h-screen bg-gray-50">
      <GetAICourse courseSlug={decodeURIComponent(slug)} />
    </main>
  );
}
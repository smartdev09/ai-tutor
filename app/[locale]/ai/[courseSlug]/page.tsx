import { GetAICourse } from '@/components/CourseGenerator/GetAICourse';
import { courseService } from '@/lib/services/course';
import { AiCourse } from '@/types';

type Params = Promise<{ courseSlug: string }>

export async function generateMetadata({ params }: { params: { courseSlug: string } }) {
  const fetchedCourse: AiCourse = await courseService.getCourse(decodeURIComponent(params.courseSlug));
  return {
    title: fetchedCourse.title,
    description: fetchedCourse.metaDescription,
  };
}

export default async function AICourseDynamicPage({ params }: { params: Params }) {
  const slug = await params;
  return (
    <main className="min-h-screen bg-gray-50">
      <GetAICourse courseSlug={decodeURIComponent(slug.courseSlug)} />
    </main>
  );
}
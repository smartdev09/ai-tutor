import { GetAICourse } from '@/components/CourseGenerator/GetAICourse';

interface AICourseDynamicPageProps {
  params: {
    courseSlug: string;
  };
}

export function generateMetadata({ params }: AICourseDynamicPageProps) {
  return {
    title: `AI Course - ${params.courseSlug}`,
    description: 'Learn with an AI-generated personalized course',
  };
}

export default function AICourseDynamicPage({ params }: AICourseDynamicPageProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      <GetAICourse courseSlug={params.courseSlug} />
    </main>
  );
}
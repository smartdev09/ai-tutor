import { GenerateAICourse } from '@/components/CourseGenerator/GenerateAICourse';

export const metadata = {
  title: 'Generating AI Course',
  description: 'Creating your personalized learning course with AI',
};

export default function AISearchPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <GenerateAICourse />
    </main>
  );
}
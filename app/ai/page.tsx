import { AICourse } from '@/components/CourseGenerator/AICourse';

export const metadata = {
  title: 'AI Course Generator',
  description: 'Create customized learning courses with AI',
};

export default function AIPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <AICourse />
    </main>
  );
}
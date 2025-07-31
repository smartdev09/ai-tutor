//import { GenerateAICourse } from '@/components/CourseGenerator/GenerateAICourse';
import LanguageSwitcher from '@/components/lang-switch';
import GenerateMeta from '@/components/CourseGenerator/GenerateMeta';
export const metadata = {
  title: 'Generating AI Course for Admin',
  description: 'Creating your personalized learning course with AI',
};

export default function AISearchPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <LanguageSwitcher/>
      <GenerateMeta />
    </main>
  );
}
import { useRouter } from 'next/navigation';
import React from 'react';

interface CourseCardProps {
  key: string
  slug: string
  level: string;
  title: string;
  modules: number;
  progress?: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ slug, level, title, modules, progress }) => {
  const router = useRouter();
  const handleSlug = (): void => {
    router.push(`/ai/${slug}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" onClick={handleSlug}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-green-500 text-xs font-medium">{level}</span>
        {progress !== undefined && (
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>
      <h3 className="font-medium text-base mb-4">{title}</h3>
      <div className="flex items-center text-xs text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        {modules} modules
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-purple-500 h-1.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
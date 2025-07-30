import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Module } from '@/types'; // adjust this path
function parseMeta(raw:any) {
  // Remove surrounding braces
  const trimmed = raw.trim().replace(/^\{|\}$/g, "");

  // Split only on the first comma that separates metaDescription and keywords
  const commaIndex = trimmed.indexOf(", keywords:");
  const descPart = trimmed.slice(0, commaIndex).replace("metaDescription:", "").trim();
  const keywordsPart = trimmed.slice(commaIndex + 10).trim(); // 10 is length of ', keywords:'

  return {
    temp: descPart,
    key: keywordsPart.split(",").map((k:any) => k.trim()),
  };
}



interface MetaCardProps {
  slug: string;
  difficulty: string;
  title: string;
  metaDescription: string;
  progress?: number;
  keywords: string | string[];
  modules: Module[];
}

const CourseCard: React.FC<MetaCardProps> = ({
  slug,
  difficulty,
  title,
  metaDescription,
  keywords,
  modules,
  progress
}) => {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);
const [description,setDesc]=useState<string|string[]|undefined>(metaDescription)
const[keyword,setKeyword]=useState<string|string[]|undefined>('')
  useEffect(() => {
    console.log(`${slug} and ${metaDescription}`);
    console.log('meta-card');
const meta = '{metaDescription:here here, keywords:1,2,3,4}';
const{temp,key}=parseMeta(metaDescription)

setDesc(temp)
setKeyword(key)
console.log(temp); // "Learn Flask"
console.log(key); // ["python", "flask"]



  }, []);

  const handleSlug = (): void => {
    setIsPressed(true);
    // router.push(`/ai/${slug}`)
  };

  return isPressed ? (
    <>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-2">Slug: <code>{slug}</code></p>

        <p><strong>Description:</strong> {description}</p>

        <p><strong>Modules:</strong></p>
        <ul className="list-disc list-inside mb-2">
          {modules.map((mod, i) => (
            <li key={i}>{mod.title}</li>
          ))}
        </ul>

        <p><strong>Keywords:</strong> 
        {Array.isArray(keyword) ? keyword.join(', ') : keyword}
        </p>
      </div>
    </>
  ) : (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer" onClick={handleSlug}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-green-500 text-xs font-medium">{difficulty}</span>
      </div>
      <h3 className="font-medium text-base mb-4">{title}</h3>
      <div className="flex items-center text-xs text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        {modules.length} modules
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

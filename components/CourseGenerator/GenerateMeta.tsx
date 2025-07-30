'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { courseService } from "@/lib/services/course"
import { AiCourse, Owner, } from '@/types';
import { DBCourse, DBModule, DBLesson, Faqs } from '@/types'; // adjust path as needed
import { Divide } from 'lucide-react';

type CourseMetadata = {
  title: string;
  slug: string;
  keywords: string[];
  description: string;
  modules: DBModule[];
  difficulty:string
metaDescription: string
};

export default function GenerateMeta() {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [metadata, setMetadata] = useState<DBCourse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  //const handleSubmit = async (e: React.FormEvent) => {
    //e.preventDefault();const difficuconst difficulty:stringlty:string
    useEffect(()=>{

        async function fetchMeta(){
             const term = searchParams.get('term') // string | null
  const difficulty = searchParams.get('difficulty')
          if(!term || !difficulty){
            console.log("no term or difficulty in generateMeta.tsx received")
          return;} 
   
  console.log(`params: "${difficulty}`)
            setMetadata(null);
    setError('');
    setLoading(true);

    //const prompt = inputRef.current?.value?.trim();
    const prompt=term + ` difficulty:${difficulty}`
    if (!prompt) {
      setError('Please enter a prompt.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('../../api/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch metadata.');
      }

      const metadata  = await res.json();
      const jsonstring=JSON.stringify(metadata.metadata)
      setMetadata(metadata);
      console.log(`metadata after res.json:${metadata}`)
//    const DBcourse:AiCourse={
//     title:metadata.title,
//     metaDescription:JSON.stringify({keywords:metadata.keywords,modules:metadata.modules,description:metadata.description}),
//     //description:metadata.description,
//  owners: [Owner.STAFF] ,
// difficulty:difficulty,
// modules: 
// }
console.log(jsonstring)
const DBcourse=parseCourseJSON(jsonstring)
     // setMetadata();
setMetadata(DBcourse)
try {
  console.log("Creating course...");
  console.log(DBcourse)
console.log(`diff be4 rqst:${difficulty} and ${DBcourse.difficulty}`)
  const result = await courseService.createMeta(DBcourse);

  console.log("Course created successfully:", result);
} catch (error) {
  console.log("Error while creating course:", error);
}

    } catch (err) {
      console.error(err);
      setError('An error occurred while generating metadata.');
    } finally {
      setLoading(false);
    }}
    fetchMeta();
  },[])

 return (
  <main className="max-w-2xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Course Metadata Generator</h1>

    {/* Optional Error Display */}
    {error && (
      <p className="text-red-600 bg-red-100 p-2 rounded mb-4">{error}</p>
    )}

    {/* Metadata Display */}
    {metadata && (
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">{metadata.title}</h2>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Slug:</strong> <code>{metadata.slug}</code>
        </p>
        <p className="mb-2">
          <strong>Difficulty:</strong> {metadata.difficulty}
        </p>

        {/* metaDescription is a JSON string, so we parse it first */}
        {(() => {
          try {
            //const { description, keywords, modules } = JSON.parse(metadata.metaDescription);

            return (
              <>
                <p className="mb-2">
                  <strong>Description:</strong> 
                  {metadata.metaDescription}
                </p>

                <p className="mb-2">
                  <strong>Modules:</strong>
                 </p>
                <ul className="list-disc list-inside mb-2">
                  {metadata.modules?.map((mod: DBModule, i: number) => (
                    <li key={i}>{mod.title}</li>
                  ))}
                </ul>

               <div>
  <strong>Keywords:</strong>
  <ul>
    {Array.isArray(metadata.keywords) ? (
      metadata.keywords.map((keyword, idx) => (
        <li key={idx}>{keyword}</li>
      ))
    ) : (
      <li>{metadata.keywords}</li>
    )}
  </ul>
</div>

              </>
            );
          } catch (err) {
            return <p className="text-red-500">Invalid metaDescription JSON.</p>;
          }
        })()}

        {/* Optional Progress */}
        {/* {metadata.progress !== undefined && (
          <div className="mt-4">
            <strong>Progress:</strong>{' '}
            <span>{metadata.progress}% complete</span>
          </div>
        )} */}
      </div>
    )}
  </main>
);
}
//import { AiCourse, Module, Lesson, Owner } from './types'; // Adjust the import path as necessary

/**
 * Parse JSON string into a valid AiCourse object.
 * Throws error if required fields are missing or malformed.
 */

/**
 * Parses AI-generated course JSON into a DBCourse object.
 */
export function parseCourseJSON(jsonString: string): DBCourse {
  try {
   
    const parsed = JSON.parse(jsonString);

    if (
      !parsed.title ||
      !parsed.slug ||
      !parsed.modules ||
      !Array.isArray(parsed.modules)
    ) {
      throw new Error("Missing required fields in course JSON");
    }

    const dbModules: DBModule[] = parsed.modules.map((mod: any, modIndex: number) => ({
      title: mod.title,
      position: modIndex + 1,
      lessons: (mod.lessons || []).map((lesson: any, lessonIndex: number): DBLesson => ({
        title: lesson.title,
        content: lesson.content || '',
        position: lessonIndex + 1,
      })),
    }));

    const dbCourse: DBCourse = {
      title: parsed.title,
      slug: parsed.slug,
      keywords: parsed.keywords || [],
      metaDescription: parsed.description || '',
      difficulty: parsed.difficulty || 'Intermediate',
      modules: dbModules,
      owners: parsed.owners || [Owner.STAFF],
      done: parsed.done || [],
      faqs: parsed.faqs || [],
    };

    return dbCourse;
  } catch (err) {
    console.error("(parse course json:)Failed to parse course JSON:", err);
    throw err;
  }
}


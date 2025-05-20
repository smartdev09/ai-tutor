'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { courseService } from '@/lib/services/course';
import { Owner } from '@/types';

// Types based on the provided schema
type Faqs = {
  question: string;
  answer: string;
};

type DBCourse = {
  id?: string;
  owners: Owner[];
  metaDescription?: string;
  title: string;
  modules: DBModule[];
  difficulty: string;
  done?: string[];
  slug?: string;
  faqs?: Faqs[];
};

type DBModule = {
  id?: string;
  title: string;
  position: number;
  lessons: DBLesson[];
};

type DBLesson = {
  id?: string;
  title: string;
  content?: string;
  position: number;
};

const difficulties = ["beginner", "intermediate", "advanced"];

// Course topics for the select dropdown
const courseTopics = [
  "Machine Learning", "Python Programming", "JavaScript", "React", "Data Science",
  "Web Development", "Mobile App Development", "Cloud Computing", "DevOps",
  "Cybersecurity", "Blockchain", "Artificial Intelligence", "UX Design",
  "Digital Marketing", "SEO", "TypeScript", "Node.js"
  // Add more topics as needed
];

// Helper function to create a slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Parse course from markdown
const parseCourseFromMarkdown = (markdown: string, difficulty: string): DBCourse | null => {
  try {
    const lines = markdown.split('\n');
    const currentCourse: DBCourse = { 
      title: '', 
      modules: [], 
      difficulty: difficulty, 
      done: [],
      owners: []
    };
    let currentModule: DBModule | null = null;
    let processingFAQs = false;
    let currentFaq: Faqs | null = null;
    let currentLessonIndex = 0;

    for (const line of lines) {
      if (processingFAQs) {
        const faqMatch = line.match(/^\d+\.\s+\*\*(.*?)\*\*\s*$/);
        if (faqMatch) {
          if (currentFaq) {
            currentCourse.faqs!.push(currentFaq);
          }
          currentFaq = {
            question: faqMatch[1].trim(),
            answer: ''
          };
        } else if (line.trim() !== '') {
          if (currentFaq) {
            currentFaq.answer += (currentFaq.answer ? '\n' : '') + line.trim();
          }
        }
      } else if (line.includes('**FAQs**')) {
        processingFAQs = true;
        currentCourse.faqs = [];
        currentFaq = null;
      } else if (line.startsWith('# ')) {
        currentCourse.title = line.substring(2).trim();
        currentCourse.slug = slugify(currentCourse.title);
      } else if (line.includes('**Meta Description:**')) {
        currentCourse.metaDescription = line.substring(line.indexOf('**Meta Description:**') + 21).trim();
      } else if (line.startsWith('## ')) {
        if (currentModule) {
          currentCourse.modules.push(currentModule);
          currentLessonIndex = 0;
        }
        currentModule = {
          title: line.substring(3).trim(),
          position: currentCourse.modules.length,
          lessons: []
        };
      } else if (line.startsWith('- ')) {
        if (currentModule) {
          const cleanedLesson = line.substring(2).replace(/\*/g, '').trim();
          currentModule.lessons.push({
            title: cleanedLesson,
            position: currentLessonIndex++,
            content: ""
          });
        }
      }
    }

    if (currentModule) {
      currentCourse.modules.push(currentModule);
    }

    if (processingFAQs && currentFaq) {
      currentCourse.faqs!.push(currentFaq);
    }

    return currentCourse;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return null;
  }
};

export default function CourseGenerator() {
  const [topic, setTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [lang, setLang] = useState<string>('en');
  const [course, setCourse] = useState<DBCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  const [savingStatus, setSavingStatus] = useState<{success: number; failure: number}>({ success: 0, failure: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Use the completion hook for streaming course generation
  const {
    completion,
    complete,
    isLoading,
    stop
  } = useCompletion({
    api: '/api/generate-course',
    body: {
      term: topic === 'custom' ? customTopic : topic,
      difficulty,
      lang
    },
    onFinish: async (prompt, completion) => {
      try {
        const parsedCourse = parseCourseFromMarkdown(completion, difficulty);
        if (parsedCourse) {
          setCourse(parsedCourse);
          addLog(`✅ Successfully generated course: ${parsedCourse.title}`);
          
          // Save the course to the database
          await saveCourse(parsedCourse);
          setGeneratedCount(prev => prev + 1);
          
          // If batch mode is on and we haven't reached the limit, generate the next course
          if (generatedCount + 1 < batchSize) {
            setTimeout(() => {
              generateRandomCourse();
            }, 1000);
          }
        } else {
          setError('Failed to parse course content');
          addLog('❌ Failed to parse course content');
        }
      } catch (error) {
        setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    onError: (error) => {
      setError(error.message);
      addLog(`❌ Error: ${error.message}`);
    }
  });

  // Add log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Auto scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Update course state as new content streams in
  useEffect(() => {
    if (completion) {
      try {
        const parsedCourse = parseCourseFromMarkdown(completion, difficulty);
        if (parsedCourse && (parsedCourse.title || parsedCourse.modules?.length > 0)) {
          setCourse(parsedCourse);
        }
      } catch {
        console.error('Error parsing streaming content');
      }
    }
  }, [completion, difficulty]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLogs([]);
    setGeneratedCount(0);
    setSavingStatus({ success: 0, failure: 0 });
    
    const selectedTopic = topic === 'custom' ? customTopic : topic;
    
    if (!selectedTopic) {
      setError('Please select or enter a topic');
      return;
    }
    
    addLog(`🚀 Starting course generation: ${selectedTopic} (${difficulty})`);
    complete('');
  };

  // Generate a course with a random topic
  const generateRandomCourse = () => {
    const randomTopic = courseTopics[Math.floor(Math.random() * courseTopics.length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    setTopic('custom');
    setCustomTopic(randomTopic);
    setDifficulty(randomDifficulty);
    
    addLog(`🎲 Generating random course: ${randomTopic} (${randomDifficulty})`);
    complete('');
  };

  // Save course to database
  const saveCourse = async (course: DBCourse) => {
    try {
      addLog(`💾 Saving course to database: ${course.title}`);
      
      // const response = await fetch('/api/generate-courses', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(course)
      // });
      course.owners = [Owner.COMMUNITY];
      const createdCourse = await courseService.createCourse(course);
      
      if (createdCourse) {
        addLog(`✅ Course saved successfully: ${createdCourse.title}`);
        setSavingStatus(prev => ({ ...prev, success: prev.success + 1 }));
        return true;
      } else {
        addLog(`❌ Failed to save course: ${error}`);
        setSavingStatus(prev => ({ ...prev, failure: prev.failure + 1 }));
        return false;
      }
    } catch (error) {
      addLog(`❌ Error saving course: ${error instanceof Error ? error.message : String(error)}`);
      setSavingStatus(prev => ({ ...prev, failure: prev.failure + 1 }));
      return false;
    }
  };

  // Handle batch generation
  const handleBatchGenerate = () => {
    setError(null);
    setLogs([]);
    setGeneratedCount(0);
    setSavingStatus({ success: 0, failure: 0 });
    generateRandomCourse();
  };

  // Cancel ongoing generation
  const handleCancel = () => {
    stop();
    addLog('🛑 Course generation cancelled');
  };

  // Render module list
  const renderModules = () => {
    if (!course || !course.modules) return null;
    
    return (
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-bold">{course.title}</h2>
        {course.metaDescription && (
          <p className="text-gray-600 italic">{course.metaDescription}</p>
        )}
        
        <div className="space-y-4">
          {course.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold text-lg">{module.title}</h3>
              <ul className="mt-2 space-y-1">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lessonIndex} className="text-gray-700 pl-4 border-l-2 border-gray-200">
                    {lesson.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {course.faqs && course.faqs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">FAQs</h3>
            <div className="space-y-4">
              {course.faqs.map((faq, index) => (
                <div key={index} className="border-b pb-3">
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-gray-600 mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">AI Course Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select a topic</option>
                  {courseTopics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="custom">Custom topic</option>
                </select>
              </div>
              
              {topic === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Topic
                  </label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Enter your custom topic"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  {difficulties.map((d) => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="it">Italian</option>
                  <option value="nl">Dutch</option>
                  <option value="ru">Russian</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !topic}
                className={`w-full py-2 px-4 rounded-md ${
                  isLoading || !topic
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Generating...' : 'Generate Course'}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-3">Batch Generation</h3>
              <div className="flex items-center space-x-2 mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Number of Courses:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                  className="border border-gray-300 rounded-md p-1 w-20"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleBatchGenerate}
                  disabled={isLoading}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Batch Generate
                </button>
                
                {isLoading && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              {(savingStatus.success > 0 || savingStatus.failure > 0) && (
                <div className="mt-4 text-sm">
                  <p>Generated: {generatedCount}/{batchSize}</p>
                  <p className="text-green-600">Saved: {savingStatus.success}</p>
                  <p className="text-red-600">Failed: {savingStatus.failure}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 bg-black text-green-400 p-4 rounded-lg shadow-md h-64 overflow-y-auto font-mono text-sm">
            <h3 className="text-white font-bold mb-2">Activity Log</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md min-h-[500px]">
            {error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-700 hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Generating your course...</p>
                {completion && (
                  <div className="mt-6 w-full max-w-md bg-white p-4 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Preview:</p>
                    <p className="font-medium truncate">{completion.split('\n')[0]}</p>
                  </div>
                )}
              </div>
            ) : course ? (
              renderModules()
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>Fill out the form and click Generate Course to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
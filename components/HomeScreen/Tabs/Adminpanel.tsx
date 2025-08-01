"use client"

import React, { useState } from 'react';
import { ArrowRightIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storeFineTuneData } from '@/lib/utils/storage';
import { useRouter } from 'next/navigation';
import text from '../../../messages/en.json'
const Adminpanel: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [courses, setCourses] = useState<string[]>([]);
  const [explainMore, setExplainMore] = useState(false);
  const [about, setAboutSelf] = useState('');
  const [goal, setGoal] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState("beginner");
  const router = useRouter();

  const addCourse = () => {
    if (topic.trim() && !courses.includes(topic.trim())) {
      setCourses([...courses, topic.trim()]);
      setTopic('');
    }
  };

  const removeCourse = (courseToRemove: string) => {
    setCourses(courses.filter(course => course !== courseToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCourse();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (courses.length === 0) return;

    setIsSubmitting(true);

    try {
      let sessionId = "";
      if (about || goal || customInstructions) {
        sessionId = storeFineTuneData({ about, goal, customInstructions });
      }

      // Send all courses at once to the generateMeta component
      const params = new URLSearchParams();
      params.append("courses", JSON.stringify(courses));
      params.append("difficulty", difficulty);
      if (sessionId) params.append("id", sessionId);

      // Navigate to metadata generation page with all courses
      router.push(`/ai/metaData?${params.toString()}`);
      
    } catch (error) {
      console.error('Error navigating to metadata generation:', error);
      alert('Error starting metadata generation. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="text-center max-w-xl mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">{text.landing.heading}</h1>
        <p className="text-purple-600 text-sm md:text-base">{text.landing.subheading}</p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-lg p-4 md:p-6 shadow-sm border border-purple-200">
        <div className="mb-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={text.landing.placeholder_topic}
            className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm md:text-base"
          />
          
          {/* Display added courses as badges */}
          {courses.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                >
                  <span>{course}</span>
                  <button
                    onClick={() => removeCourse(course)}
                    className="ml-2 hover:bg-purple-200 rounded-full p-1"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-purple-300 rounded-md px-2 md:px-4 py-1 pr-8 text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="beginner">{text.landing.beginner}</option>
                <option value="intermediate">{text.landing.intermediate}</option>
                <option value="advanced">{text.landing.advanced}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={explainMore}
                onChange={() => setExplainMore(!explainMore)}
                className="mr-2"
              />
              <span className="text-xs md:text-sm">{text.landing.explain_more}</span>
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full md:w-auto"
            disabled={isSubmitting || courses.length === 0}
          >
            <ArrowRightIcon className="mr-2" size={16} />
            {isSubmitting 
              ? `Processing ${courses.length} courses...` 
              : `Generate metadata for ${courses.length} course${courses.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>

        {explainMore && (
          <div className="border-t border-purple-200 pt-4 space-y-4">
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">{text.landing.about_self_label}</h3>
              <input
                type="text"
                value={about}
                onChange={(e) => setAboutSelf(e.target.value)}
                placeholder={text.landing.about_self_placeholder}
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
              />
            </div>

            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">{text.landing.goal_label}</h3>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={text.landing.goal_placeholder}
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
              />
            </div>

            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">{text.landing.custom_instructions_label}</h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={text.landing.custom_instructions_placeholder}
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Adminpanel;
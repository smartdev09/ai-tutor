"use client"

import React, { useState } from 'react';
import { StarIcon, BookOpen, UsersIcon, Rocket, ArrowRightIcon, MenuIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, active }) => {
  return (
    <div className={`flex items-center p-3 rounded-md cursor-pointer ${active ? 'bg-purple-100' : 'hover:bg-purple-100'}`}>
      <span className="mr-3">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <div className={`
      fixed top-0 left-0 z-30 h-screen bg-white border-r border-purple-200 p-4 flex flex-col transition-all duration-300 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 md:static md:w-72
    `}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-500 flex items-center justify-center text-white text-lg font-bold mr-2">
            AI
          </div>
          <div>
            <h1 className="font-bold text-purple-500">AI Tutor</h1>
            <p className="text-xs text-purple-500">by ai-tutor</p>
          </div>
        </div>
        <button className="md:hidden" onClick={onClose}>
          <XIcon className="text-purple-500" />
        </button>
      </div>
      <p className="text-xs text-purple-500 mb-6">Your personalized learning companion for any topic</p>

      <div className="mb-4">
        <SidebarItem icon="+" text="New Course" active />
      </div>

      <div className="space-y-1 mb-4">
        <SidebarItem icon={<BookOpen size={18} />} text="My Courses" />
        <SidebarItem icon={<StarIcon size={18} />} text="Staff Picks" />
        <SidebarItem icon={<UsersIcon size={18} />} text="Community" />
      </div>

      <div className="mt-auto bg-purple-50 rounded-md p-3">
        <div className="flex items-center mb-1">
          <Rocket size={18} className="text-purple-500" />
          <span className="ml-2 font-medium">Level Up</span>
        </div>
        <p className="text-xs text-purple-700">
          Get prepared for all your courses with benefits of the AI Tutor.
        </p>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [explainMore, setExplainMore] = useState(false);
  const [aboutSelf, setAboutSelf] = useState('');
  const [goal, setGoal] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="text-center max-w-xl mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">What can I help you learn?</h1>
        <p className="text-purple-600 text-sm md:text-base">Enter a topic below to generate a personalized course for it</p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-lg p-4 md:p-6 shadow-sm border border-purple-200">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. JavaScript Promises, React Hooks, Go Routines etc"
          className="w-full p-2 md:p-3 border border-purple-300 rounded-md mb-4 text-sm md:text-base"
        />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative">
              <select className="appearance-none bg-white border border-purple-300 rounded-md px-2 md:px-4 py-1 pr-8 text-sm">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
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
              <span className="text-xs md:text-sm">Explain more for a better course</span>
            </label>
          </div>

          <Button
            onClick={() => console.log('Generating course for:', topic)}
            className="w-full md:w-auto"
          >
            <ArrowRightIcon className="mr-2" size={16} />
            Generate Course
          </Button>
        </div>

        {explainMore && (
          <div className="border-t border-purple-200 pt-4 space-y-4">
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">Tell us about yourself</h3>
              <input
                type="text"
                value={aboutSelf}
                onChange={(e) => setAboutSelf(e.target.value)}
                placeholder="e.g. I am a frontend developer and have good knowledge of HTML, CSS, and JavaScript."
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">What is your goal with this course?</h3>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. I want to be able to build Node.js APIs with Express.js and MongoDB."
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">Custom Instructions (Optional)</h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Give additional instructions to the AI as if you were giving them to a friend."
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

const AITutorPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-purple-50">
      {/* Mobile header with hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-purple-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-500 flex items-center justify-center text-white text-lg font-bold mr-2">
            AI
          </div>
          <div>
            <h1 className="font-bold text-purple-500">AI Tutor</h1>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(true)}>
          <MenuIcon className="text-purple-500" />
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <MainContent />
    </div>
  );
};

export default AITutorPage;
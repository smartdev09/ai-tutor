'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeFineTuneData } from '@/lib/utils/storage';

export function AICourse() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [about, setAbout] = useState('');
  const [goal, setGoal] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!term) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Store fine-tuning data if available
    let sessionId = '';
    if (about || goal || customInstructions) {
      sessionId = storeFineTuneData({
        about,
        goal,
        customInstructions,
      });
    }
    
    // Construct the URL with parameters
    const params = new URLSearchParams();
    params.append('term', term);
    params.append('difficulty', difficulty);
    if (sessionId) {
      params.append('id', sessionId);
    }
    
    // Navigate to the search page with parameters
    router.push(`/ai/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AI Course Generator</h1>
        <p className="text-gray-600">
          Tell us what you want to learn, and our AI will create a customized course for you.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
            What would you like to learn?
          </label>
          <input
            type="text"
            id="term"
            placeholder="e.g., JavaScript, Machine Learning, Photography"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty Level
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div>
          <button
            type="button"
            onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
            className="text-blue-600 text-sm font-medium flex items-center"
          >
            {isAdvancedOptionsOpen ? 'Hide' : 'Show'} Advanced Options
            <svg
              className={`ml-1 w-4 h-4 transform ${isAdvancedOptionsOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {isAdvancedOptionsOpen && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-md">
              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
                  About You (Optional)
                </label>
                <textarea
                  id="about"
                  placeholder="Tell us about your background, experience level, etc."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Learning Goals (Optional)
                </label>
                <textarea
                  id="goal"
                  placeholder="What do you hope to achieve by learning this topic?"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  id="customInstructions"
                  placeholder="Any specific requirements or topics you want covered in the course?"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting || !term}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              isSubmitting || !term ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Creating Course...' : 'Generate Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
"use client"

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomeScreen: React.FC = () => {
  const t = useTranslations();
  const [topic, setTopic] = useState('');
  const [explainMore, setExplainMore] = useState(false);
  const [aboutSelf, setAboutSelf] = useState('');
  const [goal, setGoal] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  return (
    <div className="h-full flex-1 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="text-center max-w-xl mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">{t('landing.heading')}</h1>
        <p className="text-purple-600 text-sm md:text-base">{t('landing.subheading')}</p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-lg p-4 md:p-6 shadow-sm border border-purple-200">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t('landing.placeholder_topic')}
          className="w-full p-2 md:p-3 border border-purple-300 rounded-md mb-4 text-sm md:text-base"
        />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative">
              <select className="appearance-none bg-white border border-purple-300 rounded-md px-2 md:px-4 py-1 pr-8 text-sm">
                <option>{t('landing.beginner')}</option>
                <option>{t('landing.intermediate')}</option>
                <option>{t('landing.advanced')}</option>
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
              <span className="text-xs md:text-sm">{t('landing.explain_more')}</span>
            </label>
          </div>

          <Button
            onClick={() => console.log('Generating course for:', topic)}
            className="w-full md:w-auto"
          >
            <ArrowRightIcon className="mr-2" size={16} />
            {t('landing.generate_course')}
          </Button>
        </div>

        {explainMore && (
          <div className="border-t border-purple-200 pt-4 space-y-4">
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">{t('landing.about_self_label')}</h3>
              <input
                type="text"
                value={aboutSelf}
                onChange={(e) => setAboutSelf(e.target.value)}
                placeholder={t('landing.about_self_placeholder')}
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">{t('landing.goal_label')}</h3>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('landing.goal_placeholder')}
                className="w-full p-2 md:p-3 border border-purple-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <h3 className="text-xs md:text-sm font-medium mb-2">{t('landing.custom_instructions_label')}</h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={t('landing.custom_instructions_placeholder')}
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

export default HomeScreen;

"use client";

import React from 'react';
import { StarIcon, BookOpen, UsersIcon, Rocket, XIcon, Home } from 'lucide-react';

export type TabType = 'main' | 'myCourses' | 'staffPicks' | 'community';

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, active, onClick }) => {
  return (
    <div 
      className={`flex items-center p-3 rounded-md cursor-pointer ${active ? 'bg-purple-100' : 'hover:bg-purple-100'}`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <div className={`
      h-full bg-white border-r border-purple-200 p-4 flex flex-col
      md:static md:h-screen
      ${!isOpen && 'md:block'}
      ${isOpen ? 'fixed top-0 left-0 z-30 w-72 h-screen transition-all duration-300' : 'hidden'}
    `}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-500 flex items-center justify-center text-white text-lg font-bold mr-2">
            AI
          </div>
          <div>
            <h1 className="font-bold text-purple-500">AI Tutor</h1>
            <p className="text-xs text-purple-500">By AI-Tutor</p>
          </div>
        </div>
        <button className="md:hidden" onClick={onClose}>
          <XIcon className="text-purple-500" />
        </button>
      </div>

      <p className="text-xs text-purple-500 mb-6">Your personalized learning companion for any topic</p>

      <div className="mb-4">
        <SidebarItem 
          icon={<Home size={18} />} 
          text="New Course"
          active={activeTab === 'main'} 
          onClick={() => handleTabClick('main')} 
        />
      </div>

      <div className="space-y-1 mb-4">
        <SidebarItem 
          icon={<BookOpen size={18} />} 
          text="My Courses"
          active={activeTab === 'myCourses'} 
          onClick={() => handleTabClick('myCourses')} 
        />
        <SidebarItem 
          icon={<StarIcon size={18} />} 
          text="Staff Picks"
          active={activeTab === 'staffPicks'} 
          onClick={() => handleTabClick('staffPicks')} 
        />
        <SidebarItem 
          icon={<UsersIcon size={18} />} 
          text="Community"
          active={activeTab === 'community'}
          onClick={() => handleTabClick('community')} 
        />
      </div>

      <div className="mt-auto bg-purple-50 rounded-md p-3">
        <div className="flex items-center mb-1">
          <Rocket size={18} className="text-purple-500" />
          <span className="ml-2 font-medium">Level Up</span>
        </div>
        <p className="text-xs text-purple-700">Get prepared for all your courses with benefits of the AI Tutor.</p>
      </div>
    </div>
  );
};

export default Sidebar;

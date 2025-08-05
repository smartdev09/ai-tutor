"use client";
import {useRouter} from 'next/navigation'
import { useState,useEffect } from 'react';
import React from 'react';
import { StarIcon, BookOpen, UsersIcon, Rocket, XIcon, Home } from 'lucide-react';
import obj from '../../messages/en.json'
import { courseService } from '@/lib/services/course';
export type TabType = 'main' | 'myCourses' | 'staffPicks' | 'community'| 'adminPanel'|'dashboard';

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
 // const t = useTranslations();
const[userData,setUserData]=useState<any>(null)
const router=useRouter()
useEffect(() => {
  const fetchUser = async () => {
    const authData = await courseService.getUser();
    if (authData.notLoggedIn) {
      router.replace('/auth');
    } else {
      setUserData(authData);
    }
  };

  fetchUser();
}, []);
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      onClose();
    }
  }

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
            <h1 className="font-bold text-purple-500">{obj.landing.app_name}</h1>
            <p className="text-xs text-purple-500">{obj.landing.by_ai_tutor}</p>
          </div>
        </div>
        <button className="md:hidden" onClick={onClose}>
          <XIcon className="text-purple-500" />
        </button>
      </div>

      <p className="text-xs text-purple-500 mb-6">{obj.landing.tagline}</p>

      <div className="mb-4">
        <SidebarItem 
          icon={<Home size={18} />} 
          text={obj.landing.new_course} 
          active={activeTab === 'main'} 
          onClick={() => handleTabClick('main')} 
        />
      </div>

      <div className="space-y-1 mb-4">
        <SidebarItem 
          icon={<BookOpen size={18} />} 
          text={obj.landing.my_courses} 
          active={activeTab === 'myCourses'} 
          onClick={() => handleTabClick('myCourses')} 
        />
        <SidebarItem 
          icon={<StarIcon size={18} />} 
          text={obj.landing.staff_picks} 
          active={activeTab === 'staffPicks'} 
          onClick={() => handleTabClick('staffPicks')} 
        />
        <SidebarItem 
          icon={<UsersIcon size={18} />} 
          text={obj.landing.community} 
          active={activeTab === 'community'}
          onClick={() => handleTabClick('community')} 
        />
         {userData?.user?.role==='admin'&&(<SidebarItem 
          icon={<UsersIcon size={18} />} 
          text='Admin Panel' 
          active={activeTab === 'adminPanel'}
          onClick={() => handleTabClick('adminPanel')} 
        />)}
           {userData?.user?.role==='admin'&&<SidebarItem 
          icon={<UsersIcon size={18} />} 
          text='Admin Dashboard' 
          active={activeTab === 'dashboard'}
          onClick={() => handleTabClick('dashboard')} 
        />}
      </div>

      <div className="mt-auto bg-purple-50 rounded-md p-3">
        <div className="flex items-center mb-1">
          <Rocket size={18} className="text-purple-500" />
          <span className="ml-2 font-medium">{obj.landing.level_up}</span>
        </div>
        <p className="text-xs text-purple-700">{obj.landing.level_up_desc}</p>
      </div>
    </div>
  );
};

export default Sidebar;
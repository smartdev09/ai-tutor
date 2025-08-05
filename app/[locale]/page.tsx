"use client"
import { useState,useEffect } from 'react';
import { MenuIcon } from 'lucide-react';
import Sidebar from '@/components/HomeScreen/Sidebar';
import HomeScreen from '@/components/HomeScreen/Tabs/Main';
import YourCourses from '@/components/HomeScreen/Tabs/MyCourses';
import FeaturedCourses from '@/components/HomeScreen/Tabs/StaffPicks';
import ExploreCourses from '@/components/HomeScreen/Tabs/Community';
import { TabType } from '@/components/HomeScreen/Sidebar';
import Adminpanel from '@/components/HomeScreen/Tabs/Adminpanel';
import AdminDashboard from '@/components/HomeScreen/Tabs/AdminDashboard';
import {courseService} from '@/lib/services/course'
import { useRouter } from 'next/navigation';
export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('main');
const router=useRouter()
const[userData,setUserData]=useState<any>(null)
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
  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return <HomeScreen />;
      case 'myCourses':
        return <YourCourses />;
      case 'staffPicks':
        return <FeaturedCourses />;
      case 'community':
        return <ExploreCourses />;
      case 'adminPanel':
         return userData?.user?.role=='admin' && <Adminpanel/>
      case 'dashboard':
         return userData?.user?.role=='admin' &&<AdminDashboard/>
      default:
        return <HomeScreen />;
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-purple-50">
      
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-purple-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-500 flex items-center justify-center text-white text-lg font-bold mr-2">
            AI
          </div>
          <h1 className="font-bold text-purple-500">AI Tutor</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)}>
          <MenuIcon className="text-purple-500" />
        </button>
      </div>
      
      {/* Main content layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed width on desktop, overlay on mobile */}
        <div className="hidden md:block w-72 flex-shrink-0">
          <Sidebar
            isOpen={true}
            onClose={() => {}}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
        
        {/* Mobile Sidebar - Only rendered when open */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="md:hidden">
              <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </>
        )}
        
        {/* Main Content Area - Takes remaining width */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
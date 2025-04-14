import { AiCourse, Module } from '@/types';
import { ModuleItem } from './ModuleItem';
import { BookOpen } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { useState } from 'react';
import { LessonContent } from './LessonContent';
import { RegenerateButton } from '../CourseControls/RegenerateButton';

interface ModuleListProps {
  course: AiCourse;
  handleRegenerate: () => void;
}

export function ModuleList({ course, handleRegenerate }: ModuleListProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  return (
    <div className="flex h-full">
      <SidebarProvider>
        <Sidebar className="w-72">
          <div className="flex h-14 items-center border-b px-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Course Modules</h2>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {course.modules.map((module, index) => (
                <ModuleItem 
                  key={module.title} 
                  module={module} 
                  moduleNumber={index + 1}
                  isSelected={selectedModule?.title === module.title}
                  onSelect={() => setSelectedModule(module)}
                />
              ))}
            </div>
          </ScrollArea>
        </Sidebar>
      </SidebarProvider>
      <div className="w-full p-6">
      <div className="flex  mb-6">
        {/* <CourseHeader course={course} /> */}
        <RegenerateButton onRegenerate={handleRegenerate} />
      </div>
        {selectedModule ? (
          <LessonContent module={selectedModule} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a module to view its content
          </div>
        )}
      </div>
    </div>
  );
} 
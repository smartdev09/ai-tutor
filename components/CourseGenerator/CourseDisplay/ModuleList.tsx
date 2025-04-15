"use client"

import type { AiCourse } from "@/types"
import { ModuleItem } from "./ModuleItem"
import { BookOpen, GraduationCap, Sparkles, Minimize2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar, SidebarHeader, SidebarProvider, SidebarRail } from "@/components/ui/sidebar"
import { useState, useEffect } from "react"
import { LessonContent } from "./LessonContent"
import { RegenerateButton } from "../CourseControls/RegenerateButton"

interface ModuleListProps {
  isLoading: boolean
  course: AiCourse
  handleRegenerate: () => void
  streamingModuleIndex?: number
}

export function ModuleList({ isLoading, course, handleRegenerate, streamingModuleIndex = -1 }: ModuleListProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
  const [moduleProcessed, setModuleProcessed] = useState<boolean[]>([])
  const [allModulesGenerated, setAllModulesGenerated] = useState<boolean>(false)
  const [expandedModules, setExpandedModules] = useState<number[]>([])

  // Initialize the moduleProcessed array when modules are loaded
  useEffect(() => {
    if (course.modules.length > 0) {
      setModuleProcessed(new Array(course.modules.length).fill(false))
    }
  }, [course.modules.length])

  // Check if all modules are generated
  useEffect(() => {
    if (!isLoading && streamingModuleIndex === -1 && course.modules.length > 0) {
      setAllModulesGenerated(true)
    }
  }, [isLoading, streamingModuleIndex, course.modules.length])

  // Handle module selection - immediately select the module without checking isProcessing
  const handleModuleSelection = (index: number) => {
    setCurrentModuleIndex(index)
  }

  // Handle module processing completion
  const handleModuleProcessed = () => {
    if (currentModuleIndex !== null) {
      const newProcessed = [...moduleProcessed]
      newProcessed[currentModuleIndex] = true
      setModuleProcessed(newProcessed)
    }
  }

  // Collapse all opened modules
  const collapseAll = () => {
    setExpandedModules([])
    setCurrentModuleIndex(null)
  }

  // Check if all modules are processed
  const allProcessed = moduleProcessed.length > 0 && moduleProcessed.every((processed) => processed)

  // Add the handleModuleExpand function
  const handleModuleExpand = (index: number, isExpanded: boolean) => {
    if (isExpanded && !expandedModules.includes(index)) {
      setExpandedModules([...expandedModules, index])
    } else if (!isExpanded && expandedModules.includes(index)) {
      setExpandedModules(expandedModules.filter((i) => i !== index))
    }
  }

  return (
    <div className="flex h-full">
      <SidebarProvider>
        <Sidebar className="w-80 border-r">
          <SidebarHeader className="border-b border-purple-100 pb-4">
            <div className="flex items-center gap-3 px-1">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-2.5 rounded-xl shadow-md shadow-purple-200/50 transform transition-transform hover:scale-105">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-600">
                Course Modules
              </h2>
              {!isLoading && (
                <button
                  onClick={collapseAll}
                  className="ml-auto flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full border border-purple-100 shadow-sm hover:bg-purple-100 transition-colors"
                  title="Collapse all sections"
                >
                  <Minimize2 className="h-3.5 w-3.5 text-purple-600" />
                </button>
              )}
              {((streamingModuleIndex !== undefined && streamingModuleIndex >= 0) || isLoading) && (
                <div className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100 shadow-sm">
                  <div className="relative">
                    <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-400 rounded-full animate-ping"></span>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 rounded-full"></div>
          </SidebarHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {course.modules.map((module, index) => (
                <ModuleItem
                  key={module.title}
                  module={module}
                  moduleNumber={index + 1}
                  isSelected={currentModuleIndex === index}
                  isExpanded={expandedModules.includes(index)}
                  onExpandChange={(isExpanded) => handleModuleExpand(index, isExpanded)}
                  onSelect={() => handleModuleSelection(index)}
                  isStreaming={index === streamingModuleIndex}
                />
              ))}
            </div>
          </ScrollArea>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>

      <div className="w-full p-6">
        <RegenerateButton onRegenerate={handleRegenerate} />

        {!allModulesGenerated ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
            <div className="bg-primary/10 p-6 rounded-full">
              <Sparkles className="animate-spin h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Generating Course Content</h2>
            <p className="text-muted-foreground max-w-md">Please wait while all modules are being generated...</p>
          </div>
        ) : allProcessed ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
            <div className="bg-primary/10 p-6 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">You have completed the course!</h2>
            <p className="text-muted-foreground max-w-md">
              All modules have been shown. You can now review the course or regenerate the content.
            </p>
          </div>
        ) : currentModuleIndex === null ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
            <div className="bg-primary/10 p-6 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Select a Module</h2>
            <p className="text-muted-foreground max-w-md">Please select a module from the sidebar to start learning.</p>
          </div>
        ) : (
          <LessonContent
            module={course.modules[currentModuleIndex]}
            onModuleProcessed={handleModuleProcessed}
            viewMode={false}
          />
        )}
      </div>
    </div>
  )
}
"use client"

import type { AiCourse, DBCourse } from "@/types"
import { ModuleItem } from "./ModuleItem"
import { BookOpen, GraduationCap, Sparkles, Minimize2, Save, Loader } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar, SidebarHeader, SidebarProvider, SidebarRail } from "@/components/ui/sidebar"
import { useState, useEffect } from "react"
import { LessonContent } from "./LessonContent"
import { RegenerateButton } from "../CourseControls/RegenerateButton"
import { Button } from "@/components/ui/button"
import { courseService } from "@/lib/services/course"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setCurrentModule,
  setCurrentLesson,
  setExpandedModules,
  setProcessedModule,
  toggleModuleExpansion,
  setIsSaving
} from "@/store/courseSlice"
import { toast } from "@/hooks/use-toast"

interface ModuleListProps {
  isLoading: boolean
  course: AiCourse
  handleRegenerate: () => void
  streamingModuleIndex?: number
}

export function ModuleList({ isLoading, course, handleRegenerate, streamingModuleIndex = -1 }: ModuleListProps) {
  const dispatch = useAppDispatch()
  const currentModuleIndex = useAppSelector(state => state.course.currentModuleIndex)
  const currentLessonIndex = useAppSelector(state => state.course.currentLessonIndex)
  const expandedModules = useAppSelector(state => state.course.expandedModules)
  const isSaving = useAppSelector(state => state.course.isSaving)
  
  const [waitingForLesson, setWaitingForLesson] = useState<boolean>(false)
  const [allModulesGenerated, setAllModulesGenerated] = useState<boolean>(false)
  const [processingModuleIndex, setProcessingModuleIndex] = useState<number | null>(null)

  useEffect(() => {
    if (course.modules.length > 0 && (isLoading || streamingModuleIndex !== -1)) {
      const moduleIndices = course.modules.map((_, index) => index)
      dispatch(setExpandedModules(moduleIndices))
    }
  }, [course.modules, course.modules.length, dispatch, isLoading, streamingModuleIndex])

  useEffect(() => {
    if (!isLoading && streamingModuleIndex === -1 && course.modules.length > 0) {
      setAllModulesGenerated(true)
    }
  }, [isLoading, streamingModuleIndex, course.modules.length])

  const handleModuleSelection = (index: number) => {
    if (isLoading || streamingModuleIndex !== -1) return
    
    if (processingModuleIndex !== null) return
    
    dispatch(setCurrentModule(index))
    dispatch(setCurrentLesson(0))
    setWaitingForLesson(false)
    setProcessingModuleIndex(index)
  }

  const handleLessonSelection = (moduleIndex: number, lessonIndex: number) => {
    if (isLoading || streamingModuleIndex !== -1) return
    
    dispatch(setCurrentModule(moduleIndex))
    dispatch(setCurrentLesson(lessonIndex))
    setWaitingForLesson(true)

    if (!expandedModules.includes(moduleIndex)) {
      dispatch(toggleModuleExpansion(moduleIndex))
    }
  }

  const handleModuleProcessed = () => {
    if (currentModuleIndex !== null) {
      dispatch(setProcessedModule(currentModuleIndex))
      setProcessingModuleIndex(null)
    }
  }

  const collapseAll = () => {
    if (isLoading || streamingModuleIndex !== -1) return
    
    dispatch(setExpandedModules([]))
    dispatch(setCurrentModule(null))
  }

  const handleModuleExpand = (index: number, isExpanded: boolean) => {
    if (isLoading || streamingModuleIndex !== -1) return
    
    if (isExpanded !== expandedModules.includes(index)) {
      dispatch(toggleModuleExpansion(index))
    }
  }

  const handleLessonReached = (lessonIndex: number) => {
    if (waitingForLesson && lessonIndex === currentLessonIndex) {
      setWaitingForLesson(false)
    }
  }

  const handleSaveCourse = async () => {
    try {
      dispatch(setIsSaving(true))
      
      const dbCourse: DBCourse = {
        title: course.title,
        difficulty: course.difficulty,
        slug: course.slug,
        modules: course.modules.map((module, moduleIndex) => ({
          title: module.title,
          position: moduleIndex,
          lessons: module.lessons.map((lesson, lessonIndex) => ({
            title: lesson,
            position: lessonIndex
          }))
        }))
      }

      await courseService.createCourse(dbCourse)
      toast({
        title: "Success",
        description: "Course saved successfully!"
      })
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error saving course')
    } finally {
      dispatch(setIsSaving(false))
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
              {!isLoading && streamingModuleIndex === -1 && (
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
              {course.modules.map((module, index) => {
                // During generation, all modules should be disabled
                // During processing of a specific module, only other modules should be disabled
                const isModuleDisabled = isLoading || streamingModuleIndex !== -1 || 
                                        (processingModuleIndex !== null && processingModuleIndex !== index);
                
                return (
                  <ModuleItem
                    key={module.title}
                    module={module}
                    moduleNumber={index + 1}
                    isSelected={currentModuleIndex === index}
                    isExpanded={expandedModules.includes(index)}
                    onExpandChange={(isExpanded) => handleModuleExpand(index, isExpanded)}
                    onSelect={() => handleModuleSelection(index)}
                    isStreaming={index === streamingModuleIndex}
                    onLessonSelect={handleLessonSelection}
                    selectedLessonIndex={currentModuleIndex === index ? currentLessonIndex : undefined}
                    waitingForLesson={currentModuleIndex === index ? waitingForLesson : false}
                    disabled={isModuleDisabled}
                  />
                );
              })}
            </div>
          </ScrollArea>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>

      <div className="w-full p-6">
        <div className="flex mb-4">
          <RegenerateButton onRegenerate={handleRegenerate} />
          <Button
            onClick={handleSaveCourse}
            className="ml-2"
            disabled={isSaving || isLoading || streamingModuleIndex !== -1}
          >
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Course
              </>
            )}
          </Button>
        </div>

        {!allModulesGenerated ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
            <div className="bg-primary/10 p-6 rounded-full">
              <Sparkles className="animate-spin h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Generating Course Content</h2>
            <p className="text-muted-foreground max-w-md">Please wait while all modules are being generated...</p>
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
            initialLessonIndex={currentLessonIndex}
            waitingForLesson={waitingForLesson}
            onLessonReached={handleLessonReached}
          />
        )}
      </div>
    </div>
  )
}
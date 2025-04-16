"use client"

import type { Module } from "@/types"
import { useCompletion } from "@ai-sdk/react"
import { useState, useEffect, useRef } from "react"
import { parseContentFromMarkdown } from "@/lib/utils"
import { BookOpen } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface LessonContentProps {
  module: Module
  onModuleProcessed: () => void
}

export function LessonContent({ module, onModuleProcessed }: LessonContentProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processedLessons, setProcessedLessons] = useState<Record<number, string>>({})
  const [generatingLessonIndex, setGeneratingLessonIndex] = useState<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const moduleRef = useRef<string>("")

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/generate-lesson",
  })

  const currentContent = processedLessons[currentLessonIndex] || ""
  const parsedContent = parseContentFromMarkdown(isProcessing ? (completion || "") : currentContent)

  useEffect(() => {
    if (moduleRef.current !== module?.title) {
      moduleRef.current = module?.title || ""
      setCurrentLessonIndex(0)
      setGeneratingLessonIndex(0)
      setProcessedLessons({})
      
      setIsProcessing(true)
      setTimeout(() => {
        complete("", { 
          body: {
            moduleTitle: module?.title,
            lessonTitle: module?.lessons[generatingLessonIndex] || ""
          }
        })
      }, 100)
    }
  }, [module?.title, complete, generatingLessonIndex, module?.lessons])

  useEffect(() => {
    if (!isLoading && completion && isProcessing) {
      setProcessedLessons((prev) => ({
        ...prev,
        [generatingLessonIndex]: completion,
      }))

      const timer = setTimeout(() => {
        if (generatingLessonIndex < module?.lessons?.length - 1) {
          setGeneratingLessonIndex((prevIndex) => prevIndex + 1)
          complete("", { 
            body: {
              moduleTitle: module?.title,
              lessonTitle: module?.lessons[generatingLessonIndex + 1] || ""
            }
          })
        } else {
          setIsProcessing(false)
          onModuleProcessed()
        }
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [
    isLoading,
    completion,
    generatingLessonIndex,
    module?.lessons,
    onModuleProcessed,
    complete,
    isProcessing,
    module?.title,
  ])

  const navigateToLesson = (index: number) => {
    if (index >= 0 && index < module?.lessons?.length && !isProcessing) {
      setCurrentLessonIndex(index)
    }
  }

  const progressPercentage = module?.lessons?.length
    ? ((generatingLessonIndex + 1) / module.lessons.length) * 100
    : 0

  const currentLessonTitle = isProcessing 
    ? module?.lessons[generatingLessonIndex] || ""
    : module?.lessons[currentLessonIndex] || ""
  
  const currentLessonNumber = isProcessing 
    ? generatingLessonIndex + 1
    : currentLessonIndex + 1
    
  const hasMultipleLessons = module?.lessons?.length > 1

  return (
    <div className="space-y-4 w-full mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-white" />
            <h2 className="text-2xl text-white font-bold">{module?.title}</h2>
          </div>

          {isLoading && isProcessing && (
            <div className="flex items-center gap-2 text-sm text-white bg-white/20 px-3 py-1 rounded-full">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <span>Generating magic...</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-white/90 text-sm mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-white/30" />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-white/90 flex items-center gap-2">
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
              {currentLessonNumber}/{module?.lessons?.length}
            </span>
            <span className="text-sm font-medium">{currentLessonTitle}</span>
          </p>
        </div>

        {hasMultipleLessons && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {module?.lessons?.map((lesson, index) => (
              <button
                key={index}
                onClick={() => navigateToLesson(index)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  (isProcessing ? false : currentLessonIndex === index)
                    ? "bg-white text-purple-700 font-medium shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={`Lesson ${index + 1}`}
                disabled={isProcessing}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="text-white p-4 bg-red-500/90 rounded-lg mt-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Error loading lesson content. Please try again.
        </div>
      )}

      <div
        className="bg-white rounded-xl p-8 min-h-[85vh] overflow-auto shadow-md border border-gray-100"
        ref={contentRef}
      >
        <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
          <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />

          {isLoading && isProcessing && (
            <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
          )}
        </div>
      </div>
    </div>
  )
}
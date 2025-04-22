"use client"

import type { Module } from "@/types"
import { useCompletion } from "@ai-sdk/react"
import { useState, useEffect, useRef } from "react"
import { parseContentFromMarkdown } from "@/lib/utils"
import { BookOpen, Loader } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { addProcessedLesson } from "@/store/courseSlice"

interface LessonContentProps {
  module: Module
  onModuleProcessed: () => void
  initialLessonIndex?: number
  waitingForLesson?: boolean
  onLessonReached?: (lessonIndex: number) => void
}

export function LessonContent({
  module,
  onModuleProcessed,
  initialLessonIndex = 0,
  waitingForLesson = false,
  onLessonReached
}: LessonContentProps) {
  const dispatch = useAppDispatch()
  const currentModuleIndex = useAppSelector(state => state.course.currentModuleIndex)
  const reduxProcessedLessons = useAppSelector(state => state.course.processedLessons)

  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(initialLessonIndex)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processedLessons, setProcessedLessons] = useState<Record<number, string>>({})
  const [generatingLessonIndex, setGeneratingLessonIndex] = useState<number>(0)
  const [userSelectedLesson, setUserSelectedLesson] = useState<boolean>(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const moduleRef = useRef<string>("")
  const processedModulesRef = useRef<{ [key: string]: boolean }>({})
  const [currentModuleTitle, setCurrentModuleTitle] = useState<string>("")

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/generate-lesson",
  })

  useEffect(() => {
    if (currentModuleIndex !== null && reduxProcessedLessons[currentModuleIndex]) {
      const moduleLessons = reduxProcessedLessons[currentModuleIndex]
      if (module?.title === currentModuleTitle) {
        setProcessedLessons(moduleLessons || {})
      }
    }
  }, [currentModuleIndex, currentModuleTitle, module?.title, reduxProcessedLessons])

  const currentContent = processedLessons[currentLessonIndex] || ""
  const parsedContent = parseContentFromMarkdown(
    generatingLessonIndex === currentLessonIndex && isProcessing
      ? (completion || "")
      : currentContent
  )

  useEffect(() => {
    if (initialLessonIndex !== currentLessonIndex) {
      setCurrentLessonIndex(initialLessonIndex);
      setUserSelectedLesson(true);
    }
  }, [initialLessonIndex, currentLessonIndex]);

  useEffect(() => {
    if (isProcessing && !userSelectedLesson) {
      setCurrentLessonIndex(generatingLessonIndex);
    }
  }, [generatingLessonIndex, isProcessing, userSelectedLesson]);

  useEffect(() => {
    if (moduleRef.current !== module?.title) {
      const previousModule = moduleRef.current
      moduleRef.current = module.title
      setCurrentModuleTitle(module.title)
      
      if (previousModule !== "") {
        setProcessedLessons({})
        setUserSelectedLesson(false)
      }

      const moduleKey = module?.title || ""
      const moduleLessons = currentModuleIndex !== null ? reduxProcessedLessons[currentModuleIndex] : {}

      if (
        moduleLessons &&
        Object.keys(moduleLessons).length === module?.lessons?.length &&
        module?.lessons?.every((_, index) => !!moduleLessons[index])
      ) {
        setProcessedLessons(moduleLessons)
        setIsProcessing(false)
        onModuleProcessed()

        if (waitingForLesson && onLessonReached) {
          onLessonReached(currentLessonIndex)
        }

        processedModulesRef.current[moduleKey] = true
      } else {
        let nextLessonToGenerate = 0
        if (moduleLessons) {
          while (nextLessonToGenerate < module?.lessons?.length && moduleLessons[nextLessonToGenerate]) {
            nextLessonToGenerate++
          }
        }

        setGeneratingLessonIndex(nextLessonToGenerate)
        if (!userSelectedLesson) {
          setCurrentLessonIndex(nextLessonToGenerate)
        }
        setIsProcessing(true)

        if (nextLessonToGenerate < module?.lessons?.length) {
          complete("", {
            body: {
              moduleTitle: module?.title,
              lessonTitle: module?.lessons[nextLessonToGenerate] || ""
            }
          })
        } else {
          setIsProcessing(false)
          onModuleProcessed()
        }
      }
    }
  }, [module?.title, module?.lessons, currentModuleIndex, reduxProcessedLessons, complete, onModuleProcessed, waitingForLesson, onLessonReached, currentLessonIndex, userSelectedLesson])

  useEffect(() => {
    if (!isLoading && completion && isProcessing) {
      const currentGeneratingIndex = generatingLessonIndex

      setProcessedLessons((prev) => ({
        ...prev,
        [currentGeneratingIndex]: completion,
      }))

      if (currentModuleIndex !== null) {
        dispatch(addProcessedLesson({
          moduleIndex: currentModuleIndex,
          lessonIndex: currentGeneratingIndex,
          content: completion
        }))
      }

      if (onLessonReached && currentGeneratingIndex === currentLessonIndex) {
        onLessonReached(currentGeneratingIndex)
      }

      if (currentGeneratingIndex < module?.lessons?.length - 1) {
        const nextIndex = currentGeneratingIndex + 1
        setGeneratingLessonIndex(nextIndex)

        setCurrentLessonIndex(nextIndex)
        setUserSelectedLesson(false)

        const hasNextLessonInRedux =
          currentModuleIndex !== null &&
          reduxProcessedLessons[currentModuleIndex] &&
          reduxProcessedLessons[currentModuleIndex][nextIndex]

        if (hasNextLessonInRedux) {
          setProcessedLessons((prev) => ({
            ...prev,
            [nextIndex]: reduxProcessedLessons[currentModuleIndex][nextIndex]
          }))

          let futureIndex = nextIndex + 1
          while (
            futureIndex < module?.lessons?.length &&
            currentModuleIndex !== null &&
            reduxProcessedLessons[currentModuleIndex] &&
            reduxProcessedLessons[currentModuleIndex][futureIndex]
          ) {
            setProcessedLessons((prev) => ({
              ...prev,
              [futureIndex]: reduxProcessedLessons[currentModuleIndex][futureIndex]
            }))
            futureIndex++
          }

          if (futureIndex < module?.lessons?.length) {
            setGeneratingLessonIndex(futureIndex)
            if (!userSelectedLesson) {
              setCurrentLessonIndex(futureIndex)
            }
            complete("", {
              body: {
                moduleTitle: module?.title,
                lessonTitle: module?.lessons[futureIndex] || ""
              }
            })
          } else {
            setIsProcessing(false)
            onModuleProcessed()
          }
        } else {
          complete("", {
            body: {
              moduleTitle: module?.title,
              lessonTitle: module?.lessons[nextIndex] || ""
            }
          })
        }
      } else {
        setIsProcessing(false)
        onModuleProcessed()
      }
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
    onLessonReached,
    currentLessonIndex,
    currentModuleIndex,
    dispatch,
    reduxProcessedLessons,
    userSelectedLesson
  ])

  const progressPercentage = module?.lessons?.length
    ? ((Object.keys(processedLessons).length) / module.lessons.length) * 100
    : 0

  const currentLessonTitle = module?.lessons[currentLessonIndex] || ""
  const currentLessonNumber = currentLessonIndex + 1
  const isLessonGenerated = !!processedLessons[currentLessonIndex]
  const isCurrentLessonBeingGenerated = isProcessing && generatingLessonIndex === currentLessonIndex
  const showLoader = (userSelectedLesson || waitingForLesson) && !isLessonGenerated && !isCurrentLessonBeingGenerated

  console.log(showLoader)

  return (
    <div className="space-y-4 w-full mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-white" />
            <h2 className="text-2xl text-white font-bold">{module?.title}</h2>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-white bg-white/20 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <span>Generating content...</span>
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
            {waitingForLesson && !isLessonGenerated && !isCurrentLessonBeingGenerated && (
              <span className="inline-flex items-center bg-white/20 px-2 py-1 rounded-full text-xs">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Waiting for content...
              </span>
            )}
          </p>
        </div>
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
        {showLoader ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            <div className="relative">
              <div className="bg-purple-100 p-5 rounded-full">
                <Loader className="h-12 w-12 text-purple-600 animate-spin" />
              </div>
              <div className="absolute -top-2 -right-2 h-4 w-4 bg-purple-500 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-800">Preparing your lesson</h3>
              <p className="text-muted-foreground max-w-md">
                Your selected lesson is being prepared. Please wait while we generate content for lessons in sequence.
              </p>
            </div>
          </div>
        ) : (
          <div className="prose prose-lg max-w-none relative min-h-[200px] lesson-content">
            <div className="content-container" dangerouslySetInnerHTML={{ __html: parsedContent }} />

            {isCurrentLessonBeingGenerated && (
              <span className="inline-block h-5 w-2 bg-purple-500 animate-pulse ml-0.5 align-bottom"></span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
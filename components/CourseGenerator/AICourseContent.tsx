"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { AiCourse } from "@/types/index"
import { updateCourseProgress } from "@/lib/utils/storage"
import { useTranslations } from "next-intl"
import ForkBanner from "../ui/fork"
import { useCompletion } from "@ai-sdk/react"
import { parseContentFromMarkdown } from "@/lib/utils"
import FurtherReading from "./CourseSlug/FurtherReading"

interface AICourseContentProps {
  courseSlug: string
  course: AiCourse
  isLoading: boolean
  isStreaming?: boolean
  error: string
  onRegenerateOutline: (prompt?: string) => void
}

export function AICourseContent({ course, isStreaming, error, onRegenerateOutline }: AICourseContentProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null)
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(null)
  const [lessonContent, setLessonContent] = useState<string>("")
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)
  const [lessonError, setLessonError] = useState("")
  const [regeneratePrompt, setRegeneratePrompt] = useState("")
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)
  const t = useTranslations()

  // State to track if the component has mounted
  const [hasMounted, setHasMounted] = useState(false)

  // Setup the completion hook for lesson content generation
  const {
    completion,
    complete,
    isLoading: isCompletionLoading,
    error: completionError,
  } = useCompletion({
    api: "/api/generate-lesson",
  })

  // Effect to set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Effect to update lesson content in real-time as it streams
  useEffect(() => {
    if (!hasMounted) return

    // Update content in real-time as it streams
    if (completion) {
      setLessonContent(completion)
    }

    // When loading is complete, mark the lesson as no longer loading
    setIsLoadingLesson(isCompletionLoading)
  }, [completion, isCompletionLoading, hasMounted])

  // Effect to handle completion errors
  useEffect(() => {
    if (!hasMounted) return

    if (completionError) {
      setLessonError(completionError.message || "Failed to generate lesson content")
      setIsLoadingLesson(false)
    }
  }, [completionError, hasMounted])

  const handleSelectLesson = useCallback(
    async (moduleIndex: number, lessonIndex: number) => {
      setSelectedModuleIndex(moduleIndex)
      setSelectedLessonIndex(lessonIndex)
      const currentModule = course.modules[moduleIndex]
      setLessonError("")

      // Clear previous content
      if (currentModule.lessons[lessonIndex].content) {
        setLessonContent(currentModule.lessons[lessonIndex].content)
      } else {
        const currentLesson = currentModule.lessons[lessonIndex]

        // Handle the lesson if it's an object instead of a string
        const lessonTitle =
          typeof currentLesson === "string" ? currentLesson : currentLesson?.title || "Untitled Lesson"

        // Generate content for this lesson using the completion hook
        setIsLoadingLesson(true)

        // Trigger the completion with the lesson details
        complete("", {
          body: {
            courseId: course.id || "",
            moduleTitle: typeof currentModule.title === "string" ? currentModule.title : "Untitled Module",
            lessonTitle,
          },
        })
      }
    },
    [complete, course.id, course.modules],
  )

  const handleToggleCompletion = (moduleIndex: number, lessonIndex: number) => {
    if (!course.id) return

    // Create a unique ID for this lesson
    const lessonId = `${moduleIndex}-${lessonIndex}`

    // Check if this lesson is already marked as completed
    const isCompleted = course?.done?.includes(lessonId)

    // Update course progress
    updateCourseProgress(course.id, lessonId, !isCompleted)

    // Update local state
    const updatedDone = isCompleted ? course?.done?.filter((id) => id !== lessonId) : [...(course.done || []), lessonId]

    course.done = updatedDone
  }

  const handleRegenerateOutline = () => {
    onRegenerateOutline(regeneratePrompt)
    setIsRegenerateOpen(false)
    setRegeneratePrompt("")
  }

  // Streaming state with partial content
  if (isStreaming) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            {course.title || "Generating Course..."}
            <span className="ml-3 inline-block h-4 w-4 rounded-full bg-blue-600 animate-pulse"></span>
          </h1>
          <p className="text-gray-600 mt-2">{t("ai-course-content.generating_course")}</p>
        </div>

        <div className="space-y-4">
          {course?.modules?.length > 0 ? (
            course.modules.map((module, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h2 className="text-lg font-semibold mb-2">
                  {typeof module.title === "string" ? module.title : "Module Title"}
                </h2>
                {module?.lessons?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {module.lessons.map((lesson, i) => (
                      <li key={i} className="text-gray-700">
                        {typeof lesson === "string" ? lesson : "Lesson Title"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-blue-600 animate-pulse">{t("ai-course-content.generating_lessons")}</div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-blue-600 animate-pulse">{t("ai-course-content.generating_lessons")}</div>
          )}
          {course?.modules?.length > 0 && (
            <div className="text-sm text-blue-600 animate-pulse mt-2">{t("ai-course-content.generating_more")}</div>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">{t("ai-course-content.error_generating_course")}</h3>
          <p>{error}</p>
        </div>
        <button
          onClick={() => onRegenerateOutline()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t("ai-course-content.try_again")}
        </button>
      </div>
    )
  }

  // Calculate progress
  const totalLessons = course?.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
  const completedLessons = course?.done?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Parse the markdown content to HTML
  const parsedContent = parseContentFromMarkdown(lessonContent)

  return (
    <div className="w-full mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Course Sidebar */}
        <div className="md:w-1/3 lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h1 className="text-xl font-bold mb-2">{course.title}</h1>
            <div className="flex items-center mb-4">
              <span className="text-sm font-medium text-gray-600 mr-2">{course.difficulty}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600 ml-2">
                {totalLessons} {t("ai-course-content.lessons")}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{t("ai-course-content.progress")}</span>
                <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            <Link href="/ai" className="text-sm text-blue-600 hover:underline flex items-center">
              <svg
                className="w-3.5 h-3.5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              {t("ai-course-content.back_to_tutor")}
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t("ai-course-content.course_outline")}</h2>
              <button
                onClick={() => setIsRegenerateOpen(!isRegenerateOpen)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                {t("ai-course-content.regenerate")}
              </button>
            </div>

            {isRegenerateOpen && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <textarea
                  value={regeneratePrompt}
                  onChange={(e) => setRegeneratePrompt(e.target.value)}
                  placeholder="Provide specific instructions for regenerating the course..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-2"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsRegenerateOpen(false)}
                    className="text-xs px-3 py-1 border border-gray-300 rounded"
                  >
                    {t("ai-course-content.cancel")}
                  </button>
                  <button
                    onClick={handleRegenerateOutline}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    {t("ai-course-content.regenerate")}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {course?.modules?.map((currentModule, moduleIndex) => (
                <div key={moduleIndex} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <h3
                    className="font-medium cursor-pointer mb-2 hover:text-blue-600"
                    onClick={() => setSelectedModuleIndex(selectedModuleIndex === moduleIndex ? null : moduleIndex)}
                  >
                    {typeof currentModule.title === "string" ? currentModule.title : "Module Title"}
                    <span className="text-xs text-gray-500 ml-1">({currentModule.lessons?.length || 0})</span>
                  </h3>

                  {selectedModuleIndex === moduleIndex && (
                    <ul className="pl-4 space-y-1">
                      {currentModule.lessons?.map((currentLesson, lessonIndex) => {
                        const lessonId = `${moduleIndex}-${lessonIndex}`
                        const isCompleted = course?.done?.includes(lessonId)
                        const isActive = selectedModuleIndex === moduleIndex && selectedLessonIndex === lessonIndex

                        const lessonTitle =
                          typeof currentLesson === "string" ? currentLesson : currentLesson?.title || "Untitled Lesson"

                        return (
                          <li key={lessonIndex} className="flex items-start">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleToggleCompletion(moduleIndex, lessonIndex)}
                              className="mr-2 mt-1"
                            />
                            <button
                              onClick={() => handleSelectLesson(moduleIndex, lessonIndex)}
                              className={`text-sm text-left ${isActive
                                  ? "text-blue-600 font-medium"
                                  : isCompleted
                                    ? "text-gray-500 line-through"
                                    : "text-gray-800"
                                }`}
                            >
                              {lessonTitle}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="md:w-2/3 lg:w-3/4">
          {!course.owners?.includes("USER") && <ForkBanner courseId={course.id ?? ""} />}
          {selectedModuleIndex !== null && selectedLessonIndex !== null ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-2">
                {(() => {
                  const lesson = course.modules[selectedModuleIndex].lessons[selectedLessonIndex]
                  return typeof lesson === "string" ? lesson : lesson?.title || "Untitled Lesson"
                })()}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {t("ai-course-content.module")} {(() => {
                  const module = course.modules[selectedModuleIndex]
                  return typeof module.title === "string" ? module.title : "Untitled Module"
                })()}
              </p>

              {lessonError ? (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">{t("ai-course-content.error_loading_lesson")}</h3>
                  <p>{lessonError}</p>
                  <button
                    onClick={() => handleSelectLesson(selectedModuleIndex, selectedLessonIndex)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    {t("ai-course-content.try_again_short")}
                  </button>
                </div>
              ) : (
                <div className="prose prose-blue max-w-none">
                  {/* Rendering the parsed HTML content with streaming support */}
                  {lessonContent ? (
                    <div className="relative">
                      <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
                      {(isLoadingLesson || isCompletionLoading) && (
                        <span className="inline-block h-5 w-2 bg-blue-500 animate-pulse ml-0.5 align-bottom"></span>
                      )}
                    </div>
                  ) : isLoadingLesson || isCompletionLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5 mb-6"></div>
                    </div>
                  ) : (
                    <p className="text-gray-500">{t("ai-course-content.no_content_available")}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                ></path>
              </svg>
              <h3 className="text-xl font-medium mb-2">{t("ai-course-content.select_lesson_to_begin")}</h3>
              <p className="text-gray-600 mb-4">{t("ai-course-content.click_module_expand")}</p>
            </div>
          )}
          <FurtherReading slug={course.slug ?? ""} />
        </div>
      </div>
    </div>
  )
}

"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import type { DBCourse } from "@/types/index"

interface CourseSidebarProps {
  course: DBCourse
  totalLessons: number
  progressPercentage: number
  selectedModuleIndex: number | null
  selectedLessonIndex: number | null
  setSelectedModuleIndex: (index: number | null) => void
  handleSelectLesson: (moduleIndex: number, lessonIndex: number) => void
  handleToggleCompletion: (moduleIndex: number, lessonIndex: number) => void
  isRegenerateOpen: boolean
  setIsRegenerateOpen: (isOpen: boolean) => void
  regeneratePrompt: string
  setRegeneratePrompt: (prompt: string) => void
  handleRegenerateOutline: () => void
}

export function CourseSidebar({
  course,
  totalLessons,
  progressPercentage,
  selectedModuleIndex,
  selectedLessonIndex,
  setSelectedModuleIndex,
  handleSelectLesson,
  handleToggleCompletion,
  isRegenerateOpen,
  setIsRegenerateOpen,
  regeneratePrompt,
  setRegeneratePrompt,
  handleRegenerateOutline,
}: CourseSidebarProps) {
  const t = useTranslations()

  return (
    <div className="md:w-1/4 lg:w-1/5 md:sticky md:top-0 md:self-start md:max-h-screen md:overflow-y-auto">
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
              <button onClick={handleRegenerateOutline} className="text-xs px-3 py-1 bg-blue-600 text-white rounded">
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
                          className={`text-sm text-left ${
                            isActive
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
  )
}
